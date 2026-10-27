// Alle teksten en keuzes van de paywall op één plek (v3, 21-10-2026).
// Punten met ⚠️ beslist Roel voordat dit live gaat (zie docs/paywall-v3.md).

/**
 * Prijsmodel jaar + maand (opdracht Roel 26-10-2026, docs/prijsmodel-jaar-maand.md).
 * Moet precies kloppen met wat Stripe afschrijft: jaar = Cloudflare-variabele
 * STRIPE_PRICE_ID (€99,99/jaar, 7 dagen proef), maand = STRIPE_PRICE_ID_MAAND
 * (€17,99/maand, geen proef). Geen kortingsbon meer.
 * Rekensom: 12 × €17,99 = €215,88, jaar is 53,7% goedkoper, dus "Bespaar 50%" klopt.
 */
export type Plan = 'jaar' | 'maand'

/** Standaard gekozen plan. Geen kop boven de paywall, net als de app (27-10). */
export const STANDAARD_PLAN: Plan = 'jaar'

export const PLANNEN: Record<
  Plan,
  {
    naam: string
    label: string | null
    prijs: string
    prijsEenheid: string
    onderPrijs: string
    knop: string
    kleineTekst: string
  }
> = {
  jaar: {
    naam: 'Jaarabonnement',
    label: 'Bespaar 50%',
    prijs: '€8,33',
    prijsEenheid: '/ maand',
    onderPrijs: '7 dagen gratis proef · daarna €99,99 per jaar',
    knop: 'START MIJN 7 DAGEN GRATIS',
    // ⚠️ Laten checken door een jurist (opdracht deel 4c)
    kleineTekst:
      'Vandaag betaal je €0. Na 7 dagen betaal je €99,99 voor een jaar. Opzeggen kan altijd tijdens je proef. Na het eerste jaar is je abonnement maandelijks opzegbaar.',
  },
  maand: {
    naam: 'Maandabonnement',
    label: null,
    prijs: '€17,99',
    prijsEenheid: '/ maand',
    onderPrijs: 'Geen gratis proef · elke maand opzegbaar',
    knop: 'START NU VOOR €17,99',
    kleineTekst: 'Je betaalt vandaag €17,99, daarna elke maand. Elke maand opzegbaar.',
  },
}

export const FAQ_PROEF =
  'Kies je het jaarabonnement, dan probeer je Gymlads 7 dagen gratis. Vandaag betaal je €0. Zeg je op tijdens je proef, dan betaal je niks. Zeg je niet op, dan betaal je €99,99 voor een jaar. Betaal je met iDEAL, dan vraagt je bank eenmalig €0,01 om je rekening te koppelen.'

export const FAQ_VERSCHIL =
  'Met het jaarabonnement probeer je Gymlads eerst 7 dagen gratis, en betaal je daarna €99,99 per jaar. Dat is €8,33 per maand. Met het maandabonnement betaal je €17,99 per maand, zonder proefperiode, en zeg je elke maand op.'

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

// Letterlijk van Roel (21-10-2026)
export const VOORDELEN = [
  'Je eigen AI-coach, die je helpt bij elke training en al je vragen',
  'Een schema op maat voor jouw doel en niveau',
  'Elke week wordt je plan bijgestuurd op basis van jouw voortgang',
  'Alles in één app: training, voeding en voortgang',
]

/** Letterlijk uit de App Store; geen woorden veranderen. */
// Avatars: foto's aangeleverd door Roel (assets/lid-*.jpg).
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
