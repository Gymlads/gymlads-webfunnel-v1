import type { OnboardingData } from '../types'

// Eigen meting voor de trechter op gymlads.nl/trechter (zie docs/meten.md).
//
// - Anoniem: een willekeurige sessie-id per tabblad (sessionStorage, geen
//   cookie). Geen naam, e-mail, telefoon, lengte of gewicht; de leeftijd
//   wordt in Supabase meteen een leeftijdsgroep.
// - Fire-and-forget: alles zit in try/catch en wacht nergens op. Een mislukte
//   meting merkt de bezoeker niet.

export type MeetStap =
  | 'gender' | 'stats' | 'goal' | 'info-personalization' | 'info-consistency'
  | 'challenge' | 'experience' | 'info-experience' | 'info-goals' | 'info-schedule'
  | 'frequency' | 'duration' | 'muscle-focus' | 'location' | 'training-days'
  | 'gym-days' | 'home-days' | 'activity' | 'equipment' | 'info-feedback'
  | 'plan-ready' | 'paywall' | 'betaalknop' | 'betaald'

const SESSIE_KEY = 'gl_meet_sessie'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

interface Sessie {
  id: string
  info: Record<string, string>
}

let geheugen: Sessie | null = null

function maakId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Oudere browsers: zelfde vorm (UUID v4)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function leesOpgeslagen(): Sessie | null {
  if (geheugen) return geheugen
  try {
    const ruw = sessionStorage.getItem(SESSIE_KEY)
    if (ruw) geheugen = JSON.parse(ruw) as Sessie
  } catch {
    // sessionStorage geblokkeerd: dan alleen in het geheugen
  }
  return geheugen
}

function nieuweSessie(): Sessie {
  const info: Record<string, string> = {}
  try {
    const params = new URLSearchParams(window.location.search)
    for (const key of UTM_KEYS) {
      const waarde = params.get(key)
      if (waarde) info[key] = waarde.slice(0, 300)
    }
    if (params.get('test') === '1') info.test = '1'
    info.host = window.location.hostname
    info.apparaat = window.matchMedia?.('(pointer: coarse)').matches ? 'mobiel' : 'desktop'
  } catch {
    // niets: de meting is nooit belangrijker dan de funnel
  }
  const sessie = { id: maakId(), info }
  geheugen = sessie
  try {
    sessionStorage.setItem(SESSIE_KEY, JSON.stringify(sessie))
  } catch {
    // zie boven
  }
  return sessie
}

/** Sessie van dit tabblad; maakt er een als die er nog niet is. */
export function meetSessie(): Sessie {
  return leesOpgeslagen() ?? nieuweSessie()
}

function verstuur(body: unknown) {
  try {
    const tekst = JSON.stringify(body)
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const ok = navigator.sendBeacon('/api/meet', new Blob([tekst], { type: 'application/json' }))
      if (ok) return
    }
    void fetch('/api/meet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: tekst,
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // stil
  }
}

/**
 * Meld dat deze bezoeker een stap ziet. Elke stap telt één keer per sessie
 * (Supabase negeert herhalingen). Met alleenBestaand=true wordt er geen nieuwe
 * sessie gemaakt (bv. op de bedankpagina in een nieuw tabblad).
 */
export function meetStap(
  stap: MeetStap,
  volgnummer?: number,
  data?: Partial<OnboardingData>,
  opties?: { alleenBestaand?: boolean },
) {
  try {
    const sessie = opties?.alleenBestaand ? leesOpgeslagen() : meetSessie()
    if (!sessie) return
    const info: Record<string, string | number> = { ...sessie.info }
    if (data?.geslacht) info.geslacht = data.geslacht
    if (typeof data?.leeftijd === 'number') info.leeftijd = data.leeftijd
    if (data?.ervaring_krachttraining) info.ervaring = data.ervaring_krachttraining
    verstuur({ sessie: sessie.id, stap, volgnummer: volgnummer ?? null, info })
  } catch {
    // stil
  }
}

/** Wat er bij de betaalknop mee naar de server gaat (koppeling met Stripe). */
export function meetKoppeling(): { sessie: string; utm_content?: string } | undefined {
  try {
    const sessie = meetSessie()
    return { sessie: sessie.id, utm_content: sessie.info.utm_content }
  } catch {
    return undefined
  }
}
