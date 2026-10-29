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
  | 'plan-ready'
  | 'email'
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

const TAIL_STEPS: StepId[] = [
  'info-schedule',
  'info-feedback',
  'email',
  'plan-ready',
  'paywall',
]

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

export function buildStepList(data: OnboardingData): StepId[] {
  return [...BASE_STEPS, ...getConditionalSteps(data), ...TAIL_STEPS]
}

export function shouldShowProgress(stepId: StepId): boolean {
  if (stepId === 'plan-ready' || stepId === 'email' || stepId === 'paywall') {
    return false
  }

  return !stepId.startsWith('info-')
}

export function useOnboardingSteps(data: OnboardingData, currentStepId: StepId) {
  const steps = useMemo(() => buildStepList(data), [data.locatie_training, data.soort_sportschool])

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
