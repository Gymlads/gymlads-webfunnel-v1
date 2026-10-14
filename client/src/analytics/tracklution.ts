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
