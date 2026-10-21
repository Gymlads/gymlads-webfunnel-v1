import type { OnboardingData } from './types'
import { toStripeMetadata } from './types'
import { meetKoppeling } from './analytics/meten'

export interface CheckoutResponse {
  url?: string
  demo?: boolean
  submissionId?: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) {
    throw new Error(
      response.ok
        ? 'Server returned an empty response. Is the API running on port 3001?'
        : `Request failed (${response.status}). The server returned an empty response.`,
    )
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Server returned an invalid response. Please try again.')
  }
}

export async function createCheckoutSession(
  data: OnboardingData,
  email?: string,
): Promise<CheckoutResponse> {
  const body = JSON.stringify({
    metadata: toStripeMetadata(data),
    // Alleen voor customer_email in Stripe (vooraf ingevuld), niet in de metadata
    email: email || undefined,
    clientOrigin: window.location.origin,
    meting: meetKoppeling(),
  })
  const maxAttempts = 2

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    const text = await response.text()

    if (!text && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      continue
    }

    if (!text) {
      throw new Error(
        response.ok
          ? 'Server returned an empty response. Is the API running on port 3001?'
          : `Request failed (${response.status}). The server returned an empty response.`,
      )
    }

    let result: CheckoutResponse & { error?: string }
    try {
      result = JSON.parse(text) as CheckoutResponse & { error?: string }
    } catch {
      throw new Error('Server returned an invalid response. Please try again.')
    }

    if (!response.ok) {
      throw new Error(result.error ?? `Checkout failed (${response.status})`)
    }

    return result
  }

  throw new Error('Checkout failed. Please try again.')
}

export interface CheckoutRedeemResponse {
  redeemUrl: string
  qrDataUrl: string
  email: string | null
  demo: boolean
}

export async function fetchCheckoutRedeem(
  sessionId: string | null,
): Promise<CheckoutRedeemResponse> {
  const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
  const response = await fetch(`/api/checkout-redeem${query}`)
  const result = await parseJsonResponse<CheckoutRedeemResponse & { error?: string }>(response)

  if (!response.ok) {
    throw new Error(result.error ?? `Redeem lookup failed (${response.status})`)
  }

  return result
}

export async function confirmDemoCheckout(
  email: string,
  metadata: Record<string, string>,
): Promise<{ success: boolean; submissionId: string }> {
  const response = await fetch('/api/confirm-demo-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, metadata }),
  })

  const result = await parseJsonResponse<{
    success?: boolean
    submissionId?: string
    error?: string
  }>(response)

  if (!response.ok) {
    throw new Error(result.error ?? `Demo checkout failed (${response.status})`)
  }

  return { success: true, submissionId: result.submissionId ?? '' }
}

/**
 * E-mailadres + antwoorden bewaren als lead (ook als iemand daarna geen proef
 * start). Fire-and-forget: een fout merkt de bezoeker niet.
 */
export function saveLead(data: OnboardingData, email: string, herinneringen: boolean) {
  try {
    void fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        herinneringen,
        antwoorden: toStripeMetadata(data),
        meting: meetKoppeling(),
      }),
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // stil
  }
}
