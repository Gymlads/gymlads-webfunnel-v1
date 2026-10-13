# Webfunnel op Cloudflare Pages (eigen beheer)

Tot oktober 2026 draaide de live webfunnel op het Vercel-account van de
ontwikkelaar (gymlads-webfunnel-v1.vercel.app, gebouwd uit
noErrdev/gymlads-webfunnel-v1). Deze repo kan nu ook op het Cloudflare-account
van Gymlads draaien, naast gymlads.nl.

## Hoe het werkt

- De pagina's zijn dezelfde: `client/` wordt gebouwd naar `client/dist`.
- De API staat voor Cloudflare in `functions/api/[[path]].js` en doet hetzelfde
  als `server/app.js` (die blijft voor Vercel en lokaal ontwikkelen):
  - `POST /api/create-checkout-session`: maakt de Stripe-betaalpagina (7 dagen proef).
  - `GET /api/checkout-redeem`: zoekt na betalen het e-mailadres op (voor
    Tracklution ContactInfo).
  - `POST /api/stripe-webhook`: Stripe meldt een geslaagde checkout; de
    onboarding-antwoorden gaan naar n8n (zelfde gegevens als de Vercel-versie,
    `server/submission.js`).
  - `GET /api/health`: laat zien of Stripe en n8n zijn ingesteld.
- Verschillen met de Vercel-versie:
  - geen demo-checkout (die stuurde zonder betaling een abonnee naar n8n);
  - de terugkeer-URL na betalen is altijd het eigen adres;
  - lukt het doorsturen naar n8n niet, dan antwoordt de webhook met 500 zodat
    Stripe het later opnieuw probeert.
- Instellingen: `wrangler.toml` (Node-compatibiliteit aan).

## Instellen in Cloudflare (eenmalig)

Gedaan op 13 okt 2026: project `gymlads-webfunnel` (gymlads-webfunnel.pages.dev),
production branch `main`. Andere branches krijgen een eigen testadres
(`<branch>.gymlads-webfunnel.pages.dev`).


1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git →
   `Gymlads/gymlads-webfunnel-v1`.
2. Build command: `npm install --prefix client && npm run build --prefix client`.
   Build output directory: `client/dist`.
3. Settings → Variables and Secrets (Production én Preview), als "Secret":
   - `STRIPE_SECRET_KEY`: Stripe-sleutel die Checkout Sessions mag maken en lezen.
   - `STRIPE_PRICE_ID`: de jaarprijs (zelfde als nu).
   - `STRIPE_WEBHOOK_SECRET`: van het nieuwe webhook-endpoint (stap 4).
   - `N8N_WEBHOOK_URL`: dezelfde n8n-webhook als de huidige webfunnel
     (n8n-workflow "Webhook Test 2.0", pad `onboarding-test`, Production URL).
   - `ALLEEN_EIGEN_CHECKOUTS` = `true` zolang de oude webfunnel nog draait: dan
     stuurt de webhook alleen checkouts door die deze versie zelf maakte
     (metadata `funnel_host=cloudflare`). Bij het omzetten weghalen, zodat hij
     zich precies gedraagt als de oude.
   - `STRIPE_PRICE_ID` kandidaat: `price_1TfKa7ClVZcfiz3M1TzqDqOP` (€69,99/jaar), controleren bij de test.
4. Stripe → Developers → Webhooks → nieuw endpoint
   `https://<adres>/api/stripe-webhook`, event `checkout.session.completed`.

## Testen (stap voor stap)

Testadres: `https://claude-project-thread-a1x7ma.gymlads-webfunnel.pages.dev`

1. **Stripe-sleutel**: Stripe → Ontwikkelaars → API-sleutels → "Beperkte sleutel
   maken", naam "Webfunnel Cloudflare". Recht: Checkout Sessions = Schrijven.
   Sleutel alleen in Cloudflare plakken, nergens anders.
2. **Stripe-webhook**: Stripe → Ontwikkelaars → Webhooks → "Eindpunt toevoegen".
   URL: `<testadres>/api/stripe-webhook`, event `checkout.session.completed`.
   Kopieer daarna de "signing secret" (begint met `whsec_`).
3. **Cloudflare** → gymlads-webfunnel → Settings → Variables and Secrets, bij
   **Preview**:
   - `STRIPE_SECRET_KEY` = sleutel uit stap 1
   - `STRIPE_PRICE_ID` = `price_1TfKa7ClVZcfiz3M1TzqDqOP`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` uit stap 2
   - `N8N_WEBHOOK_URL` = `https://gymalds.app.n8n.cloud/webhook/onboarding-test`
   - `ALLEEN_EIGEN_CHECKOUTS` = `true`

   Daarna Deployments → laatste preview → "Retry deployment".
4. **Controle**: open `<testadres>/api/health`; alles hoort `true` te zijn.
5. **Proef**: loop de funnel door op je telefoon met `info+test@gymlads.nl`.
   - Stripe-pagina: €69,99 per jaar en 7 dagen gratis?
   - Na betalen: pagina "Betaling geslaagd".
   - Stripe → Webhooks → het nieuwe eindpunt: levering met status 200.
   - n8n "Webhook Test 2.0": nieuwe uitvoering met de antwoorden.
   - Tracklution → Events: ContactInfo met het test-e-mailadres.
   - Daarna de proef in Stripe opzeggen.

Let op: de oude webfunnel stuurt dezelfde test-checkout ook door naar n8n, dus
het testadres kan twee keer in n8n staan. Dat is alleen bij deze test.

## Omzetten (pas na test en OK van Roel)

- Testen met één proef met info+test@gymlads.nl en daarna opzeggen.
- Bij het omzetten: het webhook-endpoint van de oude (Vercel) webfunnel in
  Stripe uitzetten, anders gaat elke aanmelding twee keer naar n8n.
- Tracklution: nieuw domein laten instellen (support).
- Advertentielinks omzetten, of de ontwikkelaar de oude link laten doorsturen.
