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
   - `N8N_WEBHOOK_URL`: dezelfde n8n-webhook als de huidige webfunnel.
4. Stripe → Developers → Webhooks → nieuw endpoint
   `https://<adres>/api/stripe-webhook`, event `checkout.session.completed`.

## Omzetten (pas na test en OK van Roel)

- Testen met één proef met info+test@gymlads.nl en daarna opzeggen.
- Bij het omzetten: het webhook-endpoint van de oude (Vercel) webfunnel in
  Stripe uitzetten, anders gaat elke aanmelding twee keer naar n8n.
- Tracklution: nieuw domein laten instellen (support).
- Advertentielinks omzetten, of de ontwikkelaar de oude link laten doorsturen.
