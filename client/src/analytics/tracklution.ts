declare global {
  interface Window {
    tlq?: (...args: unknown[]) => void
  }
}

/**
 * Fire a Tracklution event via the tlq snippet that index.html loads.
 *
 * Tracklution only received PageView (snippet) and Purchase (Stripe webhook,
 * server-side); the middle of the funnel was invisible to Meta. AddToCart and
 * InitiateCheckout fill that gap. Guarded so the app keeps working when the
 * snippet is blocked by an ad blocker or fails to load.
 */
export function trackTracklution(event: string, params?: Record<string, unknown>) {
  if (typeof window.tlq !== 'function') return
  if (params) {
    window.tlq('track', event, params)
  } else {
    window.tlq('track', event)
  }
}

/** Yearly subscription price shown on the paywall (€ 69,99). */
export const SUBSCRIPTION_VALUE = { value: 69.99, currency: 'EUR' }
