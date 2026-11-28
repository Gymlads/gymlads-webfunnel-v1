import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { OnboardingData } from '../types'
import { doelKeuze, getal, oefeningLabel } from './doel'

// Laadscherm "We maken jouw plan" (briefing activatie na betaling, hoofdstuk 6,
// ontwerp web-laadscherm.png). Puur voor de beleving: er wordt hier geen plan
// gemaakt (dat gebeurt pas na betalen). ±11 seconden (Roel 26-11: 10-12 s), geen knop, daarna vanzelf door.

const STAP_MS = 2600
const EINDE_MS = 600

/** Letterlijk uit de App Store (11 nov, 5 sterren), gekozen door Roel 26-11. Geen woorden veranderen. */
const REVIEW = {
  tekst:
    'App werkt uitstekend en de coach in de app kan je veel uitleggen. Ook de klantenservice via de mail is uitstekend. Erg tevreden met Gymlads!',
  naam: 'Bo',
}

function plekTekst(data: OnboardingData): string | null {
  switch (data.locatie_training) {
    case 'Sportschool':
      return 'sportschool'
    case 'Thuis':
      return 'thuis'
    case 'Beide':
      return 'sportschool + thuis'
    default:
      return null
  }
}

/** "Naar 80 kg · 3× per week · sportschool"; zonder kilo's de naam van het doel. */
export function laadschermOndertitel(data: OnboardingData): string {
  let doel: string
  if ((data.doel_soort === 'afvallen' || data.doel_soort === 'aankomen') && data.doel_waarde != null) {
    doel = `Naar ${getal(data.doel_waarde)} kg`
  } else if (data.doel_soort === 'kracht' && data.doel_waarde != null && data.doel_oefening) {
    doel = `${oefeningLabel(data.doel_oefening)} ${getal(data.doel_waarde)} kg`
  } else {
    doel = doelKeuze(data)
  }
  const delen = [doel]
  if (data.sessies_per_week) delen.push(`${data.sessies_per_week}× per week`)
  const plek = plekTekst(data)
  if (plek) delen.push(plek)
  return delen.join(' · ')
}

function stappen(data: OnboardingData): string[] {
  return [
    'Je doel en niveau verwerkt',
    'Trainingen per week ingedeeld',
    data.locatie_training === 'Thuis' ? 'Oefeningen voor thuis' : 'Oefeningen voor jouw sportschool',
    'Startgewichten bepalen',
  ]
}

const R = 58
const OMTREK = 2 * Math.PI * R

export default function WebLaadscherm({ data, onKlaar }: { data: OnboardingData; onKlaar: () => void }) {
  const lijst = stappen(data)
  const totaal = lijst.length * STAP_MS
  const [ms, setMs] = useState(0)
  const klaarRef = useRef(onKlaar)
  klaarRef.current = onKlaar

  useEffect(() => {
    const start = performance.now()
    let frame = 0
    let klaar = false
    const tik = () => {
      const verstreken = performance.now() - start
      setMs(Math.min(verstreken, totaal))
      if (verstreken >= totaal + EINDE_MS) {
        if (!klaar) {
          klaar = true
          klaarRef.current()
        }
        return
      }
      frame = requestAnimationFrame(tik)
    }
    frame = requestAnimationFrame(tik)
    return () => cancelAnimationFrame(frame)
  }, [totaal])

  const procent = Math.round((ms / totaal) * 100)
  const bezigMet = Math.min(Math.floor(ms / STAP_MS), lijst.length)

  return (
    <div className="laadscherm" role="status" aria-live="polite">
      <div className="laadscherm__ring">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <circle cx="70" cy="70" r={R} className="laadscherm__ring-bak" />
          <circle
            cx="70"
            cy="70"
            r={R}
            className="laadscherm__ring-voortgang"
            strokeDasharray={OMTREK}
            strokeDashoffset={OMTREK * (1 - procent / 100)}
          />
        </svg>
        <span className="laadscherm__procent">{procent}%</span>
      </div>

      <h1 className="laadscherm__kop">We maken jouw plan</h1>
      <p className="laadscherm__sub">{laadschermOndertitel(data)}</p>

      <ul className="laadscherm__stappen">
        {lijst.map((tekst, i) => {
          const stand = i < bezigMet ? 'klaar' : i === bezigMet ? 'bezig' : 'wacht'
          return (
            <li key={tekst} className={`laadscherm__stap laadscherm__stap--${stand}`}>
              <span className="laadscherm__stap-icoon" aria-hidden="true">
                {stand === 'klaar' && <Check size={14} strokeWidth={3.2} />}
              </span>
              {tekst}
            </li>
          )
        })}
      </ul>

      {REVIEW && (
        <figure className="laadscherm__review">
          <div className="laadscherm__sterren" aria-label="5 van 5 sterren">
            ★★★★★
          </div>
          <blockquote>“{REVIEW.tekst}”</blockquote>
          <figcaption>
            {REVIEW.naam} · App Store
          </figcaption>
        </figure>
      )}
    </div>
  )
}
