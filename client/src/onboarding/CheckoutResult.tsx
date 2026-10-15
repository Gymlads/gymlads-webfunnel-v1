import { FormEvent, useEffect, useState } from 'react'
import { confirmDemoCheckout, fetchCheckoutRedeem } from '../api'
import type { OnboardingData } from '../types'
import { toStripeMetadata } from '../types'
import { pushGtmEvent } from '../analytics/gtm'
import { setTracklutionContactInfo } from '../analytics/tracklution'
import OnboardingLayout from './components/OnboardingLayout'
import NextButton from './components/NextButton'
import GymladsLogo from './components/GymladsLogo'
import StoreDownloadButtons from './components/StoreDownloadButtons'
import './onboarding.css'

const PENDING_CHECKOUT_KEY = 'onboarding_checkout'

interface PendingCheckout {
  metadata: Record<string, string>
  data?: OnboardingData
}

function readPendingCheckout(): PendingCheckout | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PendingCheckout
  } catch {
    return null
  }
}

export function CheckoutSuccess() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)

    const sessionId = new URLSearchParams(window.location.search).get('session_id')
    pushGtmEvent('checkout_success', {
      page_path: '/checkout/success',
      stripe_session_id: sessionId ?? undefined,
    })

    // E-mailadres uit de Stripe-sessie: tonen in stap 2 en doorgeven aan
    // Tracklution (ContactInfo)
    if (sessionId) {
      fetchCheckoutRedeem(sessionId)
        .then((result) => {
          if (result.email) {
            setEmail(result.email)
            setTracklutionContactInfo(result.email)
          }
        })
        .catch(() => {})
    }
  }, [])

  return (
    <OnboardingLayout centered checkoutSuccess>
      <div className="checkout-success">
        <GymladsLogo className="checkout-success__logo" />
        <h1 className="checkout-success__title">Je proefweek is gestart!</h1>
        <p className="checkout-success__subtitle">
          Je coach zet je persoonlijke schema voor je klaar. Nog 3 stappen en je doet vandaag je
          eerste workout.
        </p>

        <ol className="checkout-success__steps">
          <li className="checkout-success__step">
            <span className="checkout-success__step-nr">1</span>
            <div className="checkout-success__step-body">
              <p className="checkout-success__step-title">Download de Gymlads-app</p>
              <StoreDownloadButtons />
            </div>
          </li>
          <li className="checkout-success__step">
            <span className="checkout-success__step-nr">2</span>
            <div className="checkout-success__step-body">
              <p className="checkout-success__step-title">Tik op "Nieuw account aanmaken"</p>
              <p className="checkout-success__step-text">
                Gebruik hetzelfde e-mailadres als bij je aanmelding
                {email ? (
                  <>
                    : <strong className="checkout-success__email">{email}</strong>
                  </>
                ) : (
                  '.'
                )}{' '}
                Dan staan je antwoorden en je proefweek meteen klaar.
              </p>
            </div>
          </li>
          <li className="checkout-success__step">
            <span className="checkout-success__step-nr">3</span>
            <div className="checkout-success__step-body">
              <p className="checkout-success__step-title">Start je eerste workout</p>
              <p className="checkout-success__step-text">
                Je schema staat op het startscherm. Doe je eerste workout vandaag of morgen, dan
                haal je het meeste uit je proefweek.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </OnboardingLayout>
  )
}

export function CheckoutCancelled() {
  return (
    <OnboardingLayout
      centered
      footer={
        <NextButton label="Terug naar onboarding" onClick={() => (window.location.href = '/')} />
      }
    >
      <h1 className="onboarding__title">Betaling geannuleerd</h1>
      <p className="onboarding__body-text">
        Je bent teruggekeerd zonder te betalen. Je kunt opnieuw beginnen wanneer je wilt.
      </p>
    </OnboardingLayout>
  )
}

export function DemoCheckout() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<PendingCheckout | null>(null)

  useEffect(() => {
    const stored = readPendingCheckout()
    if (!stored) {
      window.location.href = '/'
      return
    }
    setPending(stored)
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!pending) return

    setError('')
    setLoading(true)

    try {
      const result = await confirmDemoCheckout(email, pending.metadata)
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
      window.location.href = `/checkout/success?session_id=demo-${result.submissionId}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout mislukt')
      setLoading(false)
    }
  }

  if (!pending) return null

  return (
    <OnboardingLayout>
      <h1 className="onboarding__title">Demo checkout</h1>
      <p className="onboarding__subtitle">
        Stripe is niet geconfigureerd. Voer je e-mail in om de n8n-workflow lokaal te testen.
      </p>
      <form className="onboarding__checkout-form" onSubmit={handleSubmit}>
        <label className="onboarding__field-label" htmlFor="demo-email">
          E-mailadres
        </label>
        <input
          id="demo-email"
          className="onboarding__text-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="jij@voorbeeld.nl"
          required
          autoComplete="email"
        />
        {error && <div className="onboarding__error">{error}</div>}
        <button type="submit" className="onboarding__btn" disabled={loading}>
          {loading ? 'Laden...' : 'Activeer abonnement (demo)'}
        </button>
      </form>
    </OnboardingLayout>
  )
}

export function storePendingCheckout(data: OnboardingData, submissionId: string) {
  sessionStorage.setItem(
    PENDING_CHECKOUT_KEY,
    JSON.stringify({
      metadata: {
        ...toStripeMetadata(data),
        submissionId,
        submittedAt: new Date().toISOString(),
        subscribed_int: '0',
      },
    }),
  )
}
