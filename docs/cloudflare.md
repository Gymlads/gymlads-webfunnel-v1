# Webfunnel op Cloudflare Pages (eigen beheer)

Tot oktober 2026 draaide de live webfunnel op het Vercel-account van de
ontwikkelaar (gymlads-webfunnel-v1.vercel.app, gebouwd uit
noErrdev/gymlads-webfunnel-v1). Deze repo kan nu ook op het Cloudflare-account
van Gymlads draaien, naast gymlads.nl.

## Hoe een aanmelding via de website loopt (uitgezocht 14 okt 2026)

1. De bezoeker vult de vragenlijst in de webfunnel in.
2. De webfunnel maakt een Stripe-betaalpagina aan (`POST /api/create-checkout-session`):
   jaarprijs `price_1TfKa7ClVZcfiz3M1TzqDqOP` (€69,99), 7 dagen proef. **Alle
   antwoorden gaan mee als `metadata` van die betaling** (±45 velden).
   Er is geen vaste betaallink; elke klant krijgt een eigen pagina.
3. Welke betaalmethodes de klant ziet (iDEAL, kaart, Apple/Google Pay, Revolut)
   bepaalt Stripe zelf uit de instellingen van het Stripe-account, niet de code.
4. Na betalen stuurt Stripe `checkout.session.completed` **rechtstreeks naar
   n8n**: workflow **"GymLads - RevenueCat → Supabase 2.0"** (ondanks de naam
   ook voor web). Pad in die workflow:
   `Stripe Trigger → Which Stripe event? → Extract Stripe Fields → Is App Checkout?`
   - App-aankoop (heeft `client_reference_id`): `Activate App User (Stripe)`.
   - Web-aankoop: `Parse Web Metadata → Save To Staging (Web)`, schrijft de
     antwoorden naar Supabase-tabel `funnel_staging` (`on_conflict=email`,
     credential "Supabase secret key - Gymlads 2.0").
   - Opzegging: `Parse cancellation → Cancel user in Supabase`.
5. Opent de klant later de app en maakt een account met hetzelfde e-mailadres,
   dan koppelt het tweede deel van die workflow (`Link User`-webhook) de
   antwoorden aan het account en wordt de regel in `funnel_staging` gewist.
6. Tracking: Stripe → Tracklution → Meta (zie `docs/tracking.md` in de repo
   gymlads-app). De pagina "Betaling geslaagd" stuurt Tracklution `ContactInfo`.

Dus: **de webfunnel zelf stuurt niets naar n8n**. De oude funnel had wel code
om naar n8n te sturen (`server/app.js`, `/api/stripe-webhook`), maar daar staat
in Stripe geen webhook voor, en n8n "Webhook Test 2.0" (pad `onboarding-test`)
had vóór 14 okt nooit een uitvoering.

## Wat de Cloudflare-versie doet

- De pagina's zijn dezelfde: `client/` wordt gebouwd naar `client/dist`.
- De API staat in `functions/api/[[path]].js` (zelfde gedrag als `server/app.js`):
  - `POST /api/create-checkout-session`: Stripe-betaalpagina, precies dezelfde
    aanvraag als de oude funnel (vergeleken in Stripe-logboek, 14 okt), plus
    één extra metadataveld `funnel_host=cloudflare`.
  - `GET /api/checkout-redeem`: zoekt na betalen het e-mailadres op (voor
    Tracklution ContactInfo).
  - `POST /api/stripe-webhook`: kan antwoorden naar n8n sturen, maar is **niet
    nodig** (zie hierboven) en wordt niet gebruikt. Laat `STRIPE_WEBHOOK_SECRET`
    en `N8N_WEBHOOK_URL` leeg en zet in Stripe geen webhook naar dit adres.
  - `GET /api/health`: laat zien wat er is ingesteld.
- Geen demo-checkout (die stuurde in de Vercel-versie zonder betaling een
  abonnee naar n8n).
- Instellingen: `wrangler.toml` (Node-compatibiliteit aan). Omdat dat bestand
  bestaat, kun je in het Cloudflare-dashboard alleen **Secrets** toevoegen.

## Instellen in Cloudflare

