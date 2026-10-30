// API van de webfunnel voor Cloudflare Pages Functions.
// Doet hetzelfde als server/app.js (Express, voor Vercel/lokaal):
// Stripe-betaalpagina maken, e-mailadres na betaling opzoeken, en na een
// geslaagde checkout de onboarding-antwoorden via de Stripe-webhook naar n8n sturen.
// Instellingen komen uit de omgevingsvariabelen van het Cloudflare-project.
import Stripe from 'stripe'
import { buildN8nPayloadFromMetadata } from '../../server/submission.js'

const FUNNEL_HOST = 'cloudflare'

// Meting voor de trechter (docs/meten.md). Publieke Supabase-gegevens (dezelfde
// die de app en gymlads.nl/cijfers gebruiken); de functies log_web_stap en
// log_web_checkout accepteren alleen bekende waarden.
const SUPABASE_URL = 'https://igcmunshswzaxxtccxij.supabase.co'
const SUPABASE_PUBLIEKE_SLEUTEL = 'sb_publishable_KDytEfGmM-_frKy-ykQB4g_PS5huk7r'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const OCTANIST_SESSIE = /^[A-Za-z0-9_.:-]{1,100}$/
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/

// Eigen tekst bij de betaalknop van Stripe (custom_text.submit, max. 1200 tekens),
// per plan (opdracht Roel 26-10-2026). Jaar zonder proef (shouldSkipTrial) krijgt
// geen tekst: "vandaag €1 voor je proefweek" klopt dan niet.
// Betaalde proefweek (Roel 29-10, advies Max): eenmalig bedrag bij de start van
// de jaarproef. Moet gelijk zijn aan PROEF_BEDRAG in client/src/onboarding/paywallInhoud.ts.
const PROEF_BEDRAG_CENT = 100

const STRIPE_KNOP_TEKST = {
  jaar:
    'Je betaalt vandaag €1 voor je proefweek. Na 7 dagen betaal je €99,99 per jaar. Opzeggen kan altijd tijdens je proef. Je abonnement start direct na betaling. Daarmee vervalt je herroepingsrecht van 14 dagen.',
  maand:
    'Je betaalt vandaag €17,99. Daarna elke maand €17,99. Elke maand opzegbaar. Je abonnement start direct na betaling. Daarmee vervalt je herroepingsrecht van 14 dagen.',
}

function geldigEmail(waarde) {
  if (typeof waarde !== 'string') return null
  const schoon = waarde.trim().toLowerCase()
  return schoon.length <= 254 && EMAIL.test(schoon) ? schoon : null
}

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

async function supabaseRpc(functie, args) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functie}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLIEKE_SLEUTEL,
      Authorization: `Bearer ${SUPABASE_PUBLIEKE_SLEUTEL}`,
    },
    body: JSON.stringify(args),
  })
  if (!response.ok) {
    console.error(`[meten] ${functie} mislukt (${response.status}): ${await response.text()}`)
  }
}

// Stap uit de vragenlijst doorgeven aan Supabase. Antwoordt altijd meteen met
// 204; het doorgeven gebeurt op de achtergrond en een fout blijft hier.
async function meet(request, waitUntil) {
  try {
    const tekst = await request.text()
    if (tekst.length > 4000) return new Response(null, { status: 204 })
    const body = JSON.parse(tekst)
    if (typeof body?.sessie === 'string' && UUID.test(body.sessie) && typeof body?.stap === 'string') {
      const info = body.info && typeof body.info === 'object' && !Array.isArray(body.info) ? body.info : {}
      const volgnummer = Number.isInteger(body.volgnummer) ? body.volgnummer : null
      waitUntil(
        supabaseRpc('log_web_stap', {
          p_sessie: body.sessie,
          p_stap: body.stap.slice(0, 40),
          p_volgnummer: volgnummer,
          p_info: info,
        }).catch((error) => console.error('[meten] stap:', error)),
      )
    }
  } catch {
    // ongeldige meting: negeren
  }
  return new Response(null, { status: 204 })
}

