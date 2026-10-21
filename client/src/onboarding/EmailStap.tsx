import { FormEvent, useState } from 'react'
import { PRIVACY_URL } from './paywallInhoud'

// Stap tussen "plan-ready" en de paywall: e-mailadres vragen (v3, 21-10-2026).
// Het adres gaat mee naar Stripe (vooraf ingevuld) en wordt als lead bewaard.

const GELDIG_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isGeldigEmail(waarde: string) {
  return GELDIG_EMAIL.test(waarde.trim())
}

interface EmailStapProps {
  email: string
  herinneringen: boolean
  onVerder: (email: string, herinneringen: boolean) => void
}

export default function EmailStap({ email: startEmail, herinneringen: startVinkje, onVerder }: EmailStapProps) {
  const [email, setEmail] = useState(startEmail)
  const [vinkje, setVinkje] = useState(startVinkje)
  const [fout, setFout] = useState('')

  function verstuur(event: FormEvent) {
    event.preventDefault()
    const schoon = email.trim().toLowerCase()
    if (!isGeldigEmail(schoon)) {
      setFout('Vul een geldig e-mailadres in, bijvoorbeeld naam@gmail.com.')
      return
    }
    setFout('')
    onVerder(schoon, vinkje)
  }

  return (
    <form className="email-stap" onSubmit={verstuur} noValidate>
      <div className="email-stap__body">
        <h1 className="onboarding__title">Waar mogen we je plan naartoe sturen?</h1>
        <p className="onboarding__subtitle">
          Je persoonlijke schema staat klaar. We sturen het naar je e-mail, zodat je het niet
          kwijtraakt.
        </p>

        <label className="email-stap__label" htmlFor="email-stap-input">
          E-mailadres
        </label>
        <input
          id="email-stap-input"
          className={`onboarding__text-input email-stap__input${fout ? ' email-stap__input--fout' : ''}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="jij@voorbeeld.nl"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (fout) setFout('')
          }}
          aria-invalid={fout ? true : undefined}
          aria-describedby={fout ? 'email-stap-fout' : undefined}
        />
        {fout && (
          <p id="email-stap-fout" className="email-stap__fout" role="alert">
            {fout}
          </p>
        )}

        <label className="email-stap__check">
          <input type="checkbox" checked={vinkje} onChange={(e) => setVinkje(e.target.checked)} />
          <span className="email-stap__box" aria-hidden="true" />
          <span>Stuur me tips en een herinnering over mijn plan.</span>
        </label>
      </div>

      <div className="email-stap__footer">
        <button type="submit" className="onboarding__btn email-stap__btn">
          NAAR MIJN PLAN
        </button>
        <p className="email-stap__privacy">
          We delen je e-mail nooit met anderen.{' '}
          <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
            Privacybeleid
          </a>
        </p>
      </div>
    </form>
  )
}
