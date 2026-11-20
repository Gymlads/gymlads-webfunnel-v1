import type { OnboardingData } from '../types'
import { eenheid, getal, oefeningLabel, type DoelSoort } from './doel'

// Scherm "Zo haal jij je doel" (Roel, 20-11-2026, VOORSTEL v4): staat op de
// plek van de oude e-mailstap, vlak voor "Je plan staat klaar". Geen invulveld.
// Teksten: Mijlpalen-per-doel v2 (DEFINITIEF 20-11) (alleen wat de app echt doet of laat zien,
// geen kilo's met een datum beloven). Het blok "Je eerste workout" is bewust
// weggelaten: het echte schema maakt de app pas na het inloggen (n8n).

interface Mijlpaal {
  week: string
  tekst: string
}

/** Het doel-getal als korte tekst, of null als er geen getal is ingevuld. */
export function doelGetalTekst(data: OnboardingData): { blok: string; zicht: string } | null {
  const soort = data.doel_soort as DoelSoort | ''
  if (!soort || soort === 'workouts') return null
  const start = data.doel_start
  const doel = data.doel_waarde
  if (start == null || doel == null) return null
  if (soort === 'kracht') {
    if (!data.doel_oefening) return null
    const tekst = `${oefeningLabel(data.doel_oefening)} ${getal(doel)} kg`
    return { blok: tekst, zicht: tekst.charAt(0).toLowerCase() + tekst.slice(1) }
  }
  const verschil = Math.abs(doel - start)
  if (!(verschil > 0)) return null
  const e = eenheid(soort)
  const hoeveel = `${getal(verschil)} ${e}`
  switch (soort) {
    case 'afvallen':
      return { blok: `${hoeveel} afvallen`, zicht: hoeveel }
    case 'aankomen':
      return { blok: `${hoeveel} erbij`, zicht: `${hoeveel} erbij` }
    case 'billen':
      return { blok: `${hoeveel} erbij op je billen`, zicht: `${hoeveel} erbij` }
    case 'armen':
      return { blok: `${hoeveel} erbij op je armen`, zicht: `${hoeveel} erbij` }
    case 'taille':
      return { blok: `${hoeveel} van je taille af`, zicht: `${hoeveel} eraf` }
    default:
      return null
  }
}

/** Zelfde splitsing als de schemamaker (n8n "M1 – Schema maken 4.0", regel 13/14). */
export function splitsing(sessies: number, ervaring: string): string {
  const beginner = ervaring.toLowerCase().includes('begin')
  if (sessies <= 2) return beginner ? 'Full body' : 'Upper / Lower'
  if (sessies <= 4) return 'Upper / Lower'
  if (sessies === 5) return 'PPL + Upper / Lower'
  return 'Push / Pull / Legs'
}

function locatieTekst(data: OnboardingData): string | null {
  switch (data.locatie_training) {
    case 'Sportschool':
      return 'Sportschool'
    case 'Thuis':
      return 'Thuis'
    case 'Beide':
      return 'Sportschool + thuis'
    default:
      return null
  }
}

export function planChips(data: OnboardingData): string[] {
  const chips: string[] = []
  const sessies = data.sessies_per_week
  if (sessies) chips.push(`${sessies}× per week`)
  const duur = parseInt(data.gewenste_trainingsduur, 10)
  if (duur > 0) chips.push(`${duur} min`)
  const plek = locatieTekst(data)
  if (plek) chips.push(plek)
  if (data.doel === 'Afvallen') chips.push('Voedingsdoel')
  else if (sessies) chips.push(splitsing(sessies, data.ervaring_krachttraining))
  return chips
}

