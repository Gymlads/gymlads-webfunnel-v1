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
  | 'training-days'
  | 'gym-days'
  | 'home-days'
  | 'activity'
  | 'equipment'
  | 'info-feedback'
  | 'plan-ready'
  | 'email'
  | 'paywall'

// Doel eerst (sluit aan op de advertentie), dan geslacht en leeftijd.
// Lengte en gewicht vragen we niet meer in de webfunnel (v3, 21-10-2026).
const BASE_STEPS: StepId[] = [
  'goal',
  'gender',
  'age',
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
  'training-days',
]

const TAIL_STEPS: StepId[] = [
  'activity',
  'info-schedule',
  'info-feedback',
  'plan-ready',
  'email',
  'paywall',
]

function getConditionalSteps(data: OnboardingData): StepId[] {
  const steps: StepId[] = []

  if (data.locatie_training === 'Sportschool' || data.locatie_training === 'Beide') {
    steps.push('gym-days')
  }

  if (data.locatie_training === 'Thuis' || data.locatie_training === 'Beide') {
    steps.push('home-days')
  }

  if (data.locatie_training === 'Thuis' || data.locatie_training === 'Beide') {
    steps.push('equipment')
  }

  return steps
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
  const steps = useMemo(() => buildStepList(data), [data.locatie_training])

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

export function autoAssignLocationDays(
  data: OnboardingData,
  phase: 'after-training-days' | 'after-gym-days',
): OnboardingData {
  const next = { ...data }

  if (phase === 'after-training-days') {
    if (data.locatie_training === 'Sportschool') {
      for (const day of ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'] as const) {
        const trainKey = `train_${day}` as keyof OnboardingData
        const gymKey = `${day}_sportschool_trainen` as keyof OnboardingData
        ;(next[gymKey] as boolean) = Boolean(next[trainKey])
      }
    }
    if (data.locatie_training === 'Thuis') {
      for (const day of ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'] as const) {
        const trainKey = `train_${day}` as keyof OnboardingData
        const homeKey = `${day}_thuis_trainen` as keyof OnboardingData
        ;(next[homeKey] as boolean) = Boolean(next[trainKey])
      }
    }
  }

  return next
}