Project `gymlads-webfunnel` (aangemaakt 13 okt 2026), production branch `main`
→ gymlads-webfunnel.pages.dev. Andere branches krijgen een testadres
(`<branch>.gymlads-webfunnel.pages.dev`). Build command:
`npm install --prefix client && npm run build --prefix client`, output `client/dist`.

Settings → Variables and Secrets (kies bovenaan Production of Preview), type
**Secret**:
- `STRIPE_SECRET_KEY`: beperkte Stripe-sleutel "Webfunnel Cloudflare" met
  **Checkout Sessions = Schrijven** en **Payment Method Configurations = Lezen**.
  Zonder dat laatste toont Stripe alleen kaart/Apple Pay en géén iDEAL.
- `STRIPE_PRICE_ID` = `price_1TfKa7ClVZcfiz3M1TzqDqOP`

Na het wijzigen: Deployments → laatste deployment → … → Retry deployment.
Controle: `<adres>/api/health` → `stripeConfigured: true`.

## Test 14 okt 2026 (Roel, info+test@gymlads.nl)

- Testadres `claude-project-thread-a1x7ma.gymlads-webfunnel.pages.dev`, health ok.
- Betaalpagina: €69,99/jaar, 7 dagen gratis. iDEAL ontbrak eerst; opgelost met
  het leesrecht Payment Method Configurations op de sleutel.
- Betaling 08:32. Stripe → n8n "RevenueCat → Supabase 2.0" (uitvoering 5997):
  fout bij `Save To Staging (Web)`: "JWT issued at future" (Supabase vond de
  inlog een paar seconden uit de toekomst; toevallig klokverschil, niet door de
  nieuwe funnel). Advies: "Retry On Fail" aan op dat blokje.
- Toen nog gebruikt (nu niet meer nodig): webhook "Webfunnel Cloudflare (test)"
  in Stripe → 200, en n8n "Webhook Test 2.0" (uitvoering 5996) schreef de
  antwoorden wel weg.

## Test proef.gymlads.nl 14 okt 2026 (vóór omzetten advertenties)

- 10:53 (roeltuijtelaars@live.nl): PageView + ContactInfo via `tralut.gymlads.nl`,
  n8n "RevenueCat → Supabase 2.0" groen (Save To Staging (Web) ok), opzegging
  ook verwerkt. StartTrial kwam wel uit Stripe binnen, maar met hetzelfde
  event-nummer als de test van 08:33 (zelfde persoon), dus niet opnieuw geteld.
- 11:25 (testroel1410@gymlads.nl, nieuw adres): StartTrial om 11:37 via Stripe
  binnen (±12 min na betaling) en naar Meta gestuurd.
- De Verify-knop onder First-Party Mode in Tracklution test alleen het
  Vercel-adres van de container en blijft rood. Negeren.
- Waar je StartTrial van de website ziet: Tracklution → Webhook Import Events
  (bron stripe). Welke proef app of website is: in gymlads-app
  `supabase/beheer/proeven-per-bron.sql`.

## Omzetten (pas na OK van Roel)

1. Code naar `main` (PR #1 mergen) en de twee secrets ook bij **Production** zetten.
2. In Stripe de test-webhook "Webfunnel Cloudflare (test)" verwijderen (als die
   er nog staat). Aan de n8n-kant verandert niets.
3. Eigen adres koppelen, bijvoorbeeld proef.gymlads.nl (start.gymlads.nl is al
   in gebruik).
4. Tracklution (advies Emma, 14 okt): zelfde container `LS-98875324-1`.
   First-party subdomein `tralut.gymlads.nl` (CNAME in Cloudflare-DNS naar het
   doel onder First-Party Mode in Tracklution, daarna daar verifiëren). Het
   script in `client/index.html` laadt sinds 14 okt van `tralut.gymlads.nl`
   (valt terug op `main-42377.trlution.com` als dat niet werkt). De Stripe
   block rule blijft ongewijzigd. Vóór de advertenties: volledige checkout op
   proef.gymlads.nl testen en kijken of de events in Tracklution binnenkomen.
5. Advertentielinks omzetten (reset het leren van Meta), of de ontwikkelaar de
   oude link laten doorsturen.
6. Daarna één echte controle: nieuwe web-aanmelding staat in n8n
   "RevenueCat → Supabase 2.0" met groene `Save To Staging (Web)`.
