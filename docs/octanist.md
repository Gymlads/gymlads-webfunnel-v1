# Octanist

Tracking via eigen subdomein `c.gymlads.nl` (CNAME naar `c.octani.st`, Cloudflare "DNS only").

## Wat de webfunnel doet

1. `client/index.html` laadt het Octanist-script (async, naast Tracklution en GTM).
2. Bij "naar betalen" stuurt de browser `window.OCT.getSessionId()` mee; de server zet die als
   `octanist_sessie` op het Stripe-abonnement (niet in de checkout-metadata, die gaat naar n8n).
3. Op de bedankpagina (`GET /api/checkout-redeem`) maakt de server een lead aan:
   `POST https://octanist.com/api/leads` met `externalId` = Stripe-abonnement-id, e-mail en
   `sessionId`. Herladen maakt geen tweede lead (externalId is idempotent).

Alleen actief als de Cloudflare-variabele `OCTANIST_API_KEY` bestaat (Octanist → Settings → API / MCP).
Zonder sleutel gebeurt er niets. `/api/health` toont `octanistConfigured`.

## Betalingen -> Won (zonder n8n, dus 0 n8n-credits)

`POST /api/octanist-stripe` is een eigen Stripe-webhook (alleen `invoice.paid`), gecontroleerd
met `OCTANIST_STRIPE_WEBHOOK_SECRET`. Per betaalde factuur met bedrag > 0:
1. `POST /api/leads` (idempotent) met `externalId` = abonnement (upsell: `hoofd_abonnement`),
   e-mail en de Octanist-sessie van het abonnement;
2. `PATCH /api/leads` met `status: "won"`, `value` (bedrag in euro) en een notitie.
Dit dekt proef €1, jaar na de proef, maand, upsell, verlengingen en app-klanten.
Bij een fout antwoordt de functie 500, zodat Stripe het later opnieuw probeert.

**Let op:** koppel Meta pas in Octanist als Tracklution stopt met StartTrial/Purchase naar Meta,
anders telt Meta dubbel.
