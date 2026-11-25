// Train samen (opdracht v2, Roel 24-11-2026): persoonlijke link gymlads.nl/m/CODE
// (gymlads.nl stuurt door naar proef.gymlads.nl/m/CODE).
//
// Geldige code: landingspagina voor de vriend (scherm 9): "[Voornaam] nodigt
// je uit, 50% korting op je eerste jaar", met een linkvoorbeeld (Open Graph)
// voor WhatsApp. De knop gaat naar de gewone quiz met ?ref=CODE; de website
// onthoudt de code en de paywall toont de korting. De korting zelf zet de server.
// Ongeldige of vervangen code: gewoon naar de quiz, zonder korting.
const SUPABASE_URL = 'https://igcmunshswzaxxtccxij.supabase.co'
const SUPABASE_PUBLIEKE_SLEUTEL = 'sb_publishable_KDytEfGmM-_frKy-ykQB4g_PS5huk7r'
const JAARPRIJS_CENT = 9999

function html(tekst) {
  return String(tekst).replace(/[&<>"']/g, (t) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[t])
}

function euro(cent) {
  return '€' + (cent / 100).toFixed(2).replace('.', ',')
}

async function check(code) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ts_code_check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLIEKE_SLEUTEL,
        Authorization: `Bearer ${SUPABASE_PUBLIEKE_SLEUTEL}`,
      },
      body: JSON.stringify({ p_code: code, p_email: null }),
    })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export function quizUrl(request, code) {
  const doel = new URL('/', request.url)
  if (code) doel.searchParams.set('ref', code)
  doel.searchParams.set('utm_source', 'train_samen')
  doel.searchParams.set('utm_medium', 'referral')
  doel.searchParams.set('utm_campaign', 'train_samen')
  return doel.toString()
}

export function landingspagina({ code, voornaam, kortingProcent, verder, origin }) {
  const naam = voornaam ? html(voornaam) : null
  const korting = Math.max(1, Math.min(100, Number(kortingProcent) || 50))
  const eersteJaar = JAARPRIJS_CENT - Math.round((JAARPRIJS_CENT * korting) / 100)
  const titel = naam ? `Train samen met ${naam}` : 'Train samen'
  const beschrijving = `${korting}% korting op je eerste jaar`
  const letter = naam ? naam.charAt(0).toUpperCase() : 'G'
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${titel} · Gymlads</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Gymlads">
<meta property="og:title" content="${titel}">
<meta property="og:description" content="${beschrijving}">
<meta property="og:url" content="${html(origin)}/m/${html(code)}">
<meta property="og:image" content="${html(origin)}/ts/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,800;1,900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#171719;color:#fff;font-family:Inter,system-ui,-apple-system,sans-serif}
main{max-width:440px;margin:0 auto;padding:28px 20px 32px;min-height:100vh;display:flex;flex-direction:column}
.logo{display:block;height:26px;margin:4px auto 22px}
.blok{background:#ccff00;color:#000;border-radius:22px;padding:24px 20px 26px;text-align:center}
.av{width:56px;height:56px;border-radius:28px;background:#000;color:#ccff00;font-weight:800;font-size:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
.uit{font-weight:600;font-size:16px}
.groot{font-weight:900;font-style:italic;font-size:48px;letter-spacing:-1.5px;line-height:1.05;margin-top:6px}
.sub{font-weight:600;font-size:16px;margin-top:4px}
.prijs{text-align:center;margin-top:22px}
.prijs s{color:#8e8e93;font-size:18px;margin-right:8px}
.prijs b{font-weight:900;font-style:italic;font-size:40px;color:#ccff00;letter-spacing:-1px}
.klein{color:#8e8e93;font-size:13px;margin-top:2px}
h1{font-size:24px;font-weight:800;text-align:center;margin-top:20px}
p.uitleg{color:#c7c7cc;text-align:center;font-size:15px;line-height:1.45;margin-top:8px}
a.knop{display:block;margin-top:24px;background:#ccff00;color:#000;text-align:center;font-weight:800;font-size:17px;letter-spacing:.3px;padding:17px;border-radius:14px;text-decoration:none}
.voet{color:#8e8e93;font-size:13px;text-align:center;margin-top:12px}
</style>
</head>
<body>
<main>
  <img class="logo" src="/ts/logo.png" alt="Gymlads">
  <section class="blok">
    <div class="av">${letter}</div>
    <div class="uit">${naam ? `${naam} nodigt je uit` : 'Je bent uitgenodigd'}</div>
    <div class="groot">${korting}% korting</div>
    <div class="sub">op je eerste jaar</div>
  </section>
  <div class="prijs"><s>${euro(JAARPRIJS_CENT)}</s><b>${euro(eersteJaar)}</b>
    <div class="klein">eerste jaar · daarna ${euro(JAARPRIJS_CENT)} per jaar</div></div>
  <h1>${titel}</h1>
  <p class="uitleg">Je AI-coach maakt je plan en past het elke week aan. Probeer het eerst 7 dagen gratis.</p>
  <a class="knop" href="${html(verder)}">CLAIM JE ${korting}% KORTING</a>
  <div class="voet">1-minuutquiz voor jouw persoonlijke plan</div>
</main>
</body>
</html>`
}

export async function onRequestGet({ params, request }) {
  const code = String(params.code ?? '').trim().toUpperCase()
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return Response.redirect(quizUrl(request, null), 302)
  const uitkomst = await check(code)
  if (!uitkomst?.geldig) return Response.redirect(quizUrl(request, null), 302)
  const pagina = landingspagina({
    code,
    voornaam: uitkomst.voornaam ?? null,
    kortingProcent: uitkomst.korting_procent,
    verder: quizUrl(request, code),
    origin: new URL(request.url).origin,
  })
  return new Response(pagina, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
