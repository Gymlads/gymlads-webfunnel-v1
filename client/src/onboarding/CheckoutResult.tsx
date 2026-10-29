import { FormEvent, useEffect, useState } from 'react'
import { confirmDemoCheckout, fetchCheckoutRedeem, koopUpsell } from '../api'
import type { OnboardingData } from '../types'
import { toStripeMetadata } from '../types'
import { pushGtmEvent } from '../analytics/gtm'
import { setTracklutionContactInfo, trackTracklutionSubscribe } from '../analytics/tracklution'
import { meetStap } from '../analytics/meten'
import OnboardingLayout from './components/OnboardingLayout'
import NextButton from './components/NextButton'
import GymladsLogo from './components/GymladsLogo'
import StoreDownloadButtons from './components/StoreDownloadButtons'
import { leesAntwoorden, wisAntwoorden } from './bewaren'
import { UPSELL } from './paywallInhoud'
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

type UpsellStand = 'verborgen' | 'aanbod' | 'bezig' | 'gekocht' | 'fout'

/** Upsell met één klik, direct onder de titel (alleen als Stripe hem klaar heeft staan). */
function UpsellKaart({ sessionId, stand, setStand }: { sessionId: string; stand: UpsellStand; setStand: (s: UpsellStand) => void }) {
  const [directStart, setDirectStart] = useState(false)
  if (stand === 'verborgen') return null
  if (stand === 'gekocht') return <p className="checkout-upsell__gelukt">{UPSELL.gelukt}</p>

  async function koop() {
    setStand('bezig')
    pushGtmEvent('upsell_klik', { page_path: '/checkout/success' })
    try {
      await koopUpsell(sessionId, directStart)
      setStand('gekocht')
      pushGtmEvent('upsell_gekocht', { page_path: '/checkout/success' })
    } catch {
      setStand('fout')
    }
  }

  return (
    <div className="checkout-upsell">
      <span className="checkout-upsell__label">{UPSELL.label}</span>
      <p className="checkout-upsell__titel">{UPSELL.titel}</p>
      <p className="checkout-upsell__tekst">{UPSELL.tekst}</p>
      <p className="checkout-upsell__prijs">{UPSELL.prijs}</p>
      <label className="checkout-upsell__vinkje">
        <input type="checkbox" checked={directStart} onChange={(e) => setDirectStart(e.target.checked)} />
        <span>{UPSELL.directStart}</span>
      </label>
      <button
        type="button"
        className="onboarding__btn checkout-upsell__knop"
        disabled={stand === 'bezig' || !directStart}
        onClick={koop}
      >
        {stand === 'bezig' ? 'Even geduld…' : UPSELL.knop}
      </button>
      {stand === 'fout' && (
        <p className="checkout-upsell__fout">Dat lukte niet. Er is niets extra afgeschreven.</p>
      )}
      <p className="checkout-upsell__klein">{UPSELL.kleineTekst}</p>
      <button type="button" className="checkout-upsell__nee" onClick={() => setStand('verborgen')}>
        {UPSELL.nee}
      </button>
    </div>
  )
}

export function CheckoutSuccess() {
  const [email, setEmail] = useState<string | null>(null)
  const [sessionId] = useState(() => new URLSearchParams(window.location.search).get('session_id'))
  const [upsell, setUpsell] = useState<UpsellStand>('verborgen')
  // plan staat in de terug-URL van Stripe (functions/api: success_url)
  const [maand] = useState(() => new URLSearchParams(window.location.search).get('plan') === 'maand')

  useEffect(() => {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
    wisAntwoorden()

    const sessionId = new URLSearchParams(window.location.search).get('session_id')
    meetStap('betaald', undefined, undefined, { alleenBestaand: true })
    pushGtmEvent('checkout_success', {
      page_path: '/checkout/success',
      stripe_session_id: sessionId ?? undefined,
      plan: maand ? 'month' : 'year',
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
          // Na ContactInfo, zodat Tracklution de aankoop aan dit bezoek koppelt
          if (maand && !result.demo) trackTracklutionSubscribe(sessionId)
          if (result.upsell && !result.demo) setUpsell('aanbod')
        })
        .catch(() => {})
    }
  }, [])

  return (
    <OnboardingLayout centered checkoutSuccess>
      <div className="checkout-success">
        <GymladsLogo className="checkout-success__logo" />
        <h1 className="checkout-success__title">
          {maand ? 'Je abonnement is gestart!' : 'Je proefweek is gestart!'}
        </h1>
        <p className="checkout-success__subtitle">
          Je coach zet je persoonlijke schema voor je klaar. Nog 3 stappen en je doet vandaag je
          eerste workout.
        </p>

        {sessionId && <UpsellKaart sessionId={sessionId} stand={upsell} setStand={setUpsell} />}

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
                Dan staan je antwoorden en {maand ? 'je abonnement' : 'je proefweek'} meteen klaar.
              </p>
            </div>
          </li>
          <li className="checkout-success__step">
            <span className="checkout-success__step-nr">3</span>
            <div className="checkout-success__step-body">
              <p className="checkout-success__step-title">Kies je eerste workout-dag</p>
              <p className="checkout-success__step-text">
                Je antwoorden van hier staan al in de app. Je kiest alleen nog wanneer je je eerste
                workout doet, daarna zet je coach je schema klaar. Doe hem vandaag of morgen, dan
                haal je {maand ? 'er meteen het meeste uit.' : 'het meeste uit je proefweek.'}
              </p>
            </div>
          </li>
        </ol>
      </div>
    </OnboardingLayout>
  )
}

export function CheckoutCancelled() {
  // Antwoorden nog op dit toestel? Dan brengt "Probeer opnieuw" je terug naar
  // je plan (paywall), anders begin je opnieuw bij de eerste vraag.
  const [heeftAntwoorden] = useState(() => leesAntwoorden() !== null)

  useEffect(() => {
    pushGtmEvent('checkout_cancelled', { page_path: '/checkout/cancelled', heeft_antwoorden: heeftAntwoorden })
  }, [heeftAntwoorden])

  return (
    <OnboardingLayout
      centered
      footer={
        <NextButton
          label="Probeer opnieuw"
          onClick={() => (window.location.href = heeftAntwoorden ? '/?terug=paywall' : '/')}
        />
      }
    >
      <h1 className="onboarding__title">Geen zorgen, er is niets betaald</h1>
      <p className="onboarding__body-text">
        Je hebt de betaalpagina gesloten voordat je proef startte.{' '}
        {heeftAntwoorden
          ? 'Je plan staat nog voor je klaar. Tik op "Probeer opnieuw" om verder te gaan waar je was.'
          : 'Tik op "Probeer opnieuw" om je plan opnieuw te maken. Het duurt maar een paar minuten.'}
      </p>
      <p className="onboarding__body-text checkout-cancelled__help">
        Lukt het betalen niet? Mail ons op <a href="mailto:info@gymlads.nl">info@gymlads.nl</a>, dan
        helpen we je.
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
