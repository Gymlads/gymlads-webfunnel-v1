// Alle teksten en keuzes van de paywall op één plek (v3, 21-10-2026).
// Punten met ⚠️ beslist Roel voordat dit live gaat (zie docs/paywall-v3.md).

/**
 * ⚠️ Prijs. Moet precies kloppen met wat Stripe afschrijft.
 * - 'A': €69,99 het eerste jaar, daarna €99,99 per jaar. Alleen zetten als in
 *   Stripe een prijs van €99,99/jaar + kortingsbon 30% voor het eerste jaar actief is.
 * - 'B': €69,99 per jaar, zonder doorgestreepte prijs en zonder "Bespaar 30%".
 *   Dit klopt met de huidige Stripe-prijs (price_1TfKa7ClVZcfiz3M1TzqDqOP).
 * Bij A geeft de checkout de kortingsbon automatisch mee (Cloudflare-variabele
 * STRIPE_COUPON_ID, zie functions/api/[[path]].js).
 */
export const PRIJS_OPTIE: 'A' | 'B' = 'A' // Roel koos A (21-10-2026)

export const PRIJS = {
  A: {
    label: 'Bespaar 30%',
    prijsRegel: '€69,99 het eerste jaar',
    doorgestreept: '€99,99',
    perDag: '€0,19',
    kleineTekst:
      'Vandaag betaal je €0. Na 7 dagen betaal je €69,99 voor je eerste jaar, daarna €99,99 per jaar. Opzeggen kan altijd tijdens je proef. Betaal je met iDEAL? Dan vraagt je bank eenmalig €0,01 om je rekening te koppelen.',
    faqProef:
      'Je probeert Gymlads 7 dagen gratis. Vandaag betaal je €0. Zeg je op tijdens je proef, dan betaal je niks. Zeg je niet op, dan start je jaarabonnement van €69,99 voor het eerste jaar (daarna €99,99 per jaar). Betaal je met iDEAL, dan vraagt je bank eenmalig €0,01 om je rekening te koppelen.',
  },
  B: {
    label: null,
    prijsRegel: '€69,99 per jaar',
    doorgestreept: null,
    perDag: '€0,19',
    kleineTekst:
      'Vandaag betaal je €0. Na 7 dagen betaal je €69,99 per jaar. Opzeggen kan altijd tijdens je proef. Betaal je met iDEAL? Dan vraagt je bank eenmalig €0,01 om je rekening te koppelen.',
    faqProef:
      'Je probeert Gymlads 7 dagen gratis. Vandaag betaal je €0. Zeg je op tijdens je proef, dan betaal je niks. Zeg je niet op, dan start je jaarabonnement van €69,99 per jaar. Betaal je met iDEAL, dan vraagt je bank eenmalig €0,01 om je rekening te koppelen.',
  },
}[PRIJS_OPTIE]

/**
 * ⚠️ Logo's onder de knop: alleen methodes die echt aanstaan in Stripe.
 * Volgorde = volgorde van tonen.
 */
export const BETAALMETHODES: Array<'ideal' | 'applepay' | 'googlepay' | 'visa' | 'mastercard'> = [
  'ideal',
  'applepay',
  'googlepay',
  'visa',
  'mastercard',
]

export const VOORDELEN = [
  'Schema op maat: op jouw doel, niveau en planning',
  'Elke week aangepast op wat jij doet, zodat je sterker wordt',
  'Uitleg bij elke oefening, en een AI-coach voor al je vragen',
  'Alles op één plek: sets, gewicht, voortgang en voeding',
]

/** Letterlijk uit de App Store; geen woorden veranderen. */
export const REVIEWS = [
  {
    titel: 'Flinke progressie',
    tekst:
      'Het zorgt ervoor dat ik consistent blijf en ik mezelf accountable voel om het beste uit de gym te halen. Gebruik het nu iets langer dan 3 maanden, en al mijn lifts zijn beter geworden qua kracht.',
    naam: 'Gijs',
  },
  {
    titel: 'Precies wat ik zocht',
    tekst:
      'De app is een personal trainer maar dan betaalbaar. Instructies en uitleg is duidelijk en helpt me goed om af te vallen en sterker te worden',
    naam: 'Bjarne',
  },
  {
    titel: 'Prima app',
    tekst: 'Duidelijk en overzichtelijk, geeft ook goede feedback.',
    naam: 'Luuk',
  },
]

/**
 * ⚠️ App Store-score. Nu 5,0 uit 5 beoordelingen. null = niet tonen.
 * Nooit de score zonder het aantal.
 */
export const APP_STORE_SCORE: { score: string; aantal: number } | null = null

/** ⚠️ Moet overal hetzelfde zijn (gymlads.nl zegt "1.000+ gebruikers"). */
export const AANTAL_SPORTERS = '1.000+'

export const VOORWAARDEN_URL = 'https://gymlads.nl/algemene-voorwaarden'
export const PRIVACY_URL = 'https://gymlads.nl/privacy-policy'
export const APP_STORE_URL = 'https://apps.apple.com/nl/app/gymlads/id6763741678'
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.gymlads.app'
