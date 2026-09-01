import { useCallback, useEffect, useRef, useState } from 'react'
import { createCheckoutSession } from '../api'
import { storePendingCheckout } from './CheckoutResult'
import {
  HOME_EQUIPMENT,
  WEEKDAYS,
  initialOnboardingData,
  type BooleanFieldKey,
  type DagelijkseActiviteit,
  type Doel,
  type ErvaringKrachttraining,
  type Geslacht,
  type GewensteTrainingsduur,
  type GrootsteUitdaging,
  type LocatieTraining,
  type OnboardingData,
  type SpiergroepFocus,
} from '../types'
import OnboardingLayout from './components/OnboardingLayout'
import NextButton from './components/NextButton'
import OptionButton from './components/OptionButton'
import StatRangeField from './components/StatRangeField'
import GoalsComparisonChart from './components/GoalsComparisonChart'
import { trackOnboardingStepView } from '../analytics/gtm'
import { SUBSCRIPTION_VALUE, trackTracklution } from '../analytics/tracklution'
import {
  autoAssignLocationDays,
  buildStepList,
  type StepId,
  shouldShowProgress,
  useOnboardingSteps,
} from './useOnboardingSteps'
import './onboarding.css'
import personalizationImage from './assets/02-personalization.png'
import consistencyImage from './assets/03-consistency.png'
import experienceImage from './assets/04-experience.png'
import scheduleImage from './assets/06-schedule.png'
import planReadyImage from './assets/07-plan-ready.png'

const DEFAULT_PAGE_BG = '#000000'

/** Matched to each screen image’s sampled edge/background pixels */
const STEP_PAGE_BG: Partial<Record<StepId, string>> = {}

