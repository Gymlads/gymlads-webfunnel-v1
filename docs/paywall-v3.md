# Webfunnel v3: paywall, e-mailstap, vragenlijst (21-10-2026)

Opdracht van Roel (thread "Webfunnel paywall en vragenlijst v3"). Gebouwd op
branch `claude/project-thread-2008k9`. **Niet live** tot Roel na het testen in
de Cloudflare-preview akkoord geeft.

> Prijsmodel jaar + maand (26-10-2026) bouwt hierop voort: zie `docs/prijsmodel-jaar-maand.md`. De kortingsbon en "Bespaar 30%" hieronder vervallen dan.

## Wat is er veranderd

**Vragenlijst**
- Volgorde: geslacht → leeftijd → doel → de rest (Roel: niet omdraaien). Klein logo bovenaan elk scherm (zoals Fitbod).
- Leeftijd als tikvlakken 18-23 · 24-29 · 30-39 · 40-49 · 50+. Naar Stripe/n8n gaat
  het midden als getal: 20, 26, 35, 45, 55.
- Lengte en gewicht worden niet meer gevraagd. De velden `lengte` en `gewicht`
  gaan leeg (`""`) mee in de Stripe-metadata (zelfde sleutels als altijd).
- Gekleurde emoji (Roel 21-10) bij doel, uitdaging, ervaring, locatie en activiteit. "Ik wil alles gelijk trainen" bovenaan.
  Alle antwoordvlakken: #2C2C2E, 56 px, gekozen = lime rand.
- Nieuwe stap `email` vóór `plan-ready` ("Je schema is bijna klaar!", zoals Fitbod; `client/src/onboarding/EmailStap.tsx`).

**Paywall** (`client/src/onboarding/Paywall.tsx`, teksten in `paywallInhoud.ts`)
- Blokken: betaalblok "Jouw plan" (Flitsboek-stijl) · wat krijg je · reviews · sociaal bewijs · betaalblok · FAQ (4 vragen) · voorwaarden.
- Weg: "Annuleer eenvoudig ... persoonlijke account", "4.8/5.0", "10.000+ workouts", dode link "Aankopen herstellen".
- Knop reageert meteen (spinner + "Even geduld…", beide knoppen uit). De server
  wordt bij het openen van de paywall alvast gewekt (`/api/health`) en de browser
  maakt alvast verbinding met checkout.stripe.com.

**Stripe Checkout** (`functions/api/[[path]].js`)
- `customer_email` = adres uit de e-mailstap (alleen als het een geldig adres is).
- Geen eigen tekst bij de Stripe-knop (Roel 21-10: de verplichte SEPA-tekst is al lang genoeg).
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
"CLAIM JOUW 7 DAGEN GRATIS" staat; die tekst is nu "GA VERDER".
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

## Cloudflare-instellingen voor de test (let op de omgeving)

Zet `STRIPE_PRICE_ID` (nieuwe €99,99-prijs) en `STRIPE_COUPON_ID` alleen bij **Preview**
(keuzemenu rechtsboven op de Settings-pagina). Bij Production blijft tot livegang de oude
prijs staan en géén `STRIPE_COUPON_ID`. Nieuwe waarden werken pas na een nieuwe deploy.
Controle: in het Stripe-logboek (POST /v1/checkout/sessions) moet `discounts` de coupon bevatten.

## Update 20-11-2026: e-mailstap uit, scherm "Zo haal jij je doel" erin

Roel: 20% haakte af bij de e-mailstap, wie bleef kocht niet vaker. De stap staat
uit met de schakelaar `EMAILSTAP_AAN` in `client/src/onboarding/useOnboardingSteps.ts`
(op `true` zetten = alles weer zoals hierboven). Volgorde nu:
`info-feedback` → `doelscherm` ("Zo haal jij je doel", `Doelscherm.tsx`) → `plan-ready` → `paywall`.

Wat er verandert:
- Stripe vraagt het e-mailadres zelf (geen `customer_email` meer), net als vóór 21 okt.
  n8n (staging + Link User), Tracklution (StartTrial uit `checkout.session.completed`,
  `customer_details.email`), Octanist (lead op de bedankpagina) en de upsell gebruikten
  al het e-mailadres van de Stripe-sessie: geen wijziging.
- Doel uit de vragenlijst: werd bij de betaalknop op het e-mailadres van de e-mailstap
  bewaard (`web_doel_bewaren`). Nu op de bedankpagina (`GET /api/checkout-redeem`), met het
  e-mailadres van Stripe, uit de abonnement-metadata `doel`. Komt iemand niet op de
  bedankpagina, dan vraagt de app het doel gewoon opnieuw.
- Geen leads meer (`/api/lead`, `web_leads`) en geen GTM-event `email_submitted`.
- Tracklution `ContactInfo` alleen nog op de bedankpagina (zoals vóór 21 okt).
- Meting: nieuwe stappen `doelscherm` (in beeld) en `doelscherm-knop` (VERDER). Vereist
  gymlads-app migratie `20261120120000_trechter_doelscherm.sql` vóór livegang.
- Blok "Je eerste workout" uit het voorstel is weggelaten: het echte schema maakt n8n pas
  na het inloggen in de app. De splitsing-chip volgt dezelfde regel als "M1 – Schema maken 4.0".

### Briefing 20-11 (deel 2)
- Mijlpalen v2: "Deze week · Na 4 weken · Daarna" (`Doelscherm.tsx`), doelblok Onderhouden = "Fit en sterk blijven".
- Kilo-scherm v2 (`doel-getal`): "Ik weeg nu · 80 kg · Wijzig", groot "4 kg eraf", "Dan weeg je 76 kg", meter lime tot het niveau.
  Kilo's (afvallen/aankomen) in stappen van 1 kg (app: 0,5); het maximum blijft gelijk. Kracht en cm-doelen dezelfde opbouw.
- "Sla over" op het getal-scherm heet "Ik weet het nog niet" en telt `doel-getal-onbekend` (werkt verder hetzelfde).
- "8 weken" weg uit: subregel bij doel-kiezen en doel-oefening, kracht-advies "+X kg past bij jouw niveau",
  "Te veel"-tekst bij kracht/centimeters ("meer tijd"). Blijft op het kilo-scherm en in de garantie.