async function createCheckoutSession(request, env, waitUntil) {
  const body = await request.json().catch(() => null)
  const metadata = body?.metadata
  if (!metadata || typeof metadata !== 'object') {
    return json({ error: 'metadata is required' }, 400)
  }

  const stripe = getStripe(env)
  // Jaar (€99,99, 7 dagen proef) of maand (€17,99, geen proef). Onbekend = jaar.
  const plan = body?.plan === 'maand' ? 'maand' : 'jaar'
  const skipTrial = plan === 'maand' || shouldSkipTrial(metadata, body?.skipTrial)
  const submissionId = crypto.randomUUID()
  const enrichedMetadata = sanitizeStripeMetadata({
    ...metadata,
    submissionId,
    submittedAt: new Date().toISOString(),
    subscribed_int: '0',
    skip_trial: skipTrial ? 'true' : 'false',
    funnel_host: FUNNEL_HOST,
  })

  if (!stripe || !env.STRIPE_PRICE_ID) {
    return json({ demo: true, submissionId, skipTrial, plan })
  }
  // Nooit stil de jaarprijs rekenen als iemand maand koos
  const priceId = plan === 'maand' ? env.STRIPE_PRICE_ID_MAAND : env.STRIPE_PRICE_ID
  if (!priceId) {
    console.error('[checkout] STRIPE_PRICE_ID_MAAND ontbreekt')
    return json({ error: 'Dit abonnement is nu niet beschikbaar' }, 503)
  }

  // Koppeling met de meting: sessie-id en advertentie op het abonnement in
  // Stripe (niet in de checkout-metadata, die gaat in zijn geheel naar n8n).
  const meting = body?.meting && typeof body.meting === 'object' ? body.meting : null
  const sessieId = typeof meting?.sessie === 'string' && UUID.test(meting.sessie) ? meting.sessie : null
  const abonnementMetadata = { plan }
  // Kleine sportschool + toestellen (2.2.6): op het abonnement, niet in de
  // checkout-metadata (die gaat in zijn geheel naar funnel_staging).
  const sportschool = body?.sportschool && typeof body.sportschool === 'object' ? body.sportschool : null
  for (const key of ['soort_sportschool', 'sportschool_toestellen']) {
    if (typeof sportschool?.[key] === 'string' && sportschool[key]) {
      abonnementMetadata[key] = sportschool[key].slice(0, 200)
    }
  }
  if (sessieId) abonnementMetadata.funnel_sessie_id = sessieId
  // Octanist-sessie: daarmee koppelt Octanist de lead aan het advertentiebezoek
  if (typeof body?.octanist === 'string' && OCTANIST_SESSIE.test(body.octanist)) {
    abonnementMetadata.octanist_sessie = body.octanist
  }
  if (typeof meting?.utm_content === 'string' && meting.utm_content) {
    abonnementMetadata.utm_content = meting.utm_content.slice(0, 500)
  }

  const clientUrl = resolveClientUrl(request, env, body?.clientOrigin)
  // E-mail uit de e-mailstap: op de betaalpagina al ingevuld. Bewust GEEN
  // client_reference_id: n8n en Tracklution zien een web-checkout dan als app-checkout.
  const customerEmail = geldigEmail(body?.email)
  const knopTekst = plan === 'maand' ? STRIPE_KNOP_TEKST.maand : skipTrial ? null : STRIPE_KNOP_TEKST.jaar
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    // Jaarproef: abonnement (€0 tijdens de proef) plus de eenmalige proefweek,
    // die Stripe meteen bij de start afschrijft.
    line_items: [
      { price: priceId, quantity: 1 },
      ...(skipTrial
        ? []
        : [
            // Liefst het Stripe-product "Gymlads proefweek" (zelfde als de app),
            // anders hetzelfde bedrag los meegegeven
            env.STRIPE_PRICE_ID_PROEF
              ? { price: env.STRIPE_PRICE_ID_PROEF, quantity: 1 }
              : {
                  price_data: {
                    currency: 'eur',
                    unit_amount: PROEF_BEDRAG_CENT,
                    product_data: { name: 'Gymlads proefweek (7 dagen)' },
                  },
                  quantity: 1,
                },
          ]),
    ],
    // plan in de terug-URL: de bedankpagina toont de juiste tekst en meldt een
    // maandaankoop aan Tracklution (ook als de bank-app een andere browser opent)
    success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
    cancel_url: `${clientUrl}/checkout/cancelled`,
    phone_number_collection: { enabled: false },
    // Altijd Nederlands (anders toont Stripe bij een Engelse browser 'per year')
    locale: 'nl',
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    ...(knopTekst ? { custom_text: { submit: { message: knopTekst } } } : {}),
    // Geen kortingsbon meer (prijsmodel 26-10: €99,99 is de echte jaarprijs).
    subscription_data: {
      ...(skipTrial ? {} : { trial_period_days: 7 }),
      metadata: abonnementMetadata,
    },
    metadata: enrichedMetadata,
  })

  if (sessieId) {
    waitUntil(
      supabaseRpc('log_web_checkout', { p_sessie: sessieId, p_checkout: session.id })
        .catch((error) => console.error('[meten] checkout:', error)),
    )
  }

  return json({ url: session.url, submissionId, skipTrial, plan })
}

