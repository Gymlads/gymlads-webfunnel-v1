import { useMemo } from 'react'
import type { OnboardingData } from '../types'

export type StepId =
  | 'goal'
  | 'gender'
  | 'age'
  | 'info-personalization'
  | 'info-consistency'
  | 'challenge'
  | 'experience'
  | 'doel-kiezen'
  | 'doel-oefening'
  | 'doel-getal'
  | 'info-experience'
  | 'info-goals'
  | 'info-schedule'
  | 'frequency'
  | 'duration'
  | 'muscle-focus'
  | 'location'
  | 'gym-equipment'
  | 'gym-days'
  | 'home-days'
  | 'equipment'
  | 'info-feedback'
  | 'laadscherm'
  | 'plan-ready'
  | 'email'
  | 'doelscherm'
  | 'paywall'

// Geslacht, leeftijd, dan doel (Roel 21-10-2026: volgorde niet omdraaien).
// Lengte en gewicht vragen we niet meer in de webfunnel (v3). Vanaf 27-10
// dezelfde vragen als de app (2.2.6): geen algemene trainingsdagen en geen
// dagelijkse activiteit meer; dagen per locatie, kleine sportschool met toestellen.
const BASE_STEPS: StepId[] = [
  'gender',
  'age',
  'goal',
  'info-personalization',
  'info-consistency',
  'challenge',
  'experience',
  'info-experience',
  'info-goals',
  'frequency',
  'duration',
  'muscle-focus',
  'location',
]

// E-mailstap (sinds 21-10) staat uit sinds 20-11-2026 (Roel): 20% haakte daar
// af. Stripe vraagt het e-mailadres nu zelf, net als in oktober. Weer aanzetten:
// EMAILSTAP_AAN op true. Op die plek staat nu het scherm "Zo haal jij je doel".
export const EMAILSTAP_AAN = false

// Laadscherm "We maken jouw plan" vóór "Jouw persoonlijk plan staat klaar"
// (briefing activatie na betaling, hoofdstuk 6). Gaat live als losse test na
// de gratis proef: dan WEB_LAADSCHERM_AAN op true. Tot die tijd alleen te zien
// met ?laadscherm=1 in de link (voor de testlink), dat geldt dan voor dit tabblad.
export const WEB_LAADSCHERM_AAN = false

const LAADSCHERM_KEY = 'gl_laadscherm'

export function laadschermAan(): boolean {
  if (WEB_LAADSCHERM_AAN) return true
  try {
    if (new URLSearchParams(window.location.search).get('laadscherm') === '1') {
      sessionStorage.setItem(LAADSCHERM_KEY, '1')
      return true
    }
    return sessionStorage.getItem(LAADSCHERM_KEY) === '1'
  } catch {
    return false
  }
}

function tailSteps(): StepId[] {
  return [
    'info-schedule',
    'info-feedback',
    ...(EMAILSTAP_AAN ? (['email'] as StepId[]) : (['doelscherm'] as StepId[])),
    ...(laadschermAan() ? (['laadscherm'] as StepId[]) : []),
    'plan-ready',
    'paywall',
  ]
}

// Zelfde vertakking als de app (locatie.tsx): grote sportschool -> dagen;
// kleine -> toestellen, dagen; thuis -> dagen, apparatuur; beide -> thuisdagen,
// sportschooldagen, apparatuur.
function getConditionalSteps(data: OnboardingData): StepId[] {
  switch (data.locatie_training) {
    case 'Sportschool':
      return data.soort_sportschool === 'klein' ? ['gym-equipment', 'gym-days'] : ['gym-days']
    case 'Thuis':
      return ['home-days', 'equipment']
    case 'Beide':
      return ['home-days', 'gym-days', 'equipment']
    default:
      return []
  }
}

// Doel meteen na het hoofddoel, zonder dubbele vraag (Roel, 12 nov): het
// hoofddoel bepaalt het soort doel, we vragen alleen nog het getal.
export const DOEL_STAPPEN: StepId[] = ['doel-kiezen', 'doel-oefening', 'doel-getal']

function getDoelSteps(data: OnboardingData): StepId[] {
  switch (data.doel) {
    case 'Afvallen':
      return ['doel-getal']
    // Spieropbouw / Beter figuur: geen getal-scherm meer (Roel, 24-11).
    case 'Kracht opbouwen':
      return ['doel-oefening', 'doel-getal']
    default:
      return []
  }
}

export function buildStepList(data: OnboardingData): StepId[] {
  const i = BASE_STEPS.indexOf('goal') + 1
  return [
    ...BASE_STEPS.slice(0, i),
    ...getDoelSteps(data),
    ...BASE_STEPS.slice(i),
    ...getConditionalSteps(data),
    ...tailSteps(),
  ]
}

export function shouldShowProgress(stepId: StepId): boolean {
  if (stepId === 'plan-ready' || stepId === 'email' || stepId === 'paywall' || stepId === 'laadscherm') {
    return false
  }

  return !stepId.startsWith('info-')
}

export function useOnboardingSteps(data: OnboardingData, currentStepId: StepId) {
  const steps = useMemo(
    () => buildStepList(data),
    [data.locatie_training, data.soort_sportschool, data.doel, data.geslacht],
  )

  const currentIndex = steps.indexOf(currentStepId)
  const progressSteps = steps.filter(
    (s) => !s.startsWith('info-') && s !== 'plan-ready' && s !== 'email' && s !== 'paywall',
  )
  const progressIndex = progressSteps.indexOf(currentStepId)

  return {
    steps,
    currentIndex,
    progress: {
      current: progressIndex >= 0 ? progressIndex + 1 : 0,
      total: progressSteps.length,
    },
    goNext: (stepId: StepId) => {
      const idx = steps.indexOf(stepId)
      return idx < steps.length - 1 ? steps[idx + 1] : stepId
    },
    goBack: (stepId: StepId) => {
      const idx = steps.indexOf(stepId)
      return idx > 0 ? steps[idx - 1] : stepId
    },
  }
}
