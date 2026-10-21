import { ShieldCheck } from 'lucide-react'
import { BETAALMETHODES } from '../paywallInhoud'

// Eenvoudige, herkenbare logo-badges (wit vlak, eigen kleuren) voor
// "Veilig betalen met". Alleen de methodes uit BETAALMETHODES.

function Badge({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span className="paywall__pm-badge" role="img" aria-label={label}>
      {children}
    </span>
  )
}

const LOGOS = {
  ideal: (
    <Badge label="iDEAL" key="ideal">
      <svg viewBox="0 0 44 20" height="16" aria-hidden="true">
        <text x="22" y="15" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight="800" fontSize="13" fill="#CC0066">
          iDEAL
        </text>
      </svg>
    </Badge>
  ),
  applepay: (
    <Badge label="Apple Pay" key="applepay">
      <svg viewBox="0 0 44 20" height="16" aria-hidden="true">
        <path
          transform="translate(3 2) scale(0.66)"
          fill="#000"
          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.41-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.274 3.721 1.338.104 2.715-.688 3.559-1.709"
        />
        <text x="29" y="15" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight="600" fontSize="12.5" fill="#000">
          Pay
        </text>
      </svg>
    </Badge>
  ),
  googlepay: (
    <Badge label="Google Pay" key="googlepay">
      <svg viewBox="0 0 44 20" height="16" aria-hidden="true">
        <text x="4" y="15" fontFamily="Inter, Arial, sans-serif" fontWeight="700" fontSize="13">
          <tspan fill="#4285F4">G</tspan>
        </text>
        <text x="28" y="15" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight="600" fontSize="12.5" fill="#5F6368">
          Pay
        </text>
      </svg>
    </Badge>
  ),
  visa: (
    <Badge label="Visa" key="visa">
      <svg viewBox="0 0 44 20" height="16" aria-hidden="true">
        <text x="22" y="15.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontStyle="italic" fontWeight="900" fontSize="14" fill="#1A1F71">
          VISA
        </text>
      </svg>
    </Badge>
  ),
  mastercard: (
    <Badge label="Mastercard" key="mastercard">
      <svg viewBox="0 0 44 20" height="16" aria-hidden="true">
        <circle cx="17.5" cy="10" r="7.5" fill="#EB001B" />
        <circle cx="26.5" cy="10" r="7.5" fill="#F79E1B" />
        <path d="M22 4a7.5 7.5 0 0 1 0 12 7.5 7.5 0 0 1 0-12z" fill="#FF5F00" />
      </svg>
    </Badge>
  ),
}

export default function PaymentLogos() {
  return (
    <div className="paywall__pm">
      <p className="paywall__pm-title">
        <ShieldCheck size={16} strokeWidth={2} aria-hidden="true" />
        Veilig betalen met:
      </p>
      <div className="paywall__pm-list">{BETAALMETHODES.map((m) => LOGOS[m])}</div>
    </div>
  )
}
