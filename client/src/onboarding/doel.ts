// Doel in de webfunnel (Roel, 12 nov 2026): dezelfde vragen en grenzen als
// de app (gymlads-app src/lib/doelen.ts en src/lib/doel-teksten.ts). Houd
// die twee gelijk. Het doel gaat bij de betaalknop naar de server, die het
// in Supabase bewaart (web_doel_bewaren); de app neemt het over bij inloggen.

import type { OnboardingData } from '../types'

export type DoelSoort = 'afvallen' | 'aankomen' | 'taille' | 'billen' | 'armen' | 'kracht' | 'workouts'
export type Niveau = 'beginner' | 'gemiddeld' | 'gevorderd'
export type Zone = 0 | 1 | 2 | 3

export interface DoelOptie {
  soort: DoelSoort
  emoji: string
  label: string
}

/**
 * Vier vaste keuzes (Roel, 12 nov): afvallen, sterker worden (daarna welke
 * oefening), spiermassa aankomen, en bij vrouwen grotere billen.
 */
export function doelOpties(geslacht: string): DoelOptie[] {
  const opties: DoelOptie[] = [
    { soort: 'afvallen', emoji: '🔥', label: 'Afvallen' },
    { soort: 'kracht', emoji: '🏋️', label: 'Sterker worden' },
    { soort: 'aankomen', emoji: '💪', label: 'Spiermassa aankomen' },
  ]
  if (!geslacht.toLowerCase().startsWith('man')) {
    opties.push({ soort: 'billen', emoji: '🍑', label: 'Grotere billen' })
  }
  return opties
}

/** Zelfde zes oefeningen als de app (ONBOARDING_OEFENINGEN). */
export const DOEL_OEFENINGEN: ReadonlyArray<{ naam: string; label: string }> = [
  { naam: 'Barbell Bench Press', label: 'Bankdrukken' },
  { naam: 'Barbell Back Squat', label: 'Squat' },
  { naam: 'Deadlift', label: 'Deadlift' },
  { naam: 'Hip Thrust', label: 'Hip thrust' },
  { naam: 'Barbell Overhead Press', label: 'Overhead press' },
  { naam: 'Lat Pulldown', label: 'Lat pulldown' },
]

export function oefeningLabel(naam: string): string {
  return DOEL_OEFENINGEN.find((o) => o.naam === naam)?.label ?? naam
}

export function niveauUitErvaring(ervaring: string): Niveau {
  // Het doel komt nu vóór de ervaringsvraag: dan het midden aanhouden.
  if (!ervaring) return 'gemiddeld'
  const e = ervaring.toLowerCase()
  if (e.includes('1+ jaar')) return 'gevorderd'
  if (e.includes('6-12')) return 'gemiddeld'
  return 'beginner'
}

export function eenheid(soort: DoelSoort): string {
  return soort === 'taille' || soort === 'billen' || soort === 'armen' ? 'cm' : 'kg'
}

export function omlaag(soort: DoelSoort): boolean {
  return soort === 'afvallen' || soort === 'taille'
}

function rond(waarde: number, stap: number) {
  return Math.round(waarde / stap) * stap
}

