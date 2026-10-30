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

## Later (n8n)

Echte betalingen (proef €1, jaar na proef, maand, upsell) zet n8n met
`PATCH https://octanist.com/api/leads` (`externalId` of `email`, `status: "won"`, `value`) op Won.
Won gaat als Purchase naar Meta. Eerst bij Octanist navragen of een lead vaker Won kan worden.

**Let op:** koppel Meta pas in Octanist als Tracklution stopt met StartTrial/Purchase naar Meta,
anders telt Meta dubbel.
