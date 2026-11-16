import logoImage from './assets/gymlads-logo.png'
import foto1 from './assets/start-1.jpg'
import foto2 from './assets/start-2.jpg'
import foto3 from './assets/start-3.jpg'
import foto4 from './assets/start-4.jpg'
import foto5 from './assets/start-5.jpg'
import foto6 from './assets/start-6.jpg'

// Startscherm vóór de eerste vraag (ontwerp Roel, 16 nov 2026).
// Collage: drie kolommen, de middelste iets hoger, de buitenste lopen van het
// scherm af. Volgorde zoals in het ontwerp: boven links, midden, rechts;
// onder links, midden, rechts.
const KOLOMMEN: ReadonlyArray<readonly [string, string]> = [
  [foto1, foto4],
  [foto2, foto5],
  [foto3, foto6],
]

interface StartschermProps {
  onStart: () => void
}

export default function Startscherm({ onStart }: StartschermProps) {
  return (
    <div className="onboarding startscherm">
      <header className="startscherm__logo">
        <img src={logoImage} alt="Gymlads" />
      </header>

      <main className="startscherm__inhoud">
        <h1 className="startscherm__kop">Word de sterkste versie van jezelf</h1>
        <p className="startscherm__tekst">
          Beantwoord een paar vragen, zodat je <span className="startscherm__nowrap">AI-coach</span> jou goed kan helpen.
        </p>

        <div className="startscherm__collage" aria-hidden="true">
          {KOLOMMEN.map((kolom, i) => (
            <div key={i} className={`startscherm__kolom startscherm__kolom--${i + 1}`}>
              {kolom.map((src) => (
                <img key={src} src={src} alt="" className="startscherm__foto" />
              ))}
            </div>
          ))}
        </div>
      </main>

      <footer className="startscherm__onder">
        <button type="button" className="onboarding__btn startscherm__knop" onClick={onStart}>
          START
        </button>
        <p className="startscherm__klein">1-minuutquiz voor jouw persoonlijke plan</p>
      </footer>
    </div>
  )
}
