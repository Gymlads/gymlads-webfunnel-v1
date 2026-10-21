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
    naam: 'Jaarlijks - €69,99',
    doorgestreept: '€99,99',
    perDag: '€0,19',
    // Naar het voorbeeld van Flitsboek (Roel 21-10)
    kleineTekst:
      'De korting geldt voor je eerste jaar. Je abonnement wordt daarna automatisch verlengd tegen de volle prijs van €99,99 per jaar, tenzij je het opzegt. Opzeggen tijdens je proef? Dan betaal je niks.',
    faqProef:
      'Vandaag betaal je niks. Zeg je op tijdens je proef, dan blijft dat zo. Zeg je niet op, dan betaal je na 7 dagen €69,99 voor je eerste jaar, daarna €99,99 per jaar. Met iDEAL vraagt je bank eenmalig €0,01 om je rekening te koppelen.',
  },
  B: {
    label: null,
    naam: 'Jaarlijks - €69,99',
    doorgestreept: null,
    perDag: '€0,19',
    kleineTekst:
      'Je abonnement wordt na je proef automatisch verlengd voor €69,99 per jaar, tenzij je het opzegt. Opzeggen tijdens je proef? Dan betaal je niks.',
    faqProef:
      'Vandaag betaal je niks. Zeg je op tijdens je proef, dan blijft dat zo. Zeg je niet op, dan betaal je na 7 dagen €69,99 per jaar. Met iDEAL vraagt je bank eenmalig €0,01 om je rekening te koppelen.',
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

// Concreet: wat je krijgt en wat je eraan hebt (voorstel 21-10, Roel kan schrappen)
export const VOORDELEN = [
  { titel: 'Schema op maat', tekst: 'Precies afgestemd op jouw doel, niveau en trainingsdagen.' },
  { titel: 'Elke week sterker', tekst: 'Je coach past gewicht en herhalingen elke week aan op wat je deed.' },
  { titel: 'Nooit twijfelen', tekst: 'Uitleg bij elke oefening, en een AI-coach die al je vragen beantwoordt.' },
  { titel: 'Voeding bijhouden', tekst: 'Log je eten uit 2.300+ producten en zie direct je calorieën en eiwitten.' },
  { titel: 'Apparaat bezet?', tekst: 'Wissel met één tik naar een oefening voor dezelfde spieren.' },
]

/** Letterlijk uit de App Store; geen woorden veranderen. */
// Avatars: getekende figuurtjes (DiceBear "Notionists", CC0), geen foto's van echte mensen.
export const REVIEWS = [
  {
    avatar: 'gijs',
    titel: 'Flinke progressie',
    tekst:
      'Het zorgt ervoor dat ik consistent blijf en ik mezelf accountable voel om het beste uit de gym te halen. Gebruik het nu iets langer dan 3 maanden, en al mijn lifts zijn beter geworden qua kracht.',
    naam: 'Gijs',
  },
  {
    avatar: 'bjarne',
    titel: 'Precies wat ik zocht',
    tekst:
      'De app is een personal trainer maar dan betaalbaar. Instructies en uitleg is duidelijk en helpt me goed om af te vallen en sterker te worden',
    naam: 'Bjarne',
  },
  {
    avatar: 'luuk',
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
