export type Geslacht = 'Man' | 'Vrouw' | 'Zeg ik liever niet'

export type Doel =
  | 'Afvallen'
  | 'Spieropbouw'
  | 'Kracht opbouwen'
  | 'Onderhouden'
  | 'Fit voelen'

export type GrootsteUitdaging =
  | 'Consistentie'
  | 'Motivatie'
  | 'Niet weten wat te doen'
  | 'Geen resultaat'
  | 'Weinig tijd'

export type ErvaringKrachttraining =
  | 'Ik begin net'
  | 'Ik train soms (niet consistent)'
  | '6-12 maanden consistent'
  | '1+ jaar consistent'

export type LocatieTraining = 'Sportschool' | 'Thuis' | 'Beide'

/** Grote of kleine sportschool (zoals de app, 2.2.6). Leeg = groot. */
export type SoortSportschool = '' | 'groot' | 'klein'

export type GewensteTrainingsduur =
  | '30 minuten'
  | '45 minuten'
  | '60 minuten'
  | '75 minuten'
  | '90 minuten'

export type SpiergroepFocus =
  | 'Borst'
  | 'Rug'
  | 'Schouder'
  | 'Biceps'
  | 'Triceps'
  | 'Billen/Benen'
  | 'Ik wil alles gelijk trainen'

export type DagelijkseActiviteit =
  | 'Meestal zittend'
  | 'Veel staan'
  | 'Een combinatie van zitten en staan'
  | 'Het verschilt elke dag'

export interface OnboardingData {
  geslacht: Geslacht | ''
  leeftijd: number | null
  lengte: string
  gewicht: string
  doel: Doel | ''
  grootste_uitdaging: GrootsteUitdaging | ''
  ervaring_krachttraining: ErvaringKrachttraining | ''
  sessies_per_week: number | null
  gewenste_trainingsduur: GewensteTrainingsduur | ''
  focus_spiergroepen: SpiergroepFocus | ''
  locatie_training: LocatieTraining | ''
  dagelijkse_activiteit: DagelijkseActiviteit | ''
  train_maandag: boolean
  train_dinsdag: boolean
  train_woensdag: boolean
  train_donderdag: boolean
  train_vrijdag: boolean
  train_zaterdag: boolean
  train_zondag: boolean
  maandag_sportschool_trainen: boolean
  dinsdag_sportschool_trainen: boolean
  woensdag_sportschool_trainen: boolean
  donderdag_sportschool_trainen: boolean
  vrijdag_sportschool_trainen: boolean
  zaterdag_sportschool_trainen: boolean
  zondag_sportschool_trainen: boolean
  maandag_thuis_trainen: boolean
  dinsdag_thuis_trainen: boolean
  woensdag_thuis_trainen: boolean
  donderdag_thuis_trainen: boolean
  vrijdag_thuis_trainen: boolean
  zaterdag_thuis_trainen: boolean
  zondag_thuis_trainen: boolean
  dumbbells_thuis: boolean
  benchpress_thuis: boolean
  squatrek_thuis: boolean
  pullup_bar_thuis: boolean
  dipstation_thuis: boolean
  abwheel_thuis: boolean
  springtouw_thuis: boolean
  soort_sportschool: SoortSportschool
  sportschool_dumbbells: boolean
  sportschool_barbell: boolean
  sportschool_bankje: boolean
  sportschool_kabel: boolean
  sportschool_machines: boolean
  sportschool_smith: boolean
  sportschool_optrekstang: boolean
  sportschool_dipstation: boolean
  source: string
  subscribed_int: number
}

export type BooleanFieldKey = {
  [K in keyof OnboardingData]: OnboardingData[K] extends boolean ? K : never
}[keyof OnboardingData]

export const WEEKDAYS = [
  { day: 'maandag', label: 'Maandag', train: 'train_maandag', gym: 'maandag_sportschool_trainen', home: 'maandag_thuis_trainen' },
  { day: 'dinsdag', label: 'Dinsdag', train: 'train_dinsdag', gym: 'dinsdag_sportschool_trainen', home: 'dinsdag_thuis_trainen' },
  { day: 'woensdag', label: 'Woensdag', train: 'train_woensdag', gym: 'woensdag_sportschool_trainen', home: 'woensdag_thuis_trainen' },
  { day: 'donderdag', label: 'Donderdag', train: 'train_donderdag', gym: 'donderdag_sportschool_trainen', home: 'donderdag_thuis_trainen' },
  { day: 'vrijdag', label: 'Vrijdag', train: 'train_vrijdag', gym: 'vrijdag_sportschool_trainen', home: 'vrijdag_thuis_trainen' },
  { day: 'zaterdag', label: 'Zaterdag', train: 'train_zaterdag', gym: 'zaterdag_sportschool_trainen', home: 'zaterdag_thuis_trainen' },
  { day: 'zondag', label: 'Zondag', train: 'train_zondag', gym: 'zondag_sportschool_trainen', home: 'zondag_thuis_trainen' },
] as const satisfies ReadonlyArray<{
  day: string
  label: string
  train: BooleanFieldKey
  gym: BooleanFieldKey
  home: BooleanFieldKey
}>

// Zelfde lijst en volgorde als de app (apparatuur-thuis.tsx).
export const HOME_EQUIPMENT = [
  { key: 'dumbbells_thuis', label: 'Dumbbells' },
  { key: 'benchpress_thuis', label: 'Benchpress' },
  { key: 'squatrek_thuis', label: 'Squat rack' },
  { key: 'pullup_bar_thuis', label: 'Pull-up bar' },
  { key: 'dipstation_thuis', label: 'Dipstation' },
  { key: 'abwheel_thuis', label: 'Abwheel' },
  { key: 'springtouw_thuis', label: 'Springtouw' },
] as const satisfies ReadonlyArray<{
  key: BooleanFieldKey
  label: string
}>