// E-mailadres + antwoorden uit de e-mailstap bewaren als lead (Supabase-functie
// log_web_lead), ook als er geen proef volgt. Antwoordt altijd meteen met 204;
// zolang log_web_lead nog niet bestaat, gebeurt er niets.
async function lead(request, waitUntil) {
  try {
    const tekst = await request.text()
    if (tekst.length > 8000) return new Response(null, { status: 204 })
    const body = JSON.parse(tekst)
    const email = geldigEmail(body?.email)
    if (email) {
      const antwoorden =
        body.antwoorden && typeof body.antwoorden === 'object' && !Array.isArray(body.antwoorden)
          ? body.antwoorden
          : {}
      const sessie =
        typeof body?.meting?.sessie === 'string' && UUID.test(body.meting.sessie) ? body.meting.sessie : null
      waitUntil(
        supabaseRpc('log_web_lead', {
          p_email: email,
          p_herinneringen: body.herinneringen === true,
          p_sessie: sessie,
          p_antwoorden: antwoorden,
        }).catch((error) => console.error('[lead]', error)),
      )
    }
  } catch {
    // ongeldig: negeren
  }
  return new Response(null, { status: 204 })
}

// Alleen het e-mailadres van de sessie (voor Tracklution ContactInfo); de QR-code
// van de Express-versie gebruikt de webfunnel niet.
// Proef of maand gestart: lead in Octanist aanmaken (alleen als OCTANIST_API_KEY
// bestaat). externalId = Stripe-abonnement, dus herladen maakt geen tweede lead;
// n8n zet de lead later op Won met het bedrag. Fouten raken de klant nooit.
async function octanistLead(env, session, email) {
  const abonnement = typeof session.subscription === 'object' ? session.subscription : null
  if (!abonnement?.id) return
  const meta = abonnement.metadata ?? {}
  const lead = {
    externalId: abonnement.id,
    email,
    custom: { plan: meta.plan ?? 'jaar', bron: 'webfunnel', stripe_klant: abonnement.customer ?? null },
    ...(meta.utm_content ? { utm_content: meta.utm_content } : {}),
  }
  const stuur = (body) => octanist(env, 'POST', body)
  let response = await stuur(meta.octanist_sessie ? { ...lead, sessionId: meta.octanist_sessie } : lead)
  // Verlopen of onbekende sessie: lead toch aanmaken, dan zonder koppeling
  if (response.status === 400 && meta.octanist_sessie) response = await stuur(lead)
  if (!response.ok) console.error('[octanist] lead:', response.status, await response.text())
}

const OCTANIST_LEADS = 'https://octanist.com/api/leads'

