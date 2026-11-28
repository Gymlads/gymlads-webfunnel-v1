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

- (20-11-2026: `email` uit, `doelscherm` + `doelscherm-knop` erbij, zie paywall-v3.md.)
- Nieuwe stappen `age` en `email`, volgorde doel → geslacht → leeftijd. Supabase
  telt ze pas na `20261021000000_webfunnel_v3.sql` (gymlads-app); tot dan worden
  ze stil genegeerd.
- `info.browser` (instagram / facebook / overig) gaat mee bij de eerste stap.
- Het e-mailadres gaat nooit via `/api/meet`, alleen via `/api/lead` (aparte tabel).

## Startscherm (16-11-2026)

- Nieuw startscherm vóór de eerste vraag (`client/src/onboarding/Startscherm.tsx`,
  foto's `assets/start-1..6.jpg`). Terug van een geannuleerde betaling
  (`?terug=paywall`) slaat het over; "terug" op de geslachtvraag gaat naar het startscherm.
- Metingen: `startscherm` (in beeld) en `start-knop` (op START gedrukt). Supabase
  telt ze pas na `20261116000000_trechter_startscherm.sql` (gymlads-app).
- GTM: aparte events `startscherm_view` en `startscherm_start`. Het bestaande
  `onboarding_step_view` (en de nummering per stap) blijft gelijk, begint nog steeds bij `gender`.

## Startscherm v2 (18-11-2026)

- De geslachtvraag staat op het startscherm zelf (geen START-knop meer). Stap `gender`
  toont `Startscherm.tsx`; "terug" op de leeftijdvraag gaat naar het startscherm.
- Metingen blijven gelijk zodat het dashboard klopt: `startscherm` = scherm in beeld;
  bij het kiezen van een geslacht `start-knop` en `gender` (met geslacht). GTM:
  `onboarding_step_view` gender + `startscherm_view` bij laden, `startscherm_start` bij kiezen.

## Startscherm teruggedraaid (20-11)

Op verzoek van Roel (20 nov) weer de oude opbouw: de quiz begint meteen met de geslachtvraag, zonder startscherm. De stappen `startscherm` en `start-knop` worden niet meer gemeten; `gender` weer bij het tonen van de vraag (zoals vóór 16 nov). GTM-events `startscherm_view` / `startscherm_start` vervallen.

## Bedankpagina v2 en web-laadscherm (25-11-2026)

- Bedankpagina (`CheckoutResult.tsx`): drie stappen Download / Log in met [Stripe-e-mail] (code van
  6 cijfers) / Start je eerste workout, één knop naar de juiste winkel (iPhone -> App Store,
  Android -> Play Store, computer -> beide knoppen). Metingen ongewijzigd (`betaald`,
  `checkout_success`, Tracklution, upsell). Nieuw GTM-event `bedankt_download` (winkel).
  Achter `BEDANKPAGINA_CODE_LOGIN` (CheckoutResult.tsx), AAN sinds 28-11-2026 (2.3.1 in beide stores). Was false
  zodra de app met inloggen via code in beide stores staat. Bekijken: `?code=1` in de link.
- Laadscherm "We maken jouw plan" (`WebLaadscherm.tsx`) tussen "Zo haal jij je doel" en
  "Jouw persoonlijk plan staat klaar". LIVE sinds 26-11-2026 (`WEB_LAADSCHERM_AAN` in
  `useOnboardingSteps.ts`, Roel wilde geen losse test).
  ±7 seconden, geen knop; terug vanaf "plan staat klaar" slaat het over.
- Metingen: stappen `laadscherm` en `laadscherm-klaar`, GTM `laadscherm_web_getoond` /
  `laadscherm_web_afgerond`. Supabase telt de stappen pas als ze in `trechter_web_stappen()`
  staan (gymlads-app); doe dat vóór de livegang van de test.
- Stripe: geen `client_reference_id` (bewust, zie functions/api). De koppeling quiz -> Stripe
  bestaat al: `submissionId` in de checkout-metadata en `funnel_sessie_id` op het abonnement.
