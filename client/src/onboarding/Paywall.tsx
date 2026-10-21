import { useState } from 'react'
import { Check, ChevronDown, Star } from 'lucide-react'
import PaymentLogos from './components/PaymentLogos'
import {
  AANTAL_SPORTERS,
  APP_STORE_SCORE,
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  PRIJS,
  PRIVACY_URL,
  REVIEWS,
  VOORDELEN,
  VOORWAARDEN_URL,
} from './paywallInhoud'
import vlagImage from './assets/gymlads-vlag.png'
import avatarGijs from './assets/avatar-gijs.svg'
import avatarBjarne from './assets/avatar-bjarne.svg'
import avatarLuuk from './assets/avatar-luuk.svg'

const AVATARS: Record<string, string> = { gijs: avatarGijs, bjarne: avatarBjarne, luuk: avatarLuuk }

export type CtaPositie = 'boven' | 'onder'

interface PaywallProps {
  onCheckout: (positie: CtaPositie) => void
  /** Welke knop bezig is (null = geen). Beide knoppen staan dan uit. */
  bezig: CtaPositie | null
  /** Foutmelding, getoond bij de knop waarop getikt werd. */
  fout: { positie: CtaPositie; tekst: string } | null
}

// Betaalblok in de opbouw van Flitsboek: kaart "Jouw plan" met het gekozen
// abonnement (lime rand + vinkje), kleine tekst, knop en "Veilig betalen".
function Betaalblok({ positie, onCheckout, bezig, fout }: PaywallProps & { positie: CtaPositie }) {
  const ditBlokBezig = bezig === positie
  return (
    <section className="paywall__plan" aria-label="Jouw plan">
      <h2 className="paywall__plan-title">Jouw plan</h2>

      <div className="paywall__offer">
        <div className="paywall__offer-top">
          <p className="paywall__offer-name">
            {PRIJS.naam}
            {PRIJS.doorgestreept && (
              <>
                {' - '}
                <s className="paywall__offer-old">{PRIJS.doorgestreept}</s>
              </>
            )}
          </p>
          <span className="paywall__radio" aria-hidden="true">
            <Check size={14} strokeWidth={3.5} />
          </span>
        </div>
        <p className="paywall__offer-trial">7 dagen gratis uitproberen!</p>
        <div className="paywall__offer-bottom">
          <p className="paywall__offer-daily">
            {PRIJS.perDag}
            <span>/dag</span>
          </p>
          {PRIJS.label && <span className="paywall__offer-badge">{PRIJS.label}</span>}
        </div>
      </div>

      <p className="paywall__smallprint">{PRIJS.kleineTekst}</p>

      {fout?.positie === positie && <div className="onboarding__error">{fout.tekst}</div>}
      <button
        type="button"
        className={`onboarding__btn paywall__cta${ditBlokBezig ? ' paywall__cta--bezig' : ''}`}
        onClick={() => onCheckout(positie)}
        disabled={bezig !== null}
        aria-busy={ditBlokBezig}
        data-cta-positie={positie}
      >
        {ditBlokBezig ? (
          <>
            <span className="paywall__spinner" aria-hidden="true" />
            Even geduld…
          </>
        ) : (
          'GA VERDER'
        )}
      </button>
      <PaymentLogos />
    </section>
  )
}

// Vier vragen (Roel 21-10: er waren er te veel). Overige vragen: mail, zie onder de FAQ.
const FAQ: Array<{ vraag: string; antwoord: React.ReactNode }> = [
  { vraag: 'Hoe werkt de gratis proef?', antwoord: PRIJS.faqProef },
  {
    vraag: 'Hoe zeg ik mijn abonnement op?',
    antwoord: (
      <>
        Stuur een mail naar <a href="mailto:info@gymlads.nl">info@gymlads.nl</a> met je
        e-mailadres. Doe dit uiterlijk 24 uur voor het einde van je proef, dan betaal je niks.
      </>
    ),
  },
  {
    vraag: 'Hoe krijg ik toegang tot de app?',
    antwoord: (
      <>
        Na het starten van je proef download je de Gymlads-app (
        <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
          App Store
        </a>{' '}
        /{' '}
        <a href={GOOGLE_PLAY_URL} target="_blank" rel="noreferrer">
          Google Play
        </a>
        ) en maak je een account aan met hetzelfde e-mailadres. Je plan staat dan voor je klaar.
      </>
    ),
  },
  {
    vraag: 'Werkt Gymlads ook als ik net begin?',
    antwoord:
      'Ja. Je schema wordt gemaakt op jouw niveau. Bij elke oefening staat uitleg, en twijfel je ergens over, dan vraag je het gewoon aan je coach in de app.',
  },
]