// Namen in Cloudflare: OCTANIST_API_KEY / OCTANIST_STRIPE_WEBHOOK_SECRET, of met een 2
// erachter (zo staan ze sinds 30-10 in Preview)
const octanistSleutel = (env) => env.OCTANIST_API_KEY || env.OCTANIST_API_KEY2
const octanistWebhookGeheim = (env) => env.OCTANIST_STRIPE_WEBHOOK_SECRET || env.OCTANIST_STRIPE_WEBHOOK_SECRET2

function octanist(env, method, body) {
  return fetch(OCTANIST_LEADS, {
    method,
    headers: { 'X-API-KEY': octanistSleutel(env), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Stripe-webhook (alleen invoice.paid) -> Octanist, zonder n8n. Elke echte betaling
// (proef €1, jaar na de proef, maand, upsell, verlenging) wordt Won met het bedrag.
// externalId = Stripe-abonnement, voor de upsell het hoofdabonnement. De lead wordt
// eerst (idempotent) aangemaakt met de Octanist-sessie van het abonnement, dus ook
// app-klanten en betalingen zonder bedankpagina komen erin.
async function octanistStripe(request, env) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) return json({ error: 'Missing stripe-signature header' }, 400)
  const stripe = getStripe(env)
  if (!stripe || !octanistWebhookGeheim(env) || !octanistSleutel(env)) {
    return json({ error: 'Octanist webhook is not configured' }, 400)
  }
  const rawBody = await request.text()
  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      octanistWebhookGeheim(env),
      undefined,
      Stripe.createSubtleCryptoProvider(),
    )
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid signature' }, 400)
  }
  if (event.type !== 'invoice.paid') return json({ received: true, handled: false, type: event.type })

  const betaling = octanistBetaling(event.data.object)
  if (!betaling) return json({ received: true, handled: false, reason: 'geen bedrag of abonnement' })
  const { lead, won } = betaling
  let response = await octanist(env, 'POST', lead)
  // Onbekende/verlopen sessie: lead zonder koppeling aanmaken
  if (response.status === 400 && lead.sessionId) {
    const { sessionId, ...zonder } = lead
    response = await octanist(env, 'POST', zonder)
  }
  if (!response.ok && response.status !== 409) {
    console.error('[octanist] lead:', response.status, await response.text())
    return json({ error: 'Octanist lead failed' }, 500) // Stripe probeert het later opnieuw
  }
  response = await octanist(env, 'PATCH', won)
  if (!response.ok) {
    console.error('[octanist] won:', response.status, await response.text())
    return json({ error: 'Octanist won failed' }, 500)
  }
  return json({ received: true, handled: true, externalId: won.externalId, value: won.value })
}

function octanistBetaling(factuur) {
  if (!factuur || factuur.object !== 'invoice' || !(factuur.amount_paid > 0)) return null
  const details = factuur.parent?.subscription_details ?? factuur.subscription_details ?? {}
  const meta = details.metadata ?? {}
  const abonnement =
    (typeof factuur.subscription === 'string' ? factuur.subscription : factuur.subscription?.id) ??
    details.subscription ??
    null
  const email = (factuur.customer_email ?? '').trim().toLowerCase()
  if (!abonnement || !email) return null
  const isUpsell = meta.plan === 'upsell'
  const externalId = isUpsell && meta.hoofd_abonnement ? meta.hoofd_abonnement : abonnement
  const soort = isUpsell
    ? 'upsell'
    : factuur.billing_reason === 'subscription_create'
      ? meta.plan === 'maand' ? 'maand' : 'proef'
      : factuur.billing_reason === 'subscription_cycle' ? 'abonnement' : factuur.billing_reason ?? 'betaling'
  const value = Math.round(factuur.amount_paid) / 100
  const valuta = (factuur.currency ?? 'eur').toUpperCase()
  const sessie = !isUpsell && typeof meta.octanist_sessie === 'string' ? meta.octanist_sessie : null
  return {
    lead: {
      externalId,
      email,
      custom: { bron: 'stripe', plan: isUpsell ? 'jaar/maand + upsell' : meta.plan ?? 'onbekend' },
      ...(sessie ? { sessionId: sessie } : {}),
    },
    won: { externalId, status: 'won', value, note: `${soort} ${value} ${valuta} (${factuur.id})` },
  }
}