export function mijlpalen(data: OnboardingData): Mijlpaal[] {
  const perWeek = data.sessies_per_week ?? 3
  const getalTekst = doelGetalTekst(data)
  // Kracht en afvallen: alleen het getal ("Je 80 kg komt in zicht").
  const inZicht = getalTekst && data.doel_waarde != null && data.doel_start != null
    ? `Je ${data.doel_soort === 'kracht' ? `${getal(data.doel_waarde)} kg` : getalTekst.zicht} komt in zicht`
    : null
  // Mijlpalen v2 (Roel, 20-11): geen 8 weken meer, ritme Deze week · Na 4 weken · Daarna.
  switch (data.doel) {
    case 'Afvallen':
      return [
        { week: 'Deze week', tekst: `Je eerste ${perWeek} trainingen staan, en je dagelijkse caloriedoel ook` },
        { week: 'Na 4 weken', tekst: 'Trainen is een gewoonte. In de app zie je hoe je gewicht verandert' },
        { week: 'Daarna', tekst: inZicht ?? 'Je voelt je lichter en fitter' },
      ]
    case 'Spieropbouw':
      return [
        { week: 'Deze week', tekst: 'Je weet bij elke oefening welk gewicht je pakt' },
        { week: 'Na 4 weken', tekst: 'Je verbreekt je records, week na week' },
        { week: 'Daarna', tekst: 'Elke week iets zwaarder. Nooit meer vastlopen op hetzelfde gewicht' },
      ]
    case 'Kracht opbouwen': {
      const oefening = data.doel_oefening ? oefeningLabel(data.doel_oefening).toLowerCase() : null
      return [
        { week: 'Deze week', tekst: 'Je startgewichten staan vast, per oefening' },
        { week: 'Na 4 weken', tekst: `Je verbreekt je records op ${oefening ?? 'je basisoefeningen'}` },
        { week: 'Daarna', tekst: inZicht ?? 'Elke maand een nieuw record' },
      ]
    }
    case 'Onderhouden':
      return [
        { week: 'Deze week', tekst: 'Een vast ritme dat past bij jouw week' },
        { week: 'Na 4 weken', tekst: `${perWeek * 4} trainingen gedaan, geen week overgeslagen` },
        { week: 'Daarna', tekst: 'Je blijft sterk, zonder na te denken over je schema' },
      ]
    case 'Fit voelen':
    default:
      return [
        { week: 'Deze week', tekst: 'Elke training ligt klaar. Je hoeft niks zelf te bedenken' },
        { week: 'Na 4 weken', tekst: 'Trainen is een gewoonte, en je hebt meer energie' },
        { week: 'Daarna', tekst: 'Je voelt je fitter en sterker dan vandaag' },
      ]
  }
}

export default function Doelscherm({ data }: { data: OnboardingData }) {
  const getalTekst = doelGetalTekst(data)
  const doelBlok =
    getalTekst?.blok ?? (data.doel === 'Onderhouden' ? 'Fit en sterk blijven' : data.doel || 'Fit voelen')
  const chips = planChips(data)
  const stappen = mijlpalen(data)

  return (
    <div className="doelscherm">
      <h1 className="doelscherm__titel">Zo haal jij je doel</h1>
      <p className="doelscherm__sub">Gemaakt op jouw antwoorden.</p>

      <div className="doelscherm__doel">
        <span className="doelscherm__label doelscherm__label--donker">Jouw doel</span>
        <span className="doelscherm__doel-tekst">{doelBlok}</span>
      </div>

      {chips.length > 0 && (
        <>
          <span className="doelscherm__label">Jouw plan</span>
          <div className="doelscherm__chips">
            {chips.map((chip) => (
              <span key={chip} className="doelscherm__chip">
                {chip}
              </span>
            ))}
          </div>
        </>
      )}

      <span className="doelscherm__label">Jouw mijlpalen</span>
      <ol className="doelscherm__mijlpalen">
        {stappen.map((stap, i) => (
          <li key={stap.week} className="doelscherm__mijlpaal">
            <span
              className={`doelscherm__bol${i === stappen.length - 1 ? ' doelscherm__bol--vol' : ''}`}
              aria-hidden="true"
            />
            <div className="doelscherm__kaart">
              <span className="doelscherm__week">{stap.week}</span>
              <span className="doelscherm__tekst">{stap.tekst}</span>
            </div>
          </li>
        ))}
      </ol>

      <p className="doelscherm__schatting">Schatting op basis van je antwoorden.</p>
    </div>
  )
}
