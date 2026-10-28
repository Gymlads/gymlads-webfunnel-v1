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
    /** Lime balk in de kaart als er een gratis proef is (zoals de app, 28-10). */
    proef: string | null
    knop: string
    kleineTekst: string
  }
> = {
  jaar: {
    naam: 'Jaarabonnement',
    label: 'Bespaar 50%',
    // Prijs per dag, gelijk aan de app (Roel 28-10): €99,99 / 365 = €0,27
    prijs: '€0,27',
    prijsEenheid: '/ dag',
    onderPrijs: 'Daarna €99,99 per jaar',
    proef: '7 dagen gratis uitproberen!',
    knop: 'GA VERDER',
    // ⚠️ Laten checken door een jurist (opdracht deel 4c)
    kleineTekst:
      'Vandaag betaal je €0. Na 7 dagen betaal je €99,99 voor een jaar. Opzeggen kan altijd tijdens je proef. Na het eerste jaar is je abonnement maandelijks opzegbaar.',
  },
  maand: {
    naam: 'Maandabonnement',
    label: null,
    // 12 × €17,99 / 365 = €0,59
    prijs: '€0,59',
    prijsEenheid: '/ dag',
    onderPrijs: '€17,99 per maand · geen proefperiode',
    proef: null,
    knop: 'GA VERDER',
    kleineTekst: 'Je betaalt vandaag €17,99, daarna elke maand. Elke maand opzegbaar.',
  },
}

/** Sterker-garantie (Roel 28-10), zelfde tekst als de app; voorwaarden op gymlads.nl. */
export const GARANTIE = {
  titel: 'Sterker in 8 weken, gegarandeerd',
  /** Eén regel direct onder de knop; bovenaan stond hij niet mooi (Roel 28-10). */
  kort: 'Garantie: sterker binnen 8 weken of je geld terug.',
  tekst: 'Volg je plan met je AI-coach. Word je niet sterker? Dan krijg je al je geld terug.',
}

export const FAQ_GARANTIE =
  'Volg je 8 weken je schema (minstens 90% van je workouts helemaal af), log je eten op 5 dagen per week en weeg je minstens 4 keer per week? Dan word je sterker: meer gewicht, meer herhalingen of meer sets dan in week 1. Lukt dat niet, mail dan binnen 14 dagen na week 8 naar info@gymlads.nl en je krijgt terug wat je hebt betaald. De volledige voorwaarden staan in artikel 18 van onze algemene voorwaarden.'

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