async function checkoutRedeem(request, env, waitUntil) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id') || ''
  const stripe = getStripe(env)
  const redeemBase = (env.REDEEM_URL || `${url.origin}/redeem`).replace(/\/$/, '')

  if (!stripe || !sessionId) {
    return json({ redeemUrl: `${redeemBase}?demo=1`, qrDataUrl: '', email: null, demo: true })
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: octanistSleutel(env) ? ['subscription'] : [],
  })
  const email = session.customer_details?.email ?? session.customer_email ?? null
  if (octanistSleutel(env) && email && session.status === 'complete') {
    waitUntil(octanistLead(env, session, email).catch((error) => console.error('[octanist]', error)))
  }
  const params = new URLSearchParams({ session_id: sessionId })
  if (email) params.set('email', email)
  return json({
    redeemUrl: `${redeemBase}?${params}`,
    qrDataUrl: '',
    email,
    demo: false,
    upsell: Boolean(env.STRIPE_PRICE_ID_UPSELL) && session.status === 'complete',
  })
}

// Upsell met één klik op de bedankpagina (Roel 29-10, advies Max). Rekent het
// product uit STRIPE_PRICE_ID_UPSELL meteen af met de betaalmethode van de net
// gestarte proef. Eenmalige prijs = losse betaling; terugkerende prijs = apart
// abonnement met metadata plan=upsell. Zonder die variabele toont de pagina niets.
const UPSELL_MAX_LEEFTIJD_S = 2 * 60 * 60

async function betaalmethodeVanSessie(stripe, session) {
  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  const sub = subId ? await stripe.subscriptions.retrieve(subId) : null
  const pm = sub?.default_payment_method
  if (pm) return { sub, pm: typeof pm === 'string' ? pm : pm.id }
  const klant = await stripe.customers.retrieve(session.customer)
  const klantPm = klant?.invoice_settings?.default_payment_method
  if (klantPm) return { sub, pm: typeof klantPm === 'string' ? klantPm : klantPm.id }
  const lijst = await stripe.paymentMethods.list({ customer: session.customer, limit: 1 })
  return { sub, pm: lijst.data[0]?.id ?? null }
}

