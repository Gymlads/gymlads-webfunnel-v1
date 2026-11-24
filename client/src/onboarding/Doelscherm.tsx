import type { OnboardingData } from '../types'
import { doelKeuze, eenheid, getal, oefeningLabel, type DoelSoort } from './doel'

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
  // Laatste chip per hoofddoel (Roel, 24-11).
  switch (doelKeuze(data)) {
    case 'Afvallen':
      chips.push('Voedingsdoel')
      break
    case 'Beter figuur':
      chips.push('Focus onderlichaam')
      break
    case 'Sterker worden':
      chips.push('Records per oefening')
      break
    default:
      if (sessies) chips.push(splitsing(sessies, data.ervaring_krachttraining))
  }
  return chips
}

/** Mijlpalen per hoofddoel, teksten van Roel (24-11-2026). */
export function mijlpalen(data: OnboardingData): Mijlpaal[] {
  const rij = (deze: string, vier: string, daarna: string): Mijlpaal[] => [
    { week: 'Deze week', tekst: deze },
    { week: 'Na 4 weken', tekst: vier },
    { week: 'Daarna', tekst: daarna },
  ]
  switch (doelKeuze(data)) {
    case 'Breder en gespierder':
    case 'Spieren opbouwen':
      return rij(
        'Je loopt de sportschool in en weet precies wat je moet doen',
        'Je merkt dat je sterker wordt en je kleding beter zit',
        'Anderen zien het aan je!',
      )
    case 'Beter figuur':
      return rij(
        'Je weet precies welke oefeningen je helpen met je figuur',
        'Je merkt dat je kleding beter zit',
        'Je krijgt de vraag: "Ga jij tegenwoordig naar de sportschool?"',
      )
    case 'Sterker worden':
      return rij(
        'Je weet precies hoe jij kracht opbouwt',
        'Je merkt dat je steeds zwaardere gewichten pakt',
        'Je doorbreekt je oude records!',
      )
    case 'Afvallen':
      return rij(
        'Je weet eindelijk hoe jij gericht kunt afvallen',
        'Je merkt dat je kleding anders gaat zitten',
        'Anderen zien aan je dat je bent afgevallen',
      )
    default:
      return rij(
        'Je komt in een vast sportritme',
        'Je hebt meer energie aan het einde van de dag',
        'Je voelt je beter dan in jaren',
      )
  }
}

export default function Doelscherm({ data }: { data: OnboardingData }) {
  const getalTekst = doelGetalTekst(data)
  // Afvallen/Sterker met getal ("5 kg afvallen", "Bankdrukken 80 kg"), anders de naam van het gekozen doel.
  const doelBlok = getalTekst?.blok ?? doelKeuze(data)
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
