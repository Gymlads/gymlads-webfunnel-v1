import type { OnboardingData } from '../types'
import { eenheid, getal, oefeningLabel, type DoelSoort } from './doel'

// Scherm "Zo haal jij je doel" (Roel, 20-11-2026, VOORSTEL v4): staat op de
// plek van de oude e-mailstap, vlak voor "Je plan staat klaar". Geen invulveld.
// Teksten: Mijlpalen-per-doel-v1 (alleen wat de app echt doet of laat zien,
// geen kilo's met een datum beloven). Het blok "Je eerste workout" is bewust
// weggelaten: het echte schema maakt de app pas na het inloggen (n8n).

interface Mijlpaal {
  week: number
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
  const trainingen = (data.sessies_per_week ?? 3) * 4
  const getalTekst = doelGetalTekst(data)
  const inZicht = getalTekst ? `Je ${getalTekst.zicht} komt in zicht` : null
  switch (data.doel) {
    case 'Afvallen':
      return [
        { week: 1, tekst: 'Je weet precies wat je traint en eet' },
        { week: 4, tekst: `${trainingen} trainingen gedaan, en je ziet je gewicht bewegen in de app` },
        { week: 8, tekst: inZicht ?? 'Je doel komt in zicht' },
      ]
    case 'Spieropbouw':
      return [
        { week: 1, tekst: 'Je weet bij elke oefening welk gewicht je pakt' },
        { week: 3, tekst: 'Je eerste record: meer gewicht dan vorige keer' },
        { week: 8, tekst: inZicht ?? 'Je ziet zwart op wit hoeveel sterker je bent' },
      ]
    case 'Kracht opbouwen':
      return [
        { week: 1, tekst: 'Je weet bij elke oefening welk gewicht je pakt' },
        { week: 3, tekst: 'Je eerste record staat op je naam' },
        { week: 8, tekst: inZicht ?? 'Je ziet zwart op wit hoeveel sterker je bent' },
      ]
    case 'Onderhouden':
      return [
        { week: 1, tekst: 'Je hebt een vast ritme dat past bij jouw week' },
        { week: 4, tekst: 'Geen week overgeslagen' },
        { week: 8, tekst: 'Je blijft sterker worden, zonder vast te lopen' },
      ]
    case 'Fit voelen':
    default:
      return [
        { week: 1, tekst: 'Je weet precies wat je moet doen, ook bij apparaten' },
        { week: 4, tekst: `Trainen is een vaste gewoonte: ${trainingen} workouts gedaan` },
        { week: 8, tekst: 'Je voelt je fitter en sterker dan vandaag' },
      ]
  }
}

export default function Doelscherm({ data }: { data: OnboardingData }) {
  const getalTekst = doelGetalTekst(data)
  const doelBlok = getalTekst?.blok ?? (data.doel || 'Fitter en sterker worden')
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
            >
              {stap.week}
            </span>
            <div className="doelscherm__kaart">
              <span className="doelscherm__week">Week {stap.week}</span>
              <span className="doelscherm__tekst">{stap.tekst}</span>
            </div>
          </li>
        ))}
      </ol>

      <p className="doelscherm__schatting">Schatting op basis van je antwoorden.</p>
    </div>
  )
}
