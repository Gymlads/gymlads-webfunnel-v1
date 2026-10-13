// API van de webfunnel voor Cloudflare Pages Functions.
// Doet hetzelfde als server/app.js (Express, voor Vercel/lokaal):
// Stripe-betaalpagina maken, e-mailadres na betaling opzoeken, en na een
// geslaagde checkout de onboarding-antwoorden via de Stripe-webhook naar n8n sturen.
// Instellingen komen uit de omgevingsvariabelen van het Cloudflare-project.
import Stripe from 'stripe'
import { buildN8nPayloadFromMetadata } from '../../server/submission.js'

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function getStripe(env) {
  if (!env.STRIPE_SECRET_KEY) return null
  return new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() })
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

// Alleen eigen adressen als terugkeer-URL na betalen (geen open redirect).
function resolveClientUrl(request, env, bodyOrigin) {
  const own = new URL(request.url).origin
  const allowed = new Set([own, normalizeOrigin(env.CLIENT_URL)].filter(Boolean))
  for (const candidate of [normalizeOrigin(bodyOrigin), normalizeOrigin(request.headers.get('origin'))]) {
    if (candidate && allowed.has(candidate)) return candidate
  }
  return normalizeOrigin(env.CLIENT_URL) || own
}

function sanitizeStripeMetadata(metadata) {
  const sanitized = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (Object.keys(sanitized).length >= 50) break
    sanitized[String(key).slice(0, 40)] = String(value ?? '').slice(0, 500)
  }
  return sanitized
}

function shouldSkipTrial(metadata, skipTrial) {
  if (skipTrial === true) return true
  const value = metadata?.skipTrial ?? metadata?.skip_trial
  return value === true || value === 'true' || value === '1'
}

async function forwardToN8n(env, payload) {
  if (!env.N8N_WEBHOOK_URL) {
    console.log('[n8n] N8N_WEBHOOK_URL not set — skipping forward')
    return { forwarded: false }
  }
  const response = await fetch(env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`n8n webhook failed (${response.status}): ${await response.text()}`)
  }
  return { forwarded: true }
}

async function createCheckoutSession(request, env) {
  const body = await request.json().catch(() => null)
  const metadata = body?.metadata
  if (!metadata || typeof metadata !== 'object') {
    return json({ error: 'metadata is required' }, 400)
  }

  const stripe = getStripe(env)
  const skipTrial = shouldSkipTrial(metadata, body?.skipTrial)
  const submissionId = crypto.randomUUID()
  const enrichedMetadata = sanitizeStripeMetadata({
    ...metadata,
    submissionId,
    submittedAt: new Date().toISOString(),
    subscribed_int: '0',
    skip_trial: skipTrial ? 'true' : 'false',
  })

  if (!stripe || !env.STRIPE_PRICE_ID) {
    return json({ demo: true, submissionId, skipTrial })
  }

  const clientUrl = resolveClientUrl(request, env, body?.clientOrigin)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/checkout/cancelled`,
    phone_number_collection: { enabled: false },
    subscription_data: skipTrial ? {} : { trial_period_days: 7 },
    metadata: enrichedMetadata,
  })

  return json({ url: session.url, submissionId, skipTrial })
}

// Alleen het e-mailadres van de sessie (voor Tracklution ContactInfo); de QR-code
// van de Express-versie gebruikt de webfunnel niet.
async function checkoutRedeem(request, env) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id') || ''
  const stripe = getStripe(env)
  const redeemBase = (env.REDEEM_URL || `${url.origin}/redeem`).replace(/\/$/, '')

  if (!stripe || !sessionId) {
    return json({ redeemUrl: `${redeemBase}?demo=1`, qrDataUrl: '', email: null, demo: true })
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  const email = session.customer_details?.email ?? session.customer_email ?? null
  const params = new URLSearchParams({ session_id: sessionId })
  if (email) params.set('email', email)
  return json({ redeemUrl: `${redeemBase}?${params}`, qrDataUrl: '', email, demo: false })
}

async function stripeWebhook(request, env) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) return json({ error: 'Missing stripe-signature header' }, 400)

  const stripe = getStripe(env)
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: 'Stripe webhook is not configured' }, 400)
  }

  const rawBody = await request.text()
  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    )
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid signature' }, 400)
  }

  if (event.type !== 'checkout.session.completed' || event.data.object.mode !== 'subscription') {
    return json({ received: true, handled: false, type: event.type })
  }

  const session = event.data.object
  const metadata = session.metadata ?? {}
  const email = session.customer_details?.email ?? session.customer_email ?? metadata.email ?? ''
  if (!email) return json({ error: 'Checkout session completed without customer email' }, 400)

  const payload = buildN8nPayloadFromMetadata(metadata, {
    email,
    phone: session.customer_details?.phone ?? metadata.phone ?? null,
    subscribedInt: 1,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    stripeSubscriptionId:
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null,
    stripeSessionId: session.id,
  })
  try {
    await forwardToN8n(env, payload)
  } catch (error) {
    // 500 zodat Stripe het later opnieuw probeert
    console.error('[stripe] Forward to n8n failed:', error)
    return json({ error: 'Forward to n8n failed' }, 500)
  }
  return json({ received: true, handled: true, type: event.type, submissionId: payload.submissionId })
}

function health(env) {
  return json({
    status: 'ok',
    n8nConfigured: Boolean(env.N8N_WEBHOOK_URL),
    stripeConfigured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID),
    stripeWebhookConfigured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
  })
}

export async function onRequest({ request, env }) {
  const { pathname } = new URL(request.url)
  const route = `${request.method} ${pathname.replace(/\/$/, '')}`

  try {
    switch (route) {
      case 'GET /api/health':
        return health(env)
      case 'POST /api/create-checkout-session':
        return await createCheckoutSession(request, env)
      case 'GET /api/checkout-redeem':
        return await checkoutRedeem(request, env)
      case 'POST /api/stripe-webhook':
        return await stripeWebhook(request, env)
      default:
        // De demo-checkout van de Express-versie zit hier bewust niet in: die
        // stuurt zonder betaling een abonnee naar n8n.
        return json({ error: 'Not found' }, 404)
    }
  } catch (error) {
    console.error('[api] Failed:', route, error)
    return json({ error: error instanceof Error ? error.message : 'Internal server error' }, 502)
  }
}
