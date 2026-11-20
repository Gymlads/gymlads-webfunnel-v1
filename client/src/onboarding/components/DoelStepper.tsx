import { ZONE_NAMEN, getal, type Zone } from '../doel'

/** Groot getal met − en + (zoals de app, WaardeStepper). */
export function DoelStepper({
  waarde,
  eenheid,
  stap,
  min,
  max,
  onChange,
  klein,
  groot,
}: {
  klein?: boolean
  /** Kilo-scherm v2: één heel groot getal met ronde knoppen */
  groot?: boolean
  waarde: number
  eenheid: string
  stap: number
  min: number
  max: number
  onChange: (waarde: number) => void
}) {
  const zet = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v / stap) * stap)))
  return (
    <div className={`doel-stepper${klein ? ' doel-stepper--klein' : ''}${groot ? ' doel-stepper--groot' : ''}`}>
      <button type="button" className="doel-stepper__knop" aria-label="Minder" onClick={() => zet(waarde - stap)}>
        −
      </button>
      <div className="doel-stepper__waarde">
        {getal(waarde)}
        <span className="doel-stepper__eenheid"> {eenheid}</span>
      </div>
      <button type="button" className="doel-stepper__knop" aria-label="Meer" onClick={() => zet(waarde + stap)}>
        +
      </button>
    </div>
  )
}

/** Meter met vier zones: lime tot het gekozen niveau, oranje bij "Te veel" (kilo-scherm v2, 20-11). */
export function DoelZoneBalk({ zone }: { zone: Zone }) {
  return (
    <div className="doel-zone">
      <div className="doel-zone__balk">
        {[0, 1, 2, 3].map((z) => (
          <div
            key={z}
            className={`doel-zone__deel${z <= zone ? (zone === 3 ? ' doel-zone__deel--oranje' : ' doel-zone__deel--aan') : ''}`}
          />
        ))}
      </div>
      <div className="doel-zone__namen">
        {ZONE_NAMEN.map((n, z) => (
          <span key={n} className={z === zone ? 'doel-zone__naam--actief' : undefined}>
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}

export function DoelAdvies({ zone, vet, tekst }: { zone: Zone; vet?: string; tekst: string }) {
  return (
    <div className={`doel-advies${zone === 3 ? ' doel-advies--oranje' : ''}`}>
      {vet ? <strong>{vet} </strong> : null}
      {tekst}
    </div>
  )
}
