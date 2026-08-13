import './env.js'
import { randomUUID } from 'crypto'
import QRCode from 'qrcode'
import Stripe from 'stripe'

let stripe = null

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) return null
  if (!stripe) {
    stripe = new Stripe(stripeSecretKey)
  }
  return stripe
}

function sanitizeStripeMetadata(metadata) {
  const sanitized = {}

  for (const [key, value] of Object.entries(metadata)) {
    if (Object.keys(sanitized).length >= 50) break
    sanitized[String(key).slice(0, 40)] = String(value ?? '').slice(0, 500)
  }

  return sanitized
}

function normalizeOrigin(value) {
  if (!value || typeof value !== 'string') return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.origin
  } catch {
    return null
  }
}

function originFromReferer(referer) {
  if (!referer || typeof referer !== 'string') return null

  try {
    return normalizeOrigin(new URL(referer).origin)
  } catch {
    return null
  }
}

function originFromForwardedHeaders(req) {
  const host = req?.headers?.['x-forwarded-host']
  if (!host) return null

  const proto = req.headers['x-forwarded-proto'] || 'https'
  const primaryHost = String(host).split(',')[0].trim()
  return normalizeOrigin(`${proto}://${primaryHost}`)
}

export function resolveClientUrl(req, bodyOrigin) {
  const candidates = [
    normalizeOrigin(bodyOrigin),
    normalizeOrigin(req?.headers?.origin),
    originFromReferer(req?.headers?.referer),
    originFromForwardedHeaders(req),
    normalizeOrigin(process.env.CLIENT_URL),
  ]

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (vercelUrl) {
    candidates.push(normalizeOrigin(`https://${vercelUrl}`))
  }

  for (const origin of candidates) {
    if (origin) return origin
  }

  return 'http://127.0.0.1:5173'
}

function getClientUrl(req, bodyOrigin) {
  return resolveClientUrl(req, bodyOrigin)
}

function shouldSkipTrial(metadata, options = {}) {
  if (options.skipTrial === true) return true
  const value = metadata?.skipTrial ?? metadata?.skip_trial
  return value === true || value === 'true' || value === '1'
}

export async function createCheckoutSession(metadata, req, bodyOrigin, options = {}) {
  const client = getStripe()
  const stripePriceId = process.env.STRIPE_PRICE_ID
  const clientUrl = getClientUrl(req, bodyOrigin)
  const submissionId = randomUUID()
  const skipTrial = shouldSkipTrial(metadata, options)
  const enrichedMetadata = sanitizeStripeMetadata({
    ...metadata,
    submissionId,
    submittedAt: new Date().toISOString(),
    subscribed_int: '0',
    skip_trial: skipTrial ? 'true' : 'false',
  })

  if (!client || !stripePriceId) {
    return { demo: true, submissionId, skipTrial }
  }

  const session = await client.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/checkout/cancelled`,
    phone_number_collection: {
      enabled: false,
    },
    subscription_data: skipTrial ? {} : { trial_period_days: 7 },
    metadata: enrichedMetadata,
  })

  return { url: session.url, submissionId, skipTrial }
}

export async function getCheckoutRedeemInfo(sessionId, req, bodyOrigin) {
  const clientUrl = getClientUrl(req, bodyOrigin)
  const redeemBase = (process.env.REDEEM_URL || `${clientUrl}/redeem`).replace(/\/$/, '')
  const client = getStripe()

  let email = null
  let redeemUrl = redeemBase

  if (client && sessionId) {
    const session = await client.checkout.sessions.retrieve(sessionId)
    email = session.customer_details?.email ?? session.customer_email ?? null
    const params = new URLSearchParams({ session_id: sessionId })
    if (email) params.set('email', email)
    redeemUrl = `${redeemBase}?${params.toString()}`
  } else if (sessionId) {
    redeemUrl = `${redeemBase}?session_id=${encodeURIComponent(sessionId)}`
  } else {
    redeemUrl = `${redeemBase}?demo=1`
  }

  const qrDataUrl = await QRCode.toDataURL(redeemUrl, {
    margin: 1,
    width: 220,
    color: { dark: '#000000', light: '#ffffff' },
  })

  return {
    redeemUrl,
    qrDataUrl,
    email,
    demo: !client || !sessionId,
  }
}
