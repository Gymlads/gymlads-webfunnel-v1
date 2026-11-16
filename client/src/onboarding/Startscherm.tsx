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
// De foto's zijn al precies bijgesneden zoals in Roels ontwerp (tegel 300x370);
// tweede waarde = welk deel in beeld blijft als dat ooit nodig is.
type Foto = readonly [src: string, positie: string]
const KOLOMMEN: ReadonlyArray<readonly [Foto, Foto]> = [
  [[foto1, '50% 50%'], [foto4, '50% 50%']],
  [[foto2, '50% 50%'], [foto5, '50% 50%']],
  [[foto3, '50% 50%'], [foto6, '50% 50%']],
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
          Beantwoord een paar vragen, zodat onze <span className="startscherm__nowrap">AI-coach</span> jou kan helpen.
        </p>

        <div className="startscherm__collage" aria-hidden="true">
          <div className="startscherm__raster">
          <div className="startscherm__kolommen">
          {KOLOMMEN.map((kolom, i) => (
            <div key={i} className={`startscherm__kolom startscherm__kolom--${i + 1}`}>
              {kolom.map(([src, positie]) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="startscherm__foto"
                  style={{ objectPosition: positie }}
                  fetchPriority="high"
                />
              ))}
            </div>
          ))}
          </div>
          </div>
        </div>
      </main>

      <footer className="startscherm__onder">
        <button type="button" className="onboarding__btn startscherm__knop" onClick={onStart}>
          START
        </button>
        <p className="startscherm__klein">
          <span className="startscherm__accent">1-minuutquiz</span> voor jouw persoonlijke plan
        </p>
      </footer>
    </div>
  )
}
