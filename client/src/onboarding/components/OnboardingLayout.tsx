import type { CSSProperties, ReactNode } from 'react'
import logoKlein from '../assets/gymlads-logo-klein.png'

interface OnboardingLayoutProps {
  children: ReactNode
  progress?: { current: number; total: number }
  showBack?: boolean
  pageBg?: string
  onBack?: () => void
  footer?: ReactNode
  centered?: boolean
  alignTop?: boolean
  planReady?: boolean
  paywall?: boolean
  welcome?: boolean
  checkoutSuccess?: boolean
}

export default function OnboardingLayout({
  children,
  progress,
  showBack,
  pageBg,
  onBack,
  footer,
  centered,
  alignTop,
  planReady,
  paywall,
  welcome,
  checkoutSuccess,
}: OnboardingLayoutProps) {
  const layoutStyle = pageBg
    ? ({ '--bg': pageBg, background: pageBg } as CSSProperties)
    : undefined

  return (
    <div className="onboarding" style={layoutStyle}>
      {/* Klein logo bovenaan elk scherm (zoals Fitbod) */}
      {!checkoutSuccess && (
        <header className={`onboarding__header${paywall ? ' onboarding__header--paywall' : ''}`}>
          {showBack && onBack && (
            <button type="button" className="onboarding__back" onClick={onBack} aria-label="Terug">
              <svg
                className="onboarding__back-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 6L9 12L15 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <div className="onboarding__logo">
            <img className="onboarding__logo-klein" src={logoKlein} alt="Gymlads" />
          </div>
        </header>
      )}

      {progress && (
        <div className="onboarding__progress" role="progressbar" aria-valuenow={progress.current} aria-valuemax={progress.total}>
          {Array.from({ length: progress.total }, (_, i) => (
            <div
              key={i}
              className={`onboarding__progress-segment${i < progress.current ? ' onboarding__progress-segment--active' : ''}`}
            />
          ))}
        </div>
      )}

      <main
        className={`onboarding__content${
          centered ? ' onboarding__content--center' : ''
        }${alignTop ? ' onboarding__content--align-top' : ''}${
          planReady ? ' onboarding__content--plan-ready' : ''
        }${paywall ? ' onboarding__content--paywall' : ''}${
          welcome ? ' onboarding__content--welcome' : ''
        }${checkoutSuccess ? ' onboarding__content--checkout-success' : ''}`}
      >
        {children}
      </main>

      {footer && (
        <footer className={`onboarding__footer${paywall ? ' onboarding__footer--paywall' : ''}`}>
          {footer}
        </footer>
      )}
    </div>
  )
}
