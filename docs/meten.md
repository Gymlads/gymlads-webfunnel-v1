# Meting voor de trechter

Sinds oktober 2026 meet de webfunnel elke stap in de eigen Supabase-database,
voor het dashboard gymlads.nl/trechter. Volledige uitleg (welke stap, welke bron,
hoe geteld): `docs/dashboard-trechter.md` in Gymlads/gymlads-app.

## Hoe het werkt

- `client/src/analytics/meten.ts` maakt per tabblad een willekeurige sessie-id
  (sessionStorage, geen cookie) en bewaart de UTM's uit de link bij de eerste stap.
- Bij elke stap (`OnboardingWizard.tsx`), bij de betaalknop (`betaalknop`) en op
  de bedankpagina (`betaald`) gaat een seintje naar `POST /api/meet`
  (`functions/api/[[path]].js`). Die antwoordt altijd meteen met 204 en geeft het
  op de achtergrond door aan Supabase-functie `log_web_stap`.
- Bij de betaalknop gaan sessie-id en `utm_content` mee. De server zet ze op het
  abonnement in Stripe (`subscription_data.metadata`: `funnel_sessie_id`,
  `utm_content`) en koppelt de Stripe-betaalpagina aan de sessie
  (`log_web_checkout`). De checkout-metadata zelf (die n8n leest) blijft gelijk.
- GTM (`gtm.ts`) en Tracklution blijven ongewijzigd.

## Regels

- **Fire-and-forget**: alles in try/catch, nergens op wachten; een mislukte meting
  merkt de bezoeker niet.
- **Geen persoonsgegevens**: geen naam, e-mail, telefoon, lengte of gewicht.
  Alleen stap, tijd, UTM's, mobiel/desktop, geslacht, leeftijd (wordt in Supabase
  meteen een groep) en ervaring.
- Testen: zet `?test=1` in de link; die sessie telt niet mee.
- Een nieuwe stap in de vragenlijst? Zet hem ook in `MeetStap` (meten.ts) en in
  `trechter_web_stappen()` in Supabase, anders wordt hij genegeerd.

## v3 (21-10-2026)

- Nieuwe stappen `age` en `email`, volgorde doel → geslacht → leeftijd. Supabase
  telt ze pas na `20261021000000_webfunnel_v3.sql` (gymlads-app); tot dan worden
  ze stil genegeerd.
- `info.browser` (instagram / facebook / overig) gaat mee bij de eerste stap.
- Het e-mailadres gaat nooit via `/api/meet`, alleen via `/api/lead` (aparte tabel).
