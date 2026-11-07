// Meta-cookies van de pixel (index.html): _fbp (browser) en _fbc (advertentieklik).
// Gaan mee naar de checkout, zodat de server na een betaling het event aan dit
// bezoek en de advertentie kan koppelen (Conversions API, action_source website).
function cookie(naam: string): string | undefined {
  try {
    const rij = document.cookie.split('; ').find((c) => c.startsWith(`${naam}=`))
    return rij ? decodeURIComponent(rij.slice(naam.length + 1)) : undefined
  } catch {
    return undefined
  }
}

export function metaCookies(): { fbp?: string; fbc?: string } {
  let fbc = cookie('_fbc')
  // Pixel nog niet geladen of cookie geblokkeerd: _fbc zelf maken uit fbclid
  if (!fbc) {
    try {
      const fbclid = new URLSearchParams(window.location.search).get('fbclid')
      if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`
    } catch {
      // geen URL: niets
    }
  }
  return { fbp: cookie('_fbp'), fbc }
}
