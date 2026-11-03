declare global {
  interface Window {
    OCT?: { getSessionId?: () => string | null | undefined }
  }
}

// Sessie-id van het Octanist-script (index.html). Gaat mee naar de checkout, zodat
// de server na de betaling de lead in Octanist aan dit bezoek en de advertentie
// kan koppelen, ook als de bank-app de bedankpagina in een andere browser opent.
export function octanistSessie(): string | undefined {
  try {
    const id = window.OCT?.getSessionId?.()
    return typeof id === 'string' && id ? id : undefined
  } catch {
    return undefined
  }
}
