# Prijsmodel jaar + maand (26-10-2026)

Opdracht van Roel (thread "Nieuw prijsmodel jaar en maand"), delen 1-3, 5 en 6.
Deel 4 (herroepingsknop en vinkje "direct starten") zit in de thread
"Herroepingsknop toevoegen". Gebouwd op branch `claude/project-thread-s37y14`,
bovenop webfunnel v3 (PR #5, branch `claude/project-thread-2008k9`).

**Niet live.** Pas live 1-2 weken nadat v3 live staat en gemeten is, na testen
in de Cloudflare-preview en Roels akkoord.

## Het model

| Plan | Prijs (incl. btw) | Proef | Stripe-prijs (Cloudflare) |
|---|---|---|---|
| Jaar (standaard gekozen) | €99,99 per jaar (= €8,33 per maand) | 7 dagen gratis | `STRIPE_PRICE_ID` |
| Maand | €17,99 per maand | geen | `STRIPE_PRICE_ID_MAAND` |

12 × €17,99 = €215,88; jaar is 53,7% goedkoper, dus "Bespaar 50%" klopt altijd.
Bestaande klanten blijven op hun prijs (€69,99). Weg: kortingsbon, "€69,99 het
eerste jaar", "daarna €99,99", "Bespaar 30%", doorgestreepte €99,99.

## Wat er in de code veranderd is

**Paywall** (`client/src/onboarding/Paywall.tsx`, teksten in `paywallInhoud.ts`)
- Kop "Start vandaag voor €0,-" staat er weer (opdracht: "blijft").
- Betaalblok boven en onder: "Kies je plan" met twee kaarten (jaar met lime rand
  en "Bespaar 50%", maand met grijze rand). Boven en onder delen dezelfde keuze.
- Knop en kleine tekst wisselen mee: jaar "START MIJN 7 DAGEN GRATIS", maand
  "START NU VOOR €17,99". De kleine tekst bij het jaar ("Na het eerste jaar is je
  abonnement maandelijks opzegbaar") is ⚠️ voor de jurist.
- FAQ: nieuwe tekst bij "Hoe werkt de gratis proef?", nieuwe vraag "Wat is het
  verschil tussen maand en jaar?", en bij opzeggen één zin over het maandabonnement.
- Bedankpagina: bij maand "Je abonnement is gestart!" in plaats van "Je proefweek
  is gestart!".

**Stripe Checkout** (`functions/api/[[path]].js`)
- De paywall stuurt `plan: 'jaar' | 'maand'` mee.
- Jaar: `STRIPE_PRICE_ID`, `trial_period_days: 7`.
- Maand: `STRIPE_PRICE_ID_MAAND`, geen proef, `metadata.skip_trial = 'true'`
  (bestaand veld). Staat `STRIPE_PRICE_ID_MAAND` niet in Cloudflare, dan krijgt de
  klant een foutmelding en nooit stilletjes de jaarprijs.
- Eigen tekst bij de Stripe-knop (`custom_text.submit`) per plan, letterlijk uit
  de opdracht.
- Kortingsbon (`STRIPE_COUPON_ID`) wordt niet meer gebruikt. `/api/health` laat
  zien of hij nog in Cloudflare staat (`oudeCouponIngesteld`); mag dan weg.
- `plan` staat ook in de metadata van het abonnement (niet in de
  checkout-metadata, want die gaat in zijn geheel naar n8n) en in de terug-URL
  (`/checkout/success?...&plan=maand`).
- `/api/health` toont `maandConfigured`.

De Express-versie in `server/` (oude Vercel-reserve) is bewust niet aangepast.

## Tracking

| Wat | Waar | Event |
|---|---|---|
| Tik op een plankaart | GTM | `plan_selected` (`plan`: year/month, `cta_position`) |
| Betaalknop | GTM | `paywall_cta_click` heeft nu ook `plan` |
| Bedankpagina | GTM | `checkout_success` heeft nu ook `plan` |
| Maandabonnement gekocht | Tracklution → Meta (Conversions API) | `Subscribe`, value 17.99, currency EUR, `eventId` = Stripe-sessie |
| Jaarproef gestart | Tracklution → Meta | `StartTrial`, ongewijzigd (via Stripe) |

`Subscribe` wordt verstuurd op de bedankpagina, ná `ContactInfo` (zodat
Tracklution het aan het advertentiebezoek koppelt), en per Stripe-sessie maar één
keer per toestel. Nog na te vragen bij Tracklution (Emma):
1. Wordt `eventId` gebruikt om dubbele `Subscribe`-events weg te filteren?
2. Stuurt de Stripe-koppeling van Tracklution bij een abonnement zonder proef zelf
   al een `Subscribe` (of alleen `Purchase`)? Zo ja, dan krijgt Meta er twee en
   halen we die van de bedankpagina weg.
De Stripe-`Purchase` (eerste echte betaling) blijft gewoon komen, dus de
maandbetaling geeft in Meta ook een `Purchase` van €17,99.

In Ads Manager: kolom toevoegen voor "Abonneren" (Subscribe) om de kosten per
maandklant te zien. De campagne blijft op `StartTrial` optimaliseren.
Bij livegang: regel toevoegen aan het logboek van `docs/tracking.md` (gymlads-app).

## n8n en dashboard (nagelopen)

- **Get Subscription Status 2.0** (export in projectbestanden, n8n/TEST-subscription-status-stripecheck.json) telt `trialing`, `active` en `past_due` als
  lopend. Een maandabonnement is meteen `active`, dus de app ziet de klant als
  abonnee. `had_trial` wordt 0 (klopt: geen proef).
- **"RevenueCat → Supabase 2.0"** (web-aankoop → `funnel_staging`): ziet geen
  verschil tussen jaar en maand (zelfde metadata, `skip_trial` bestond al). Niet
  te zien zonder de export; daarom testen we het met een echte test-aankoop (zie
  hieronder).
- **Dashboard /cijfers**: een abonnement zonder proef telt al mee als "direct
  betaald" (`proef_start` leeg). Omzet per maand telt vanzelf mee. Er is nog geen
  aparte tegel voor maandklanten of "% maand"; dat hoort bij de thread
  "Trechter in dashboard" (meetplan in deel 6).

## Wat Roel moet doen in Stripe (vóór de test)

1. Product Gymlads → prijs toevoegen: €17,99, terugkerend, maandelijks,
   **btw inbegrepen**. Het prijs-ID (`price_...`) doorgeven.
2. De jaarprijs €99,99 (`price_1USwNVClVZcfiz3MskozxeKq`) bestaat al.
3. Herinneringsmail vóór einde proef: Billing → Abonnementen en e-mails.
   Let op: Stripe stuurt die standaard 7 dagen vóór het einde, bij een proef van
   7 dagen is dat meteen bij de start.
4. Oude prijs €69,99 pas archiveren bij livegang (de app gebruikt hem nog).
5. **Kortingsbon ifVHsAaK en promotiecode EERSTEJAAR niet uitzetten** zolang app
   2.2.6 in de winkels staat: die app-paywall toont €69,99 en rekent op die code
   (betaallink met `prefilled_promo_code=EERSTEJAAR`). Alleen de Cloudflare-variabele
   `STRIPE_COUPON_ID` van de webfunnel gaat weg.

## Cloudflare (alleen Preview!)

Settings → Variables and Secrets, keuzemenu rechtsboven op **Preview**:
- `STRIPE_PRICE_ID` = `price_1USwNVClVZcfiz3MskozxeKq` (staat er al)
- `STRIPE_PRICE_ID_MAAND` = nieuwe maandprijs
- `STRIPE_COUPON_ID` verwijderen
Daarna screenshot mét het keuzemenu, en Retry deployment.

## Testplan (Preview)

1. Paywall: jaar staat aan, wisselen naar maand verandert knop en tekst.
2. Jaar afrekenen: Stripe toont €0 vandaag, €99,99 na 7 dagen, eigen tekst.
3. Maand afrekenen: Stripe toont €17,99 vandaag, eigen tekst, geen proef.
4. Na de maand-test: app-account met hetzelfde e-mailadres → schema en toegang
   (n8n). In Tracklution: `Subscribe` van 17.99 binnen.
5. Test-abonnementen daarna in Stripe opzeggen en terugbetalen.
