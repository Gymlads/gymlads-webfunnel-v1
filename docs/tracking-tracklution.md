# Tracking-inrichting: Stripe → Tracklution → Meta

Ingericht op 9 november 2026, samen met Roel. Vervangt Octanist als bron voor Meta.
Octanist blijft alleen als dashboard (de Meta-koppeling in Octanist staat UIT).

## Waarom zo

- Octanist stuurt events naar Meta als "fysieke winkel" (`physical_store`). Website-advertentiesets tellen die niet mee, dus van 30 okt tot 7 nov zag Meta geen bruikbare conversies.
- Tracklution stuurt als `website`. Dat is gecontroleerd in Tracklution RAW: `"action_source": "website"`.
- We sturen de advertenties op **StartTrial** ("Proefperiode starten"). Bij ongeveer 50 aankopen per week komt er een Purchase-advertentieset bij.

## Welke betaling wordt welk event (beslissing Roel)

| Wat | Event naar Meta |
|---|---|
| Proef gestart (€1 web, gratis app) | alleen **StartTrial** |
| €1 proefweek | **geen** Purchase |
| Jaar, maand, Voedingsschema (€4,99), verlengingen | alleen **Purchase** |

## Instellingen

### Website (proef.gymlads.nl, repo gymlads-webfunnel-v1)
- Tracklution-script met container `LS-98875324-1` via `tralut.gymlads.nl`.
- Stuurt PageView, ContactInfo (e-mail) en bij een maandabonnement `Subscribe`.
- Geen losse Meta-pixel meer (Tracklution doet pixel en server). Octanist-script staat er ook op, alleen voor het dashboard.

### Stripe (Workbench → Webhooks)
| Bestemming | Link eindigt op | Luistert naar |
|---|---|---|
| Tracklution Gymlads | `track=StartTrial&source=stripe` | `customer.subscription.created` (was `checkout.session.completed`) |
| Tracklution Gymlads - betaling | `track=Purchase&source=stripe` | `invoice.payment_succeeded` (was `charge.succeeded`) |

### Tracklution (Settings → Event Block Rules)
| Regel | Blokkeert | Voorwaarde |
|---|---|---|
| StartTrial alleen bij proef | StartTrial | Webhook parameter equals `data.object.status` = `active` of `incomplete` (dus alleen `trialing` gaat door) |
| Purchase niet bij proefweek | Purchase | Webhook parameter equals `data.object.lines.data.0.parent.type` = `invoice_item_details` (eerste factuurregel is de losse €1-proefweek) |
| Purchase niet bij 0 euro | Purchase | Event value ≤ 0 |
| Block StartTrial events without client reference (oud, van Emma) | StartTrial | Doet niets meer, mag blijven staan |

### Meta-connector in Tracklution
- LIVE, dataset Pixel 1123007803324591.
- De Meta-koppeling in Octanist staat UIT, anders telt alles dubbel.

## Belangrijk bij wijzigingen
- **Bij elke prijswijziging (web of app): de tracking opnieuw doorlopen.** Doe een eerste echte checkout, controleer in Tracklution de eventlijst en "Blocked During Last 24 Hours", en controleer Meta Events Manager.
- De €1-proefweek moet een **losse eenmalige regel** op de eerste factuur blijven (geen terugkerende prijs). Anders telt hij weer als Purchase.
- Proeven zonder proefperiode in Stripe tellen niet als StartTrial.

## Nog te controleren (bij de eerste echte proef na 9 nov)
1. StartTrial komt binnen in Tracklution, mét e-mailadres en advertentieklik. Het Stripe-bericht "subscription.created" heeft zelf geen e-mail. Ontbreekt de e-mail, dan zet je in Stripe terug naar `checkout.session.completed` en zoeken we verder.
2. Bij "Purchase niet bij proefweek" staat 1 geblokkeerd, en er staat geen €1-Purchase in de lijst.
3. In Meta Events Manager is "Proefperiode starten" actief in de advertentieset.

## Terugdraaien
- In Stripe de oude gebeurtenis weer aanvinken (`checkout.session.completed` of `charge.succeeded`) en de nieuwe uitvinken.
- In Tracklution de nieuwe regels op Inactive zetten.
