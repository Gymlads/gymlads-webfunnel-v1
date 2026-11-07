import { useCallback, useEffect, useRef, useState } from 'react'
import { createCheckoutSession, saveLead } from '../api'
import { storePendingCheckout } from './CheckoutResult'
import {
  HOME_EQUIPMENT,
  SPORTSCHOOL_TOESTELLEN,
  WEEKDAYS,
  initialOnboardingData,
  werkDagenBij,
  type BooleanFieldKey,
  type Doel,
  type ErvaringKrachttraining,
  type Geslacht,
  type GewensteTrainingsduur,
  type GrootsteUitdaging,
  type LocatieTraining,
  type OnboardingData,
  type SoortSportschool,
  type SpiergroepFocus,
} from '../types'
import OnboardingLayout from './components/OnboardingLayout'
import NextButton from './components/NextButton'
import OptionButton from './components/OptionButton'
import GoalsComparisonChart from './components/GoalsComparisonChart'
import EmailStap from './EmailStap'
import Paywall, { type CtaPositie } from './Paywall'
import { STANDAARD_PLAN, type Plan } from './paywallInhoud'
import { bewaarAntwoorden, leesAntwoorden } from './bewaren'
import {
  trackCheckoutWacht,
  trackEmailSubmitted,
  trackOnboardingStepView,
  trackPaywallCta,
  trackPlanSelected,
} from '../analytics/gtm'
import { meetStap } from '../analytics/meten'
import {
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

const DEFAULT_PAGE_BG = '#171719'

// Leeftijd als ranges (v3). De app en n8n verwachten een getal: we geven het
// midden van de range door (24-29 -> 26).
const LEEFTIJDEN = [
  { label: '18-23', waarde: 20 },
  { label: '24-29', waarde: 26 },
  { label: '30-39', waarde: 35 },
  { label: '40-49', waarde: 45 },
  { label: '50+', waarde: 55 },
] as const

// Gekleurde emoji per antwoord (Roel 21-10: de bekende icoontjes, zoals andere apps).
const DOEL_ICONEN = {
  Afvallen: '🔥',
  Spieropbouw: '💪',
  'Kracht opbouwen': '🏋️',
  Onderhouden: '⚖️',
  'Fit voelen': '❤️',
} satisfies Record<Doel, string>

const UITDAGING_ICONEN = {
  Consistentie: '📅',
  Motivatie: '🪫',
  'Niet weten wat te doen': '🤔',
  'Geen resultaat': '📉',
  'Weinig tijd': '⏰',
} satisfies Record<GrootsteUitdaging, string>

const ERVARING_ICONEN = {
  'Ik begin net': '🌱',
  'Ik train soms (niet consistent)': '🔄',
  '6-12 maanden consistent': '📈',
  '1+ jaar consistent': '🏆',
} satisfies Record<ErvaringKrachttraining, string>

// Zelfde vier keuzes als de app (locatie.tsx, 2.2.6).
const LOCATIES: ReadonlyArray<{
  label: string
  locatie: LocatieTraining
  soort: SoortSportschool
  icon: string
}> = [
  { label: 'Grote sportschool', locatie: 'Sportschool', soort: 'groot', icon: '🏢' },
  { label: 'Kleine sportschool', locatie: 'Sportschool', soort: 'klein', icon: '🏠' },
  { label: 'Thuis', locatie: 'Thuis', soort: '', icon: '🛋️' },
  { label: 'Sportschool én thuis', locatie: 'Beide', soort: 'groot', icon: '🔁' },
]

// Opgeslagen waarden blijven zoals n8n ze kent; alleen de tekst is gelijk aan de app.
const SPIERGROEPEN: ReadonlyArray<{ label: string; waarde: SpiergroepFocus }> = [
  { label: 'Ik wil alles gelijk trainen', waarde: 'Ik wil alles gelijk trainen' },
  { label: 'Borst', waarde: 'Borst' },
  { label: 'Rug', waarde: 'Rug' },
  { label: 'Schouders', waarde: 'Schouder' },
  { label: 'Biceps', waarde: 'Biceps' },
  { label: 'Triceps', waarde: 'Triceps' },
  { label: 'Benen/billen', waarde: 'Billen/Benen' },
]

/** Terug van "Probeer opnieuw" (geannuleerde betaling)? Dan meteen naar de paywall. */
function startPunt() {
  try {
    if (new URLSearchParams(window.location.search).get('terug') === 'paywall') {
      const bewaard = leesAntwoorden()
      if (bewaard) return bewaard
    }
  } catch {
    // gewoon bij het begin starten
  }
  return null
}

/** Matched to each screen image’s sampled edge/background pixels */
const STEP_PAGE_BG: Partial<Record<StepId, string>> = {
  email: '#171719',
  paywall: '#171719',
}

export default function OnboardingWizard() {
  const [terug] = useState(startPunt)
  const [stepId, setStepId] = useState<StepId>(terug ? 'paywall' : 'gender')
  const [data, setData] = useState<OnboardingData>(terug?.data ?? initialOnboardingData)
  const [email, setEmail] = useState(terug?.email ?? '')
  const [herinneringen, setHerinneringen] = useState(terug?.herinneringen ?? false)
  const [checkoutFout, setCheckoutFout] = useState<{ positie: CtaPositie; tekst: string } | null>(null)
  const [checkoutBezig, setCheckoutBezig] = useState<CtaPositie | null>(null)
  const [plan, setPlan] = useState<Plan>(STANDAARD_PLAN)
  const [pressedOption, setPressedOption] = useState<string | null>(null)
  const opgewarmd = useRef(false)

  const { progress, steps, currentIndex } = useOnboardingSteps(data, stepId)

  useEffect(() => {
    trackOnboardingStepView(stepId, currentIndex, steps.length, progress)
    meetStap(stepId, currentIndex >= 0 ? currentIndex + 1 : undefined, data)
  }, [stepId])

  useEffect(() => {
    setPressedOption(null)
  }, [stepId])

  // Paywall in beeld: de server alvast wakker maken, zodat de knop sneller
  // naar Stripe gaat (geen Stripe-aanroep, alleen /api/health).
  useEffect(() => {
    if (stepId !== 'paywall' || opgewarmd.current) return
    opgewarmd.current = true
    void fetch('/api/health', { cache: 'no-store' }).catch(() => undefined)
  }, [stepId])

  // Terug via "Probeer opnieuw": de URL weer schoon maken
  useEffect(() => {
    if (terug) window.history.replaceState(null, '', '/')
  }, [terug])

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
        const nextData = werkDagenBij(merged)

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

  const hasSelectedGymDay = WEEKDAYS.some((d) => data[d.gym])
  const hasSelectedHomeDay = WEEKDAYS.some((d) => data[d.home])
  const hasNoHomeEquipment = HOME_EQUIPMENT.every((item) => !data[item.key])

  async function handleCheckout(positie: CtaPositie) {
    if (checkoutBezig) return
    const start = performance.now()
    // Direct laten zien dat er iets gebeurt (spinner + "Even geduld…")
    setCheckoutFout(null)
    setCheckoutBezig(positie)
    trackPaywallCta(positie, plan)
    meetStap('betaalknop', undefined, data)
    bewaarAntwoorden(data, email, herinneringen)
    try {
      const result = await createCheckoutSession(data, email, plan)

      if (result.demo) {
        storePendingCheckout(data, result.submissionId ?? crypto.randomUUID())
        window.location.href = '/checkout/demo'
        return
      }

      if (!result.url) {
        throw new Error('Geen checkout-URL ontvangen')
      }

      trackCheckoutWacht(positie, performance.now() - start, true)
      window.location.href = result.url
    } catch (err) {
      console.error('[checkout]', err)
      trackCheckoutWacht(positie, performance.now() - start, false)
      setCheckoutFout({
        positie,
        tekst: 'Het lukt even niet om de betaalpagina te openen. Probeer het nog een keer.',
      })
      setCheckoutBezig(null)
    }
  }

  function kiesPlan(nieuw: Plan, positie: CtaPositie) {
    setCheckoutFout(null)
    setPlan(nieuw)
    trackPlanSelected(nieuw, positie)
  }

  // Terug uit Stripe met de terugknop van de browser (bfcache): knop weer aanzetten
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setCheckoutBezig(null)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

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

    case 'age':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Hoe oud ben je?</h1>
          <div className="onboarding__options">
            {LEEFTIJDEN.map((optie) => (
              <OptionButton
                key={optie.label}
                selected={isOptionSelected(optie.waarde, data.leeftijd)}
                onClick={() => selectSingle('leeftijd', optie.waarde)}
              >
                {optie.label}
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

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
                icon={DOEL_ICONEN[option]}
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
                icon={UITDAGING_ICONEN[option]}
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
          <p className="onboarding__subtitle">Zo bepaal ik je volume en hoe snel we opbouwen.</p>
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
                icon={ERVARING_ICONEN[option]}
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
          <p className="onboarding__subtitle">
            Hiermee verdeel ik je volume over de week en plan ik je herstel.
          </p>
          <div className="onboarding__options">
            {[2, 3, 4, 5, 6].map((days) => (
              <OptionButton
                key={days}
                selected={isOptionSelected(days, data.sessies_per_week)}
                onClick={() => selectSingle('sessies_per_week', days)}
              >
                {days}x per week
              </OptionButton>
            ))}
          </div>
        </OnboardingLayout>
      )

    case 'duration':
      return (
        <OnboardingLayout {...layoutProps}>
          <h1 className="onboarding__title">Hoe lang mag jouw workout duren?</h1>
          <p className="onboarding__subtitle">
            Dan bouw ik je trainingen zodat je ze binnen deze tijd af kunt ronden.
          </p>
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
          <h1 className="onboarding__title">Waar wil je de focus op leggen?</h1>
          <p className="onboarding__subtitle">
            Kies één spiergroep die extra volume krijgt in je schema, of train alles gelijkmatig.
          </p>
          <div className="onboarding__options">
            {SPIERGROEPEN.map((optie) => (
              <OptionButton
                key={optie.waarde}
                selected={isOptionSelected(optie.waarde, data.focus_spiergroepen)}
                onClick={() => selectSingle('focus_spiergroepen', optie.waarde)}
              >
                {optie.label}
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
          <p className="onboarding__subtitle">
            Dan kies ik oefeningen die passen bij wat jij tot je beschikking hebt.
          </p>
          <div className="onboarding__options">
            {LOCATIES.map((optie) => {
              const gekozen =
                pressedOption === optie.label ||
                (data.locatie_training === optie.locatie &&
                  (optie.locatie === 'Thuis' ||
                    (data.soort_sportschool || 'groot') === optie.soort))
              return (
                <OptionButton
                  key={optie.label}
                  icon={optie.icon}
                  selected={gekozen}
                  onClick={() => {
                    setPressedOption(optie.label)
                    const updates: Partial<OnboardingData> = {
                      locatie_training: optie.locatie,
                      soort_sportschool: optie.soort,
                    }
                    // Kleine sportschool: aanvinken wat de meeste hebben (zoals de app)
                    if (
                      optie.soort === 'klein' &&
                      !SPORTSCHOOL_TOESTELLEN.some((t) => data[t.key])
                    ) {
                      for (const t of SPORTSCHOOL_TOESTELLEN) updates[t.key] = t.standaard
                    }
                    setTimeout(() => {
                      setPressedOption(null)
                      navigateNext(updates)
                    }, 300)
                  }}
                >
                  {optie.label}
                </OptionButton>
              )
            })}
          </div>
        </OnboardingLayout>
      )

    case 'gym-equipment':
      return (
        <OnboardingLayout
          {...layoutProps}
          footer={<NextButton label="Klopt zo" onClick={() => navigateNext()} />}
        >
          <h1 className="onboarding__title">Wat heeft jouw sportschool?</h1>
          <p className="onboarding__subtitle">
            Ik heb alvast aangevinkt wat de meeste sportscholen hebben. Mis je iets? Vink het uit,
            dan krijg je geen oefeningen waarvoor je dat nodig hebt.
          </p>
          <div className="onboarding__options">
            {SPORTSCHOOL_TOESTELLEN.map((item) => (
              <OptionButton
                key={item.key}
                multi
                icon={item.emoji}
                selected={data[item.key]}
                onClick={() => toggleMulti(item.key)}
              >
                {item.label}
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
          {data.locatie_training === 'Beide' ? (
            <>
              <h1 className="onboarding__title">Op welke dagen wil je in de sportschool trainen?</h1>
              <p className="onboarding__subtitle">Dan plan ik je week slim in voor ritme en herstel.</p>
            </>
          ) : (
            <>
              <h1 className="onboarding__title">Op welke dagen kun je in de sportschool trainen?</h1>
              <p className="onboarding__subtitle">Dan plan ik je gymtrainingen op die dagen.</p>
            </>
          )}
          <div className="onboarding__options">
            {WEEKDAYS.map((day) => (
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
          <p className="onboarding__subtitle">
            {data.locatie_training === 'Beide'
              ? 'Dan plan ik je week slim in voor ritme en herstel.'
              : 'Dan houd ik rekening met beschikbare apparatuur en kies ik passende oefeningen.'}
          </p>
          <div className="onboarding__options">
            {WEEKDAYS.map((day) => (
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

    case 'equipment':
      return (
        <OnboardingLayout
          {...layoutProps}
          footer={<NextButton onClick={() => navigateNext()} />}
        >
          <h1 className="onboarding__title">Welke apparatuur heb je thuis beschikbaar?</h1>
          <p className="onboarding__subtitle">Op basis hiervan kunnen we je thuis oefeningen aanraden.</p>
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
              Geen/niet van toepassing
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

    case 'email':
      return (
        <OnboardingLayout {...layoutProps} pageBg="#171719">
          <EmailStap
            email={email}
            herinneringen={herinneringen}
            onVerder={(adres, vinkje) => {
              setEmail(adres)
              setHerinneringen(vinkje)
              trackEmailSubmitted(vinkje)
              saveLead(data, adres, vinkje)
              navigateNext()
            }}
          />
        </OnboardingLayout>
      )

    case 'paywall':
      return (
        <OnboardingLayout paywall pageBg="#171719">
          <Paywall
            onCheckout={handleCheckout}
            bezig={checkoutBezig}
            fout={checkoutFout}
            plan={plan}
            onKiesPlan={kiesPlan}
          />
        </OnboardingLayout>
      )

    default:
      return null
  }
}