async function upsell(request, env) {
  const body = await request.json().catch(() => null)
  const sessionId = typeof body?.session_id === 'string' ? body.session_id : ''
  const stripe = getStripe(env)
  const priceId = env.STRIPE_PRICE_ID_UPSELL
  if (!stripe || !priceId || !sessionId.startsWith('cs_')) {
    return json({ error: 'Niet beschikbaar' }, 400)
  }

  // Knop "start direct" met de regel over het herroepingsrecht (Roel 29-10)
  if (body?.direct_start !== true) return json({ error: 'Niet beschikbaar' }, 400)

  const session = await stripe.checkout.sessions.retrieve(sessionId)
  // Alleen direct na een geslaagde aankoop, en alleen voor deze klant
  const teOud = Date.now() / 1000 - session.created > UPSELL_MAX_LEEFTIJD_S
  if (session.status !== 'complete' || !session.customer || teOud) {
    return json({ error: 'Deze aanbieding is verlopen' }, 410)
  }
  const customer = typeof session.customer === 'string' ? session.customer : session.customer.id

  const { sub, pm } = await betaalmethodeVanSessie(stripe, { ...session, customer })
  if (sub?.metadata?.upsell_gekocht) return json({ ok: true, alGekocht: true })
  if (!pm) return json({ error: 'Geen betaalmethode gevonden' }, 402)

  const price = await stripe.prices.retrieve(priceId, { expand: ['product'] })
  const metadata = {
    plan: 'upsell',
    checkout_sessie: sessionId,
    hoofd_abonnement: sub?.id ?? '',
    direct_start: 'true',
    direct_start_at: new Date().toISOString(),
  }
  // Zelfde sessie = zelfde sleutel: dubbel tikken rekent nooit twee keer af
  const idempotencyKey = `upsell-${sessionId}`
  let gekocht

  if (price.type === 'recurring') {
    const upsellSub = await stripe.subscriptions.create(
      {
        customer,
        items: [{ price: priceId }],
        default_payment_method: pm,
        off_session: true,
        payment_behavior: 'allow_incomplete',
        metadata,
      },
      { idempotencyKey },
    )
    // SEPA (iDEAL) wordt pas na een paar dagen bevestigd: dan is "incomplete" normaal
    const methode = await stripe.paymentMethods.retrieve(pm)
    const gelukt = upsellSub.status === 'active' || (upsellSub.status === 'incomplete' && methode.type === 'sepa_debit')
    if (!gelukt) {
      await stripe.subscriptions.cancel(upsellSub.id).catch(() => {})
      return json({ error: 'Betaling niet gelukt' }, 402)
    }
    gekocht = upsellSub.id
  } else {
    const productNaam = typeof price.product === 'object' ? price.product.name : 'Gymlads upsell'
    const betaling = await stripe.paymentIntents
      .create(
        {
          amount: price.unit_amount,
          currency: price.currency,
          customer,
          payment_method: pm,
          off_session: true,
          confirm: true,
          description: productNaam,
          metadata,
        },
        { idempotencyKey },
      )
      .catch((error) => ({ status: 'mislukt', error }))
    if (betaling.status !== 'succeeded' && betaling.status !== 'processing') {
      console.error('[upsell] betaling:', betaling.error?.message ?? betaling.status)
      return json({ error: 'Betaling niet gelukt' }, 402)
    }
    gekocht = betaling.id
  }

  if (sub) {
    await stripe.subscriptions
      .update(sub.id, { metadata: { upsell_gekocht: gekocht } })
      .catch((error) => console.error('[upsell] markeren:', error))
  }
  return json({ ok: true })
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

  // Tijdens het testen ontvangt dit endpoint ook de checkouts van de oude
  // webfunnel en de app. Met ALLEEN_EIGEN_CHECKOUTS=true sturen we alleen
  // checkouts door die deze Cloudflare-versie zelf heeft gemaakt.
  if (env.ALLEEN_EIGEN_CHECKOUTS === 'true' && metadata.funnel_host !== FUNNEL_HOST) {
    return json({ received: true, handled: false, reason: 'not created by this funnel' })
  }
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
    maandConfigured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID_MAAND),
    proefPrijsConfigured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID_PROEF),
    octanistConfigured: Boolean(octanistSleutel(env)),
    octanistStripeConfigured: Boolean(octanistSleutel(env) && octanistWebhookGeheim(env)),
    upsellConfigured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID_UPSELL),
    // Staat de oude kortingsbon nog in Cloudflare? Wordt niet meer gebruikt; mag weg.
    oudeCouponIngesteld: Boolean(env.STRIPE_COUPON_ID),
    stripeWebhookConfigured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
  })
}

export async function onRequest({ request, env, waitUntil }) {
  const opAchtergrond = typeof waitUntil === 'function' ? waitUntil : (promise) => promise
  const { pathname } = new URL(request.url)
  const route = `${request.method} ${pathname.replace(/\/$/, '')}`

  try {
    switch (route) {
      case 'GET /api/health':
        return health(env)
      case 'POST /api/create-checkout-session':
        return await createCheckoutSession(request, env, opAchtergrond)
      case 'POST /api/meet':
        return await meet(request, opAchtergrond)
      case 'POST /api/lead':
        return await lead(request, opAchtergrond)
      case 'GET /api/checkout-redeem':
        return await checkoutRedeem(request, env, waitUntil)
      case 'POST /api/upsell':
        return await upsell(request, env)
      case 'POST /api/octanist-stripe':
        return await octanistStripe(request, env)
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