/** Voorstel en maximum voor de verandering in 8 weken (zelfde als de app). */
export function grenzen(soort: DoelSoort, start: number, niveau: Niveau): { voorstel: number; max: number; stap: number } {
  switch (soort) {
    case 'afvallen':
      return { voorstel: rond(start * 0.045, 0.5), max: rond(start * 0.07, 0.5), stap: 0.5 }
    case 'aankomen': {
      const p = niveau === 'beginner' ? [0.02, 0.035] : niveau === 'gemiddeld' ? [0.015, 0.03] : [0.01, 0.02]
      return { voorstel: Math.max(0.5, rond(start * p[0], 0.5)), max: Math.max(1, rond(start * p[1], 0.5)), stap: 0.5 }
    }
    case 'taille':
      return { voorstel: 3, max: 6, stap: 0.5 }
    case 'billen':
      return niveau === 'beginner' ? { voorstel: 1.5, max: 3, stap: 0.5 } : { voorstel: 1, max: 2, stap: 0.5 }
    case 'armen':
      return niveau === 'beginner' ? { voorstel: 1, max: 2, stap: 0.5 } : { voorstel: 0.5, max: 1.5, stap: 0.5 }
    case 'kracht': {
      const p = niveau === 'beginner' ? [0.15, 0.3] : niveau === 'gemiddeld' ? [0.075, 0.15] : [0.03, 0.08]
      const stap = start >= 40 ? 2.5 : 1
      return { voorstel: Math.max(stap, rond(start * p[0], stap)), max: Math.max(stap * 2, rond(start * p[1], stap)), stap }
    }
    default:
      return { voorstel: 0, max: 0, stap: 1 }
  }
}

export function zoneVan(verandering: number, g: { voorstel: number; max: number }): Zone {
  const v = Math.abs(verandering)
  if (v > g.max + 1e-9) return 3
  if (v < g.voorstel * 0.5) return 0
  if (v <= g.voorstel * 1.25 + 1e-9) return 1
  return 2
}

export const ZONE_NAMEN = ['Rustig', 'Uitdagend', 'Ambitieus', 'Te veel'] as const

/** Bereik van de schuif voor het startpunt. */
export function startBereik(soort: DoelSoort): { min: number; max: number; stap: number } {
  switch (soort) {
    case 'afvallen':
    case 'aankomen':
      return { min: 40, max: 180, stap: 0.5 }
    case 'taille':
      return { min: 50, max: 160, stap: 0.5 }
    case 'billen':
      return { min: 70, max: 150, stap: 0.5 }
    case 'armen':
      return { min: 20, max: 55, stap: 0.5 }
    case 'kracht':
      return { min: 5, max: 250, stap: 2.5 }
    default:
      return { min: 0, max: 0, stap: 1 }
  }
}

export function standaardStart(soort: DoelSoort, geslacht: string): number {
  const man = geslacht.toLowerCase().startsWith('man')
  switch (soort) {
    case 'afvallen':
    case 'aankomen':
      return man ? 80 : 65
    case 'taille':
      return man ? 90 : 78
    case 'billen':
      return 98
    case 'armen':
      return man ? 33 : 28
    case 'kracht':
      return man ? 60 : 30
    default:
      return 0
  }
}

export function startTitel(soort: DoelSoort, oefening: string): string {
  switch (soort) {
    case 'afvallen':
    case 'aankomen':
      return 'Hoeveel weeg je nu?'
    case 'taille':
      return 'Hoeveel is je taille nu?'
    case 'billen':
      return 'Hoeveel is je billen-omtrek nu?'
    case 'armen':
      return 'Hoeveel is je armomtrek nu?'
    case 'kracht':
      return `Hoeveel kun je nu ${oefeningLabel(oefening).toLowerCase()}?`
    default:
      return ''
  }
}

export function startUitleg(soort: DoelSoort): string {
  if (soort === 'kracht')
    return "Het zwaarste gewicht waarmee je zo'n 8 herhalingen haalt. Weet je het niet precies? Een schatting is prima."
  if (soort === 'billen') return 'Meet over het breedste punt van je billen. Een schatting is ook goed.'
  if (soort === 'taille') return 'Meet ter hoogte van je navel, ontspannen. Een schatting is ook goed.'
  if (soort === 'armen') return 'Meet je bovenarm op het dikste punt. Een schatting is ook goed.'
  return 'Dit is je startpunt. We tellen vanaf hier.'
}

