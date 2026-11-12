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
}: {
  klein?: boolean
  waarde: number
  eenheid: string
  stap: number
  min: number
  max: number
  onChange: (waarde: number) => void
}) {
  const zet = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v / stap) * stap)))
  return (
    <div className={`doel-stepper${klein ? ' doel-stepper--klein' : ''}`}>
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

/** Balk met vier zones en een bolletje (zoals de app, ZoneBalk). */
export function DoelZoneBalk({ zone, positie }: { zone: Zone; positie: number }) {
  return (
    <div className="doel-zone">
      <div className="doel-zone__balk">
        {[0, 1, 2, 3].map((z) => (
          <div key={z} className={`doel-zone__deel doel-zone__deel--${z}${z === zone ? ' doel-zone__deel--actief' : ''}`} />
        ))}
        <div className={`doel-zone__knop${zone === 3 ? ' doel-zone__knop--oranje' : ''}`} style={{ left: `${positie}%` }} />
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