function Sterren() {
  return (
    <span className="paywall__stars" aria-label="5 van 5 sterren">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={18} strokeWidth={0} fill="currentColor" aria-hidden="true" />
      ))}
    </span>
  )
}

export default function Paywall(props: PaywallProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="paywall">
      {/* 1. Kop */}
      <header className="paywall__header">
        <h1 className="paywall__title">Start vandaag voor €0,-</h1>
        <p className="paywall__lead">
          Probeer Gymlads 7 dagen gratis. Zeg je op tijdens je proef, dan betaal je niks.
        </p>
      </header>

      {/* 2. Betaalblok boven */}
      <Betaalblok {...props} positie="boven" />

      {/* 3. Wat krijg je */}
      <section className="paywall__card paywall__card--rand">
        <h2 className="paywall__h2">Wat krijg je met Gymlads?</h2>
        <ul className="paywall__checks">
          {VOORDELEN.map((v) => (
            <li key={v}>
              <span className="paywall__check" aria-hidden="true">
                <Check size={14} strokeWidth={3.5} />
              </span>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Reviews */}
      <section>
        <h2 className="paywall__h2 paywall__h2--groot">Wat zeggen sporters?</h2>
        {APP_STORE_SCORE && (
          <p className="paywall__score">
            ★ {APP_STORE_SCORE.score} in de App Store ({APP_STORE_SCORE.aantal} beoordelingen)
          </p>
        )}
        <div className="paywall__reviews">
          {REVIEWS.map((r) => (
            <figure key={r.naam} className="paywall__review">
              <p className="paywall__review-title">{r.titel}</p>
              <Sterren />
              <blockquote className="paywall__review-text">“{r.tekst}”</blockquote>
              <figcaption className="paywall__review-who">
                <img className="paywall__avatar" src={AVATARS[r.avatar]} alt="" width={36} height={36} />
                <span>{r.naam}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 4b. Sociaal bewijs */}
      <section className="paywall__social">
        <img src={vlagImage} alt="" className="paywall__social-icon" width={48} height={48} />
        <p className="paywall__social-title">
          <span className="paywall__social-getal">{AANTAL_SPORTERS}</span>
          sporters gingen je voor
        </p>
        <p className="paywall__social-sub">
          Word lid en zet de eerste stap naar jouw doel! 🚀
        </p>
      </section>

      {/* 5. Betaalblok herhaald */}
      <Betaalblok {...props} positie="onder" />

      {/* 6. FAQ */}
      <section>
        <h2 className="paywall__h2 paywall__h2--groot">Veelgestelde vragen</h2>
        <div className="paywall__faq">
          {FAQ.map((item, i) => {
            const open = openFaq === i
            return (
              <div key={item.vraag} className={`paywall__faq-item${open ? ' paywall__faq-item--open' : ''}`}>
                <button
                  type="button"
                  className="paywall__faq-q"
                  aria-expanded={open}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpenFaq(open ? null : i)}
                >
                  <span>{item.vraag}</span>
                  <ChevronDown size={20} className="paywall__faq-arrow" aria-hidden="true" />
                </button>
                {open && (
                  <div id={`faq-${i}`} className="paywall__faq-a">
                    {item.antwoord}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="paywall__faq-meer">
          Meer vragen? Mail ons op <a href="mailto:info@gymlads.nl">info@gymlads.nl</a>.
        </p>
      </section>

      {/* 7. Onderaan */}
      <p className="paywall__legal">
        Door verder te gaan ga je akkoord met onze{' '}
        <a href={VOORWAARDEN_URL} target="_blank" rel="noreferrer">
          Algemene Voorwaarden
        </a>{' '}
        en het{' '}
        <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
          Privacybeleid
        </a>
        .
      </p>
    </div>
  )
}
