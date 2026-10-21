import type { OnboardingData } from '../types'

// Antwoorden + e-mail even bewaren op dit toestel, zodat "Probeer opnieuw" na
// een geannuleerde betaling (of terug uit de bank-app) meteen weer op de
// paywall uitkomt in plaats van bij vraag 1. Max. 24 uur, alleen dit toestel.

const KEY = 'gl_funnel_antwoorden'
const MAX_LEEFTIJD_MS = 24 * 60 * 60 * 1000

export interface Bewaard {
  data: OnboardingData
  email: string
  herinneringen: boolean
  opgeslagen: number
}

export function bewaarAntwoorden(data: OnboardingData, email: string, herinneringen: boolean) {
  try {
    const waarde: Bewaard = { data, email, herinneringen, opgeslagen: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(waarde))
  } catch {
    // localStorage geblokkeerd: dan begint "Probeer opnieuw" bij vraag 1
  }
}

export function leesAntwoorden(): Bewaard | null {
  try {
    const ruw = localStorage.getItem(KEY)
    if (!ruw) return null
    const waarde = JSON.parse(ruw) as Bewaard
    if (!waarde?.data || Date.now() - waarde.opgeslagen > MAX_LEEFTIJD_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return waarde
  } catch {
    return null
  }
}

export function wisAntwoorden() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // stil
  }
}