export default function OnboardingWizard() {
  const [stepId, setStepId] = useState<StepId>('gender')
  const [data, setData] = useState<OnboardingData>(initialOnboardingData)
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [pressedOption, setPressedOption] = useState<string | null>(null)

  const { progress, steps, currentIndex } = useOnboardingSteps(data, stepId)

  // Tracklution AddToCart: one per funnel run, when the visitor reaches the
  // offer. Meta only saw PageView and Purchase before; this adds the missing
  // middle-funnel signal.
  const addToCartFired = useRef(false)

  useEffect(() => {
    trackOnboardingStepView(stepId, currentIndex, steps.length, progress)
    if (stepId === 'paywall' && !addToCartFired.current) {
      addToCartFired.current = true
      trackTracklution('AddToCart', SUBSCRIPTION_VALUE)
    }
  }, [stepId])

  useEffect(() => {
    setPressedOption(null)
  }, [stepId])

  useEffect(() => {
    const pageBg = STEP_PAGE_BG[stepId] ?? DEFAULT_PAGE_BG
    document.documentElement.style.setProperty('--page-bg', pageBg)
  }, [stepId])

  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty('--page-bg', DEFAULT_PAGE_BG)
    }
  }, [])

  const isOptionSelected = (
    option: string | number,
    value: string | number | null | undefined,
  ) => value === option || pressedOption === String(option)

  const navigateNext = useCallback(
    (updates?: Partial<OnboardingData>) => {
      setData((prev) => {
        const merged = updates ? { ...prev, ...updates } : prev
        let nextData = merged

        if (stepId === 'training-days') {
          nextData = autoAssignLocationDays(merged, 'after-training-days')
        }

        const steps = buildStepList(nextData)
        const idx = steps.indexOf(stepId)
        const nextStep = idx < steps.length - 1 ? steps[idx + 1] : stepId
        setStepId(nextStep)
        return nextData
      })
    },
    [stepId],
  )

  const navigateBack = useCallback(() => {
    const steps = buildStepList(data)
    const idx = steps.indexOf(stepId)
    if (idx > 0) setStepId(steps[idx - 1])
  }, [stepId, data])

  const selectSingle = useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setPressedOption(String(value))
      setData((prev) => ({ ...prev, [key]: value }))
      setTimeout(() => {
        setPressedOption(null)
        navigateNext({ [key]: value } as Partial<OnboardingData>)
      }, 300)
    },
    [navigateNext],
  )

  const toggleMulti = useCallback((key: BooleanFieldKey) => {
    setData((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const hasSelectedTrainingDay = WEEKDAYS.some((d) => data[d.train])
  const hasSelectedGymDay = WEEKDAYS.some((d) => data[d.gym])
  const hasSelectedHomeDay = WEEKDAYS.some((d) => data[d.home])
  const hasNoHomeEquipment = HOME_EQUIPMENT.every((item) => !data[item.key])

  async function handleCheckout() {
    setCheckoutError('')
    setCheckoutLoading(true)
    // Before the session request: the click itself is the checkout intent,
    // and after the redirect to Stripe this page is gone.
    trackTracklution('InitiateCheckout', SUBSCRIPTION_VALUE)
    try {
      const result = await createCheckoutSession(data)

      if (result.demo) {
        storePendingCheckout(data, result.submissionId ?? crypto.randomUUID())
        window.location.href = '/checkout/demo'
        return
      }

      if (!result.url) {
        throw new Error('Geen checkout-URL ontvangen')
      }

      window.location.href = result.url
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout mislukt')
      setCheckoutLoading(false)
    }
  }

  const showProgress = shouldShowProgress(stepId)

  const layoutProps = {
    progress: showProgress ? progress : undefined,
    showBack: stepId !== 'gender' && stepId !== 'paywall',
    onBack: navigateBack,
  }

  switch (stepId) {
    case 'gender':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Wat is jouw geslacht?</h1>
          <div className="onboarding__options">
            {(['Man', 'Vrouw', 'Zeg ik liever niet'] as Geslacht[]).map((option) => (
              <OptionButton
                key={option}
                selected={isOptionSelected(option, data.geslacht)}
                onClick={() => selectSingle('geslacht', option)}
              >
                {option}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'stats': {
      const leeftijd = data.leeftijd ?? 25
      const lengte = data.lengte ? Number(data.lengte) : 175
      const gewicht = data.gewicht ? Number(data.gewicht) : 75

      return (
        <OnboardingLayout
          {...layoutProps}
          footer={
            <NextButton
              onClick={() =>
                navigateNext({
                  leeftijd,
                  lengte: String(lengte),
                  gewicht: String(gewicht),
                })
              }
            />
          }
        >
          <h1 className="onboarding__title">Vertel ons over jezelf</h1>
          <p className="onboarding__subtitle">Dit helpt ons jouw plan te personaliseren</p>
          <div className="onboarding__stats-fields">
            <StatRangeField
              id="leeftijd"
              label="Leeftijd"
              min={10}
              max={100}
              value={leeftijd}
              onChange={(value) => setData((prev) => ({ ...prev, leeftijd: value }))}
            />
            <StatRangeField
              id="lengte"
              label="Lengte"
              min={100}
              max={250}
              unit="cm"
              value={lengte}
              onChange={(value) =>
                setData((prev) => ({ ...prev, lengte: String(value) }))
              }
            />
            <StatRangeField
              id="gewicht"
              label="Gewicht"
              min={30}
              max={300}
              unit="kg"
              value={gewicht}
              onChange={(value) =>
                setData((prev) => ({ ...prev, gewicht: String(value) }))
              }
            />
          </div>
        </OnboardingLayout>
      )
    }

    case 'goal':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Wat is jouw hoofddoel?</h1>
          <div className="onboarding__options">
            {(
              [
                'Afvallen',
                'Spieropbouw',
                'Kracht opbouwen',
                'Onderhouden',
                'Fit voelen',
              ] as Doel[]
            ).map((option) => (
              <OptionButton
                key={option}
                selected={isOptionSelected(option, data.doel)}
                onClick={() => selectSingle('doel', option)}
              >
                {option}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'info-personalization':
      return (
        <OnboardingLayout
          {...layoutProps}
          centered
          footer={<NextButton onClick={() => navigateNext()} />}
        >
          <h1 className="onboarding__title">
            Op basis van jouw gegevens stemmen we je schema af op jouw lichaam en doelen.
          </h1>
          <img
            className="onboarding__info-stock-image"
            src={personalizationImage}
            alt="Persoonlijk trainingsplan"
          />
        </OnboardingLayout>
      )

    case 'info-consistency':
      return (
        <OnboardingLayout
          {...layoutProps}
          centered
          footer={<NextButton onClick={() => navigateNext()} />}
        >
          <h1 className="onboarding__title">Meer consistentie</h1>
          <p className="onboarding__body-text">
            Een persoonlijk schema zorgt voor tot 40% meer consistentie dan een generiek plan.
          </p>
          <img
            className="onboarding__info-stock-image"
            src={consistencyImage}
            alt="Voortgang en consistentie"
          />
        </OnboardingLayout>
      )

    case 'challenge':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Wat is jouw grootste uitdaging?</h1>
          <div className="onboarding__options">
            {(
              [
                'Consistentie',
                'Motivatie',
                'Niet weten wat te doen',
                'Geen resultaat',
                'Weinig tijd',
              ] as GrootsteUitdaging[]
            ).map((option) => (
              <OptionButton
                key={option}
                selected={isOptionSelected(option, data.grootste_uitdaging)}
                onClick={() => selectSingle('grootste_uitdaging', option)}
              >
                {option}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'experience':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Hoeveel ervaring heb je met krachttraining?</h1>
          <div className="onboarding__options">
            {(
              [
                'Ik begin net',
                'Ik train soms (niet consistent)',
                '6-12 maanden consistent',
                '1+ jaar consistent',
              ] as ErvaringKrachttraining[]
            ).map((option) => (
              <OptionButton
                key={option}
                selected={isOptionSelected(option, data.ervaring_krachttraining)}
                onClick={() => selectSingle('ervaring_krachttraining', option)}
              >
                {option}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'info-experience':
      return (
        <OnboardingLayout
          {...layoutProps}
          centered
          footer={<NextButton onClick={() => navigateNext()} />}
        >
          <h1 className="onboarding__title">
            Op basis van jouw ervaring passen we de intensiteit en oefenkeuze aan — zo train je
            slim, niet alleen hard.
          </h1>
          <img
            className="onboarding__info-stock-image"
            src={experienceImage}
            alt="Science-based progress"
          />
        </OnboardingLayout>
      )

    case 'info-goals':
      return (
        <OnboardingLayout
          {...layoutProps}
          showLogo
          centered
          footer={<NextButton onClick={() => navigateNext()} />}
        >
          <h1 className="onboarding__title onboarding__title--goals">
            Mensen die hun doelen vastleggen én voortgang bijhouden behalen dit 76% vaker
          </h1>
          <GoalsComparisonChart />
          <p className="onboarding__subtitle onboarding__goals-subtitle">Behaal jouw doelen.</p>
        </OnboardingLayout>
      )

    case 'frequency':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Hoe vaak kun je per week trainen?</h1>
          <p className="onboarding__subtitle">Kies iets wat je vol kunt houden.</p>
          <div className="onboarding__options">
            {[2, 3, 4, 5, 6].map((days) => (
              <OptionButton
                key={days}
                selected={isOptionSelected(days, data.sessies_per_week)}
                onClick={() => selectSingle('sessies_per_week', days)}
              >
                {days} dagen
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'duration':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Hoe lang mag jouw workout duren?</h1>
          <div className="onboarding__options">
            {(
              [
                '30 minuten',
                '45 minuten',
                '60 minuten',
                '75 minuten',
                '90 minuten',
              ] as GewensteTrainingsduur[]
            ).map((option) => (
              <OptionButton
                key={option}
                selected={isOptionSelected(option, data.gewenste_trainingsduur)}
                onClick={() => selectSingle('gewenste_trainingsduur', option)}
              >
                {option}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'muscle-focus':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Wil je meer focus op één spiergroep?</h1>
          <div className="onboarding__options">
            {(
              [
                'Borst',
                'Rug',
                'Schouder',
                'Biceps',
                'Triceps',
                'Billen/Benen',
                'Ik wil alles gelijk trainen',
              ] as SpiergroepFocus[]
            ).map((option) => (
              <OptionButton
                key={option}
                selected={isOptionSelected(option, data.focus_spiergroepen)}
                onClick={() => selectSingle('focus_spiergroepen', option)}
              >
                {option}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'info-schedule':
      return (
        <OnboardingLayout
          {...layoutProps}
          centered
          footer={<NextButton onClick={() => navigateNext()} />}
        >
          <h1 className="onboarding__title">
            We stemmen jouw trainingsdagen af op jouw schema — zo train je altijd op het moment
            dat het voor jou werkt.
          </h1>
          <img
            className="onboarding__info-stock-image"
            src={scheduleImage}
            alt="Trainingsschema en workoutduur"
          />
        </OnboardingLayout>
      )

    case 'location':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Waar train je meestal?</h1>
          <div className="onboarding__options">
            {(['Sportschool', 'Thuis', 'Beide'] as LocatieTraining[]).map((option) => (
              <OptionButton
                key={option}
                selected={isOptionSelected(option, data.locatie_training)}
                onClick={() => selectSingle('locatie_training', option)}
              >
                {option}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'training-days':
      return (
        <OnboardingLayout
          {...layoutProps}
          footer={
            <NextButton onClick={() => navigateNext()} disabled={!hasSelectedTrainingDay} />
          }
        >
          <h1 className="onboarding__title">Op welke dagen wil je trainen?</h1>
          <div className="onboarding__options">
            {WEEKDAYS.map((day) => (
              <OptionButton
                key={day.train}
                multi
                selected={data[day.train]}
                onClick={() => toggleMulti(day.train)}
              >
                {day.label}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'gym-days':
      return (
        <OnboardingLayout
          {...layoutProps}
          footer={<NextButton onClick={() => navigateNext()} disabled={!hasSelectedGymDay} />}
        >
          <h1 className="onboarding__title">Op welke dagen wil je in de sportschool trainen?</h1>
          <div className="onboarding__options">
            {WEEKDAYS.filter((d) => data[d.train]).map((day) => (
              <OptionButton
                key={day.gym}
                multi
                selected={data[day.gym]}
                onClick={() => toggleMulti(day.gym)}
              >
                {day.label}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'home-days':
      return (
        <OnboardingLayout
          {...layoutProps}
          footer={<NextButton onClick={() => navigateNext()} disabled={!hasSelectedHomeDay} />}
        >
          <h1 className="onboarding__title">Op welke dagen wil je thuis trainen?</h1>
          <div className="onboarding__options">
            {WEEKDAYS.filter((d) => data[d.train]).map((day) => (
              <OptionButton
                key={day.home}
                multi
                selected={data[day.home]}
                onClick={() => toggleMulti(day.home)}
              >
                {day.label}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'activity':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Hoe actief ben je overdag?</h1>
          <div className="onboarding__options">
            {(
              [
                'Meestal zittend',
                'Veel staan',
                'Een combinatie van zitten en staan',
                'Het verschilt elke dag',
              ] as DagelijkseActiviteit[]
            ).map((option) => (
              <OptionButton
                key={option}
                selected={isOptionSelected(option, data.dagelijkse_activiteit)}
                onClick={() => selectSingle('dagelijkse_activiteit', option)}
              >
                {option}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'equipment':
      return (
        <OnboardingLayout
          {...layoutProps}
          footer={<NextButton onClick={() => navigateNext()} />}
        >
          <h1 className="onboarding__title">Welke apparatuur heb je thuis beschikbaar?</h1>
          <div className="onboarding__options onboarding__options--equipment">
            {HOME_EQUIPMENT.map((item) => (
              <OptionButton
                key={item.key}
                multi
                selected={data[item.key]}
                onClick={() => toggleMulti(item.key)}
              >
                {item.label}
              </OptionButton>
            ))}
            <OptionButton
              multi
              selected={hasNoHomeEquipment}
              onClick={() => {
                setData((prev) => {
                  const cleared = { ...prev }
                  for (const item of HOME_EQUIPMENT) {
                    cleared[item.key] = false
                  }
                  return cleared
                })
              }}
            >
              Niet van toepassing
            </OptionButton>
          </div>
        </OnboardingLayout>
      )

    case 'info-feedback':
      return (
        <OnboardingLayout
          {...layoutProps}
          centered
          footer={<NextButton onClick={() => navigateNext()} />}
        >
          <p className="onboarding__stat-big">95%</p>
          <p className="onboarding__feedback-text">
            Van de mensen met regelmatige check-ins en feedbackmomenten
          </p>
          <div className="onboarding__highlight-box">Behaalt uiteindelijk zijn doel</div>
          <p className="onboarding__feedback-text">Zonder is dat maar 35%.</p>
        </OnboardingLayout>
      )

    case 'plan-ready':
      return (
        <OnboardingLayout
          {...layoutProps}
          alignTop
          planReady
          footer={<NextButton label="Bekijk mijn plan" onClick={() => navigateNext()} />}
        >
          <img
            className="onboarding__info-stock-image onboarding__info-stock-image--plan"
            src={planReadyImage}
            alt="Plan klaar"
          />
          <h1 className="onboarding__plan-ready-title">Jouw persoonlijk plan staat klaar</h1>
          <p className="onboarding__plan-ready-body">
            Op basis van jouw doelen, voorkeuren en trainingsdagen hebben we een trainingsplan
            gebouwd dat je helpt de resultaten te behalen die jij wilt — en consistent te blijven.
          </p>
        </OnboardingLayout>
      )

    case 'paywall':
      return (
        <OnboardingLayout
          paywall
          footer={
            <div className="onboarding__legal">
              <a href="#">Aankopen herstellen</a>
              <a href="#">Voorwaarden</a>
              <a href="#">Privacy</a>
            </div>
          }
        >
          <div className="onboarding__paywall-v2">
            <header className="onboarding__paywall-v2-header">
              <h1 className="onboarding__paywall-v2-title">Start vandaag voor €0,-</h1>
              <p className="onboarding__paywall-v2-lead">
                Probeer Gymlads 7 dagen 100% gratis; ben je niet overtuigd dat dit je
                progressie versnelt, dan annuleer je en betaal je €0,00.
              </p>
              <p className="onboarding__paywall-v2-social">
                <span className="onboarding__paywall-v2-stars" aria-hidden="true">
                  ★★★★★
                </span>
                <span>4.8/5.0 • 10.000+ workouts gemaakt</span>
              </p>
            </header>

            <div className="onboarding__paywall-offer">
              <span className="onboarding__paywall-offer-badge">BESPAAR 30%</span>
              <p className="onboarding__paywall-offer-daily">€ 0,19 / dag</p>
              <p className="onboarding__paywall-offer-yearly">
                Jaarabonnement:{' '}
                <span className="onboarding__paywall-offer-old">€ 99,99</span>{' '}
                <strong>€ 69,99 / jaar</strong>
              </p>
              <p className="onboarding__paywall-offer-note">(goedkoper dan 1 PT-sessie)</p>
            </div>

            <div className="onboarding__paywall-cta">
              {checkoutError && <div className="onboarding__error">{checkoutError}</div>}
              <NextButton
                label="CLAIM JOUW 7 DAGEN GRATIS"
                onClick={handleCheckout}
                loading={checkoutLoading}
              />
              <p className="onboarding__paywall-disclaimer">
                Probeer 7 dagen 100% gratis. Hierna wordt het abonnement automatisch verlengd
                voor de actieprijs van €69,99/jaar (daarna €99,99/jaar). Annuleer eenvoudig
                wanneer je wilt in jouw persoonlijke account.
              </p>
            </div>

            <section
              className="onboarding__paywall-features"
              aria-labelledby="paywall-features-title"
            >
              <h2 id="paywall-features-title" className="onboarding__paywall-features-title">
                Wat krijg je met Gymlads?
              </h2>
              <ul className="onboarding__paywall-features-list">
                <li>
                  <div className="onboarding__paywall-features-item">
                    <strong>Schema op maat:</strong>
                    <span>Exact weten wat te doen (gym of thuis).</span>
                  </div>
                </li>
                <li>
                  <div className="onboarding__paywall-features-item">
                    <strong>Automatische bijsturing:</strong>
                    <span>Wekelijks aangepaste workouts voor maximale progressie.</span>
                  </div>
                </li>
                <li>
                  <div className="onboarding__paywall-features-item">
                    <strong>Slimme AI-coaching:</strong>
                    <span>Concrete week-feedback op jouw prestaties.</span>
                  </div>
                </li>
                <li>
                  <div className="onboarding__paywall-features-item">
                    <strong>Alles-in-1 tracking:</strong>
                    <span>Sets, gewicht, omtrek en voeding op 1 plek.</span>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </OnboardingLayout>
      )

    default:
      return null
  }
}