export function getalTitel(soort: DoelSoort, oefening: string): string {
  switch (soort) {
    case 'afvallen':
      return 'Hoeveel kilo eraf in 8 weken?'
    case 'aankomen':
      return 'Hoeveel kilo erbij in 8 weken?'
    case 'taille':
      return 'Hoeveel centimeter van je taille af?'
    case 'billen':
      return 'Hoeveel centimeter erbij op je billen?'
    case 'armen':
      return 'Hoeveel centimeter erbij op je armen?'
    case 'kracht':
      return `Welk gewicht wil je ${oefeningLabel(oefening).toLowerCase()}?`
    default:
      return ''
  }
}

export function getal(waarde: number): string {
  return waarde.toLocaleString('nl-NL', { maximumFractionDigits: 1 })
}

/** Advies onder de balk. Nooit "dit lukt niemand" (Roel). */
export function adviesTekst(soort: DoelSoort, verandering: number, zone: Zone, max: number, start: number): { vet?: string; tekst: string } {
  const e = eenheid(soort)
  if (zone === 3) {
    const maxWaarde = soort === 'kracht' ? `${getal(start + max)} ${e}` : `${getal(max)} ${e}`
    return {
      tekst: `Zo'n grote stap kost meestal meer dan 8 weken. Voor jou raden we maximaal ${maxWaarde} aan, en dat is al ambitieus.`,
    }
  }
  if (zone === 0)
    return {
      vet: 'Rustig doel.',
      tekst: 'Dit haal je zeker als je je plan volgt. Wil je meer uitdaging, dan mag het ook iets meer zijn.',
    }
  if (zone === 2)
    return {
      vet: 'Ambitieus!',
      tekst: 'Haalbaar als je elke workout doet en je eten goed bijhoudt. Wij helpen je elke week.',
    }
  const perWeek = (verandering / 8).toLocaleString('nl-NL', { maximumFractionDigits: 2 })
  switch (soort) {
    case 'aankomen':
      return { vet: 'Mooi doel.', tekst: `Dit haal je als je je plan volgt: zo'n ${perWeek} kg per week, vooral spiermassa.` }
    case 'afvallen':
      return { vet: 'Mooi doel.', tekst: `Dit haal je als je je plan volgt: zo'n ${perWeek} kg per week, terwijl je je spieren houdt.` }
    case 'kracht':
      return { vet: 'Mooi doel.', tekst: `+${getal(verandering)} kg in 8 weken past bij jouw niveau.` }
    default:
      return { vet: 'Mooi doel.', tekst: 'Dit haal je als je je plan volgt en goed eet. Meet jezelf 1x per week.' }
  }
}

/** Het doel zoals het naar de server gaat (of null: geen doel gekozen). */
export function webDoel(data: OnboardingData):
  | { soort: DoelSoort; oefening: string | null; start: number | null; doel: number | null }
  | null {
  const soort = data.doel_soort
  if (!soort) return null
  if (soort === 'workouts') return { soort, oefening: null, start: null, doel: null }
  if (data.doel_start == null || data.doel_waarde == null) return null
  if (soort === 'kracht' && !data.doel_oefening) return null
  return {
    soort,
    oefening: soort === 'kracht' ? data.doel_oefening : null,
    start: data.doel_start,
    doel: data.doel_waarde,
  }
}

/** Positie van het bolletje op de balk (0-100), zoals de app. */
export function zonePositie(verandering: number, g: { voorstel: number; max: number }): number {
  const v = Math.abs(verandering)
  const a = g.voorstel * 0.5
  const b = g.voorstel * 1.25
  const c = g.max
  const lin = (x: number, x0: number, x1: number, y0: number, y1: number) =>
    y0 + ((Math.min(Math.max(x, x0), x1) - x0) / Math.max(x1 - x0, 1e-9)) * (y1 - y0)
  if (v <= a) return lin(v, 0, a, 4, 25)
  if (v <= b) return lin(v, a, b, 25, 50)
  if (v <= c) return lin(v, b, c, 50, 75)
  return lin(v, c, c * 1.6, 76, 96)
}
