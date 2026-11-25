// Train samen (referral, Roel 23-11-2026). Iemand komt binnen via
// proef.gymlads.nl/m/CODE (doorgestuurd naar /?ref=CODE). We onthouden de code
// 30 dagen in deze browser, tonen op de paywall "Uitgenodigd door ..." en geven
// de code mee aan de checkout. De korting zelf zet de server.
import { useEffect, useState } from 'react'

const SLEUTEL = 'gymlads.ts_ref'
const GELDIG_MS = 30 * 24 * 3600 * 1000
const CODE = /^[A-Z0-9]{4,12}$/

export function bewaarRefUitUrl() {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')?.trim().toUpperCase()
    if (ref && CODE.test(ref)) {
      localStorage.setItem(SLEUTEL, JSON.stringify({ code: ref, op: Date.now() }))
    }
  } catch {
    // geen opslag: dan alleen zonder korting
  }
}

export function huidigeRef(): string | null {
  try {
    const ruw = localStorage.getItem(SLEUTEL)
    if (!ruw) return null
    const { code, op } = JSON.parse(ruw) as { code?: string; op?: number }
    if (!code || !CODE.test(code) || !op || Date.now() - op > GELDIG_MS) return null
    return code
  } catch {
    return null
  }
}

export interface Uitnodiging {
  voornaam: string | null
  kortingProcent: number
}

/** Geldige uitnodiging (null = geen of ongeldig; dan gewoon de normale paywall). */
export function useUitnodiging(): Uitnodiging | null {
  const [uitnodiging, setUitnodiging] = useState<Uitnodiging | null>(null)
  useEffect(() => {
    const code = huidigeRef()
    if (!code) return
    let weg = false
    fetch(`/api/train-samen?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (weg || !d?.geldig) return
        setUitnodiging({ voornaam: d.voornaam ?? null, kortingProcent: Number(d.korting_procent) || 50 })
      })
      .catch(() => {})
    return () => {
      weg = true
    }
  }, [])
  return uitnodiging
}

/** Prijzen met korting op het eerste jaar (jaarprijs €99,99). */
export function eersteJaarPrijs(kortingProcent: number) {
  // Stripe rondt de korting af (50% van €99,99 = €50,00 korting), dus €49,99
  const cent = 9999 - Math.round((9999 * kortingProcent) / 100)
  const euro = (c: number) => (c / 100).toFixed(2).replace('.', ',')
  return { jaar: `€ ${euro(cent)}`, perDag: `€ ${euro(Math.round(cent / 365))}` }
}
