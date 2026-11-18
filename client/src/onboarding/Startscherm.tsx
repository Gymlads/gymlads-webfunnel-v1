import type { Geslacht } from '../types'
import logoImage from './assets/gymlads-logo.png'
import foto1 from './assets/start-1.jpg'
import foto2 from './assets/start-2.jpg'
import foto3 from './assets/start-3.jpg'
import foto4 from './assets/start-4.jpg'
import foto5 from './assets/start-5.jpg'
import foto6 from './assets/start-6.jpg'

// Startscherm v2 (ontwerp Roel, 18 nov 2026): de eerste vraag (geslacht) staat
// meteen onder de collage. Alles past op één scherm, ook op iPhone SE en een
// klein Android-toestel: de collage krijgt hooguit ±44% van de schermhoogte.
// Collage: drie kolommen, de middelste iets hoger, langzaam bewegend.
// Volgorde: boven links, midden, rechts; onder links, midden, rechts.
const KOLOMMEN: ReadonlyArray<readonly [string, string]> = [
  [foto1, foto4],
  [foto2, foto5],
  [foto3, foto6],
]

// Welk deel van een foto in beeld blijft (verticaal). Foto 5: billen meer in
// beeld (Roel, 18 nov).
const POSITIE: Record<string, string> = { [foto5]: '50% 82%' }

interface StartschermProps {
  isGekozen: (option: Geslacht) => boolean
  onKies: (option: Geslacht) => void
}

function Pijl() {
  return (
    <svg className="startscherm__pijl" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Startscherm({ isGekozen, onKies }: StartschermProps) {
  return (
    <div className="onboarding startscherm">
      <header className="startscherm__logo">
        <img src={logoImage} alt="Gymlads" />
      </header>

      <main className="startscherm__inhoud">
        <h1 className="startscherm__kop">Word de sterkste versie van jezelf</h1>
        <p className="startscherm__tekst">
          Beantwoord een aantal vragen, zodat jouw <span className="startscherm__nowrap">AI-coach</span> je kan helpen je doelen te behalen.
        </p>

        <div className="startscherm__collage" aria-hidden="true">
          {KOLOMMEN.map((kolom, i) => (
            <div key={i} className={`startscherm__kolom startscherm__kolom--${i + 1}`}>
              {kolom.map((src) => (
                <img key={src} src={src} alt="" className="startscherm__foto" style={POSITIE[src] ? { objectPosition: POSITIE[src] } : undefined} fetchPriority="high" />
              ))}
            </div>
          ))}
        </div>

        <section className="startscherm__vraag" aria-labelledby="startscherm-vraag">
          <h2 id="startscherm-vraag" className="startscherm__vraag-titel">Ik ben een…</h2>
          {(['Man', 'Vrouw'] as Geslacht[]).map((option) => (
            <button
              key={option}
              type="button"
              className={`startscherm__keuze${isGekozen(option) ? ' startscherm__keuze--gekozen' : ''}`}
              onClick={() => onKies(option)}
            >
              <span>{option}</span>
              <Pijl />
            </button>
          ))}
          <p className="startscherm__klein">
            <span className="startscherm__accent">1-minuutquiz</span> voor jouw persoonlijke plan
          </p>
        </section>
      </main>
    </div>
  )
}