/**
 * Toestellen in een kleine sportschool, gelijk aan de app
 * (src/lib/sportschool-toestellen.ts). `standaard` = vooraf aangevinkt.
 */
export const SPORTSCHOOL_TOESTELLEN = [
  { key: 'sportschool_dumbbells', label: 'Dumbbells', emoji: '🏋️', standaard: true },
  { key: 'sportschool_barbell', label: 'Barbell + rek', emoji: '🏋️‍♂️', standaard: true },
  { key: 'sportschool_bankje', label: 'Bankje', emoji: '🪑', standaard: true },
  { key: 'sportschool_kabel', label: 'Kabelstation', emoji: '🔗', standaard: false },
  { key: 'sportschool_machines', label: 'Machines', emoji: '⚙️', standaard: true },
  { key: 'sportschool_smith', label: 'Smith machine', emoji: '🧱', standaard: false },
  { key: 'sportschool_optrekstang', label: 'Optrekstang', emoji: '🤸', standaard: true },
  { key: 'sportschool_dipstation', label: 'Dipstation', emoji: '💪', standaard: false },
] as const satisfies ReadonlyArray<{
  key: BooleanFieldKey
  label: string
  emoji: string
  standaard: boolean
}>

export const initialOnboardingData: OnboardingData = {
  geslacht: '',
  leeftijd: null,
  lengte: '',
  gewicht: '',
  doel: '',
  grootste_uitdaging: '',
  ervaring_krachttraining: '',
  sessies_per_week: null,
  gewenste_trainingsduur: '',
  focus_spiergroepen: '',
  locatie_training: '',
  dagelijkse_activiteit: '',
  train_maandag: false,
  train_dinsdag: false,
  train_woensdag: false,
  train_donderdag: false,
  train_vrijdag: false,
  train_zaterdag: false,
  train_zondag: false,
  maandag_sportschool_trainen: false,
  dinsdag_sportschool_trainen: false,
  woensdag_sportschool_trainen: false,
  donderdag_sportschool_trainen: false,
  vrijdag_sportschool_trainen: false,
  zaterdag_sportschool_trainen: false,
  zondag_sportschool_trainen: false,
  maandag_thuis_trainen: false,
  dinsdag_thuis_trainen: false,
  woensdag_thuis_trainen: false,
  donderdag_thuis_trainen: false,
  vrijdag_thuis_trainen: false,
  zaterdag_thuis_trainen: false,
  zondag_thuis_trainen: false,
  dumbbells_thuis: false,
  benchpress_thuis: false,
  squatrek_thuis: false,
  pullup_bar_thuis: false,
  dipstation_thuis: false,
  abwheel_thuis: false,
  springtouw_thuis: false,
  soort_sportschool: '',
  sportschool_dumbbells: false,
  sportschool_barbell: false,
  sportschool_bankje: false,
  sportschool_kabel: false,
  sportschool_machines: false,
  sportschool_smith: false,
  sportschool_optrekstang: false,
  sportschool_dipstation: false,
  source: 'web',
  subscribed_int: 0,
}

/**
 * Sportschool-antwoorden (2.2.6) gaan NIET mee in de checkout-metadata: die
 * gaat in zijn geheel via n8n naar funnel_staging, waar deze kolommen (nog)
 * niet bestaan. Ze gaan apart mee (zie sportschoolAntwoorden).
 */
const NIET_IN_CHECKOUT = new Set<string>([
  'soort_sportschool',
  ...SPORTSCHOOL_TOESTELLEN.map((t) => t.key),
])

/** Kleine sportschool + toestellen, compact (voor de abonnement-metadata in Stripe). */
export function sportschoolAntwoorden(data: OnboardingData): Record<string, string> {
  return {
    soort_sportschool: data.soort_sportschool,
    sportschool_toestellen:
      data.soort_sportschool === 'klein'
        ? SPORTSCHOOL_TOESTELLEN.filter((t) => data[t.key])
            .map((t) => t.key.replace('sportschool_', ''))
            .join(',')
        : '',
  }
}

/**
 * Trainingsdagen zoals de app ze vraagt: alleen per locatie. train_* (oude
 * velden) = alle dagen samen; dagen van de andere locatie gaan uit.
 */
export function werkDagenBij(data: OnboardingData): OnboardingData {
  const next = { ...data }
  const gym = data.locatie_training === 'Sportschool' || data.locatie_training === 'Beide'
  const thuis = data.locatie_training === 'Thuis' || data.locatie_training === 'Beide'
  for (const d of WEEKDAYS) {
    if (!gym) next[d.gym] = false
    if (!thuis) next[d.home] = false
    next[d.train] = next[d.gym] || next[d.home]
  }
  if (data.locatie_training === 'Thuis') next.soort_sportschool = ''
  return next
}

export function toStripeMetadata(data: OnboardingData): Record<string, string> {
  const metadata: Record<string, string> = {}

  for (const [key, value] of Object.entries(data)) {
    if (NIET_IN_CHECKOUT.has(key)) continue
    if (typeof value === 'boolean') {
      metadata[key] = value ? 'true' : 'false'
    } else if (value === null || value === '') {
      metadata[key] = ''
    } else {
      metadata[key] = String(value)
    }
  }

  return metadata
}
