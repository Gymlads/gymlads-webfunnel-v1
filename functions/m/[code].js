// Train samen (referral, Roel 23-11-2026): persoonlijke link proef.gymlads.nl/m/CODE.
// Stuurt door naar de quiz met de code en een utm-bron, zodat de meting
// (web_sessies) "link geopend" telt en de paywall de korting toont.
export function onRequestGet({ params, request }) {
  const code = String(params.code ?? '').trim().toUpperCase()
  const doel = new URL('/', request.url)
  if (/^[A-Z0-9]{4,12}$/.test(code)) {
    doel.searchParams.set('ref', code)
    doel.searchParams.set('utm_source', 'train_samen')
    doel.searchParams.set('utm_medium', 'referral')
    doel.searchParams.set('utm_campaign', 'train_samen')
  }
  return Response.redirect(doel.toString(), 302)
}
