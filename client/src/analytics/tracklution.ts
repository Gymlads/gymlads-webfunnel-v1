declare global {
  interface Window {
    tlq?: (...args: unknown[]) => void
  }
}

// Vertelt Tracklution wie deze bezoeker is, zodat latere events uit Stripe
// (StartTrial, Purchase) met hetzelfde e-mailadres aan dit bezoek en de
// advertentieklik gekoppeld worden. Het script zelf staat in index.html.
export function setTracklutionContactInfo(email: string) {
  const value = email.trim().toLowerCase()
  if (!value || typeof window.tlq !== 'function') return
  window.tlq('set', 'ContactInfo', { email: value })
}

const GEMELD_KEY = 'tracklution_subscribe_gemeld'

/**
 * Maandabonnement gekocht (prijsmodel 26-10-2026): `Subscribe` met 17.99 EUR
 * naar Tracklution, dat het via de Conversions API aan Meta geeft. Event-ID =
 * Stripe-sessie, zodat Tracklution dubbele meldingen kan wegfilteren; op dit
 * toestel sturen we per sessie maar één keer (ook als de pagina herladen wordt).
 * De jaarproef (StartTrial) blijft zoals hij was: die komt via Stripe.
 */
export function trackTracklutionSubscribe(sessionId: string) {
  if (!sessionId || sessionId.startsWith('demo-') || typeof window.tlq !== 'function') return
  try {
    const gemeld: string[] = JSON.parse(localStorage.getItem(GEMELD_KEY) || '[]')
    if (gemeld.includes(sessionId)) return
    localStorage.setItem(GEMELD_KEY, JSON.stringify([...gemeld.slice(-9), sessionId]))
  } catch {
    // geen opslag: toch één keer sturen
  }
  window.tlq('track', 'Subscribe', { value: 17.99, currency: 'EUR', eventId: sessionId })
}
