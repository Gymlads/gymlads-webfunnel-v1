import type { StepId } from '../onboarding/useOnboardingSteps'
import { browserSoort } from './browser'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function pushGtmEvent(event: string, data?: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}

function getStepType(stepId: StepId): 'question' | 'info' | 'conversion' {
  if (stepId === 'plan-ready' || stepId === 'email' || stepId === 'paywall') return 'conversion'
  if (stepId.startsWith('info-')) return 'info'
  return 'question'
}

export function trackOnboardingStepView(
  stepId: StepId,
  stepIndex: number,
  stepTotal: number,
  progress: { current: number; total: number },
) {
  pushGtmEvent('onboarding_step_view', {
    step_id: stepId,
    step_type: getStepType(stepId),
    step_index: stepIndex >= 0 ? stepIndex + 1 : undefined,
    step_total: stepTotal,
    progress_current: progress.current > 0 ? progress.current : undefined,
    progress_total: progress.total,
    browser: browserSoort(),
  })
}

/** E-mailadres ingevuld (het adres zelf gaat niet naar GTM). */
export function trackEmailSubmitted(herinneringen: boolean) {
  pushGtmEvent('email_submitted', { herinneringen, browser: browserSoort() })
}

/** Betaalknop op de paywall: 'boven' (blok 2) of 'onder' (blok 5). */
export function trackPaywallCta(positie: 'boven' | 'onder') {
  pushGtmEvent('paywall_cta_click', { cta_position: positie, browser: browserSoort() })
}

/** Hoe lang "Even geduld…" duurde: van tik tot doorsturen naar Stripe (of fout). */
export function trackCheckoutWacht(positie: 'boven' | 'onder', wachtMs: number, gelukt: boolean) {
  pushGtmEvent('checkout_redirect', {
    cta_position: positie,
    wacht_ms: Math.round(wachtMs),
    gelukt,
    browser: browserSoort(),
  })
}
