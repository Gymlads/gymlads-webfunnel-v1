# Webfunnel v3: paywall, e-mailstap, vragenlijst (21-10-2026)

Opdracht van Roel (thread "Webfunnel paywall en vragenlijst v3"). Gebouwd op
branch `claude/project-thread-2008k9`. **Niet live** tot Roel na het testen in
de Cloudflare-preview akkoord geeft.

## Wat is er veranderd

**Vragenlijst**
- Volgorde: geslacht → leeftijd → doel → de rest (Roel: niet omdraaien). Klein logo bovenaan elk scherm (zoals Fitbod).
- Leeftijd als tikvlakken 18-23 · 24-29 · 30-39 · 40-49 · 50+. Naar Stripe/n8n gaat
  het midden als getal: 20, 26, 35, 45, 55.
- Lengte en gewicht worden niet meer gevraagd. De velden `lengte` en `gewicht`
  gaan leeg (`""`) mee in de Stripe-metadata (zelfde sleutels als altijd).
- Lime lijn-icoontjes (Lucide) bij doel, uitdaging, ervaring, locatie en activiteit. "Ik wil alles gelijk trainen" bovenaan.
  Alle antwoordvlakken: #2C2C2E, 56 px, gekozen = lime rand (+ lime icoon).
- Nieuwe stap `email` vóór `plan-ready` ("Je schema is bijna klaar!", zoals Fitbod; `client/src/onboarding/EmailStap.tsx`).

**Paywall** (`client/src/onboarding/Paywall.tsx`, teksten in `paywallInhoud.ts`)
- Blokken: kop · betaalblok "Jouw plan" (Flitsboek-stijl) · wat krijg je · reviews · sociaal bewijs · betaalblok · FAQ (4 vragen) · voorwaarden.
- Weg: "Annuleer eenvoudig ... persoonlijke account", "4.8/5.0", "10.000+ workouts", dode link "Aankopen herstellen".
- Knop reageert meteen (spinner + "Even geduld…", beide knoppen uit). De server
  wordt bij het openen van de paywall alvast gewekt (`/api/health`) en de browser
  maakt alvast verbinding met checkout.stripe.com.

**Stripe Checkout** (`functions/api/[[path]].js`)
- `customer_email` = adres uit de e-mailstap (alleen als het een geldig adres is).
- `custom_text.submit` = "Je betaalt vandaag €0 ..." (alleen met proef).
- Bewust **geen** `client_reference_id` (dan ziet n8n/Tracklution het als app-checkout).
- Prijsoptie A (Roel 21-10): `discounts: [{ coupon: STRIPE_COUPON_ID }]` bij een proef, als Cloudflare-variabele `STRIPE_COUPON_ID` gezet is. `STRIPE_PRICE_ID` moet dan de nieuwe €99,99-prijs zijn.

**Geannuleerd** (`/checkout/cancelled`): vriendelijke pagina met "Probeer opnieuw".
De antwoorden staan 24 uur op het toestel (localStorage), zodat "Probeer opnieuw"
meteen terug naar de paywall gaat (`/?terug=paywall`).

**Leads** (`POST /api/lead` → Supabase `log_web_lead`): e-mail, vinkje en
antwoorden. Doet niets tot Roel de SQL draait (gymlads-app
`supabase/migrations/20261021000000_webfunnel_v3.sql`).

## Tracking

| Wat | Waar | Event / veld |
|---|---|---|
| Elke stap (nu ook `age`, `email`) | GTM | `onboarding_step_view` (+ `browser`) |
| E-mail ingevuld | GTM | `email_submitted` (`herinneringen`: true/false; het adres zelf niet) |
| Knop boven/onder | GTM | `paywall_cta_click` (`cta_position`: boven/onder) |
| Hoe lang "Even geduld…" duurde | GTM | `checkout_redirect` (`wacht_ms`, `gelukt`) |
| Betaling geannuleerd | GTM | `checkout_cancelled` |
| In-app browser | GTM + Supabase `web_sessies.browser` | `instagram` / `facebook` / `overig` (user-agent bevat Instagram / FBAN / FBAV) |
| E-mail ook naar Tracklution | Tracklution | `ContactInfo` al bij de e-mailstap (was alleen op de bedankpagina) |

Bestaande events blijven. **Check in GTM** of er een trigger op de oude knoptekst
"CLAIM JOUW 7 DAGEN GRATIS" staat; die tekst is nu "START MIJN 7 DAGEN GRATIS".
Beide knoppen hebben `data-cta-positie="boven|onder"`.

Dashboard /cijfers: "Onboarding geopend/gestart" telt nu `gender`/`stats`. Na
livegang moet dat `goal`/`gender` worden (thread "Trechter in dashboard").

## Volgorde betaalmethodes in Stripe (onderzocht)

Stripe Checkout bepaalt de volgorde zelf (op land, toestel en wat de klant eerder
gebruikte). Apple Pay / Google Pay verschijnen als knop bovenaan als het toestel
het ondersteunt. Er is geen instelling om iDEAL "onderaan" te zetten. Wat wel kan:
iDEAL helemaal uitzetten (Payment Method Configuration), maar dat is de A/B-test
die Roel op 21-10 bewust nog niet wilde. Uit de Stripe-analyse van 21-10: wie een
methode kiest, rondt bijna altijd af; het afhaken gebeurt vóór het kiezen. Dus
eerst meten met de nieuwe tekst + vooraf ingevulde e-mail.

## Nog te testen door Roel (iPhone)

1. Link openen in Instagram (DM of story), funnel doorlopen, iDEAL kiezen, naar de
   bank-app, terug. Komt hij op de bedankpagina?
2. Op de Stripe-pagina op "terug" tikken: komt de pagina "Geen zorgen, er is niets
   betaald", en brengt "Probeer opnieuw" je terug op de paywall?
3. Staat je e-mailadres al ingevuld op de Stripe-pagina, en staat de eigen tekst bij de knop?
