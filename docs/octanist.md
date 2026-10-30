# Octanist

Tracking via eigen subdomein `c.gymlads.nl` (CNAME naar `c.octani.st`, Cloudflare "DNS only").

## Wat de webfunnel doet

1. `client/index.html` laadt het Octanist-script (async, naast GTM en de Meta-pixel).
2. Bij "naar betalen" stuurt de browser `window.OCT.getSessionId()` mee; de server zet die als
   `octanist_sessie` op het Stripe-abonnement (niet in de checkout-metadata, die gaat naar n8n).
3. Op de bedankpagina (`GET /api/checkout-redeem`) maakt de server een lead aan:
   `POST https://octanist.com/api/leads` met `externalId` = Stripe-abonnement-id, e-mail en
   `sessionId`. Herladen maakt geen tweede lead (externalId is idempotent).

Alleen actief als de Cloudflare-variabele `OCTANIST_API_KEY` bestaat (Octanist → Settings → API / MCP).
Zonder sleutel gebeurt er niets. `/api/health` toont `octanistConfigured` en `octanistStripeConfigured`.

## Proef -> Qualified, betalingen -> Won (zonder n8n, dus 0 n8n-credits)

`POST /api/octanist-stripe` is een eigen Stripe-webhook (alleen `invoice.paid`), gecontroleerd
met `OCTANIST_STRIPE_WEBHOOK_SECRET`. Per betaalde factuur met bedrag > 0:
1. `POST /api/leads` (idempotent) met `externalId` = abonnement (upsell: `hoofd_abonnement`),
   e-mail en de Octanist-sessie van het abonnement;
2. `PATCH /api/leads`:
   - proef van €1 (eerste factuur, bedrag ≤ €1, geen maandplan): `status: "qualified"` → Meta **StartTrial**;
   - elke echte betaling (jaar na de proef, maand, upsell, verlenging, app-klanten):
     `status: "won"` met `value` (bedrag in euro) → Meta **Purchase**.
Keuze Roel 30-10-2026: alleen echte betalingen tellen als Purchase, de €1 is symbolisch.
Mapping in Octanist → Meta: Qualified Lead = StartTrial, Converted = Purchase.
Bij een fout antwoordt de functie 500, zodat Stripe het later opnieuw probeert.

**Meta (30-10-2026):** Octanist is gekoppeld aan Pixel Gymlads (1123007803324591), Qualified Lead =
StartTrial, Converted = Purchase, enhanced conversions + alle leads aan, geen backfill. Tracklution is
eruit (script, PageView, ContactInfo, Subscribe weg; Stripe-koppeling in Tracklution uitzetten). De
standaard Meta-pixel in `client/index.html` stuurt alleen PageView en zet de `_fbp`/`_fbc`-cookies
die Octanist gebruikt. Alleen Octanist stuurt aankopen naar Meta, dus niets telt dubbel.

## Instellen en live zetten

- Test (30-10-2026), namen precies zo (hoofdletters, underscores): Cloudflare **Preview** heeft `OCTANIST_API_KEY` (Octanist-sleutel "Webfunnel Cloudflare")
  en `OCTANIST_STRIPE_WEBHOOK_SECRET`; Stripe-bestemming "Octanist (test)" (alleen `invoice.paid`,
  API-versie 2026-01-28.clover) wijst naar de preview-URL `/api/octanist-stripe`.
- Live: dezelfde twee secrets bij **Production** zetten, en de URL van de Stripe-bestemming veranderen
  naar `https://proef.gymlads.nl/api/octanist-stripe` (signing secret blijft gelijk).
