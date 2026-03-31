import { useState, useCallback, useRef } from 'react'
import s from './Landing.module.css'

const gen1Pool = [
  { id: 4,   name: 'Salamèche' },
  { id: 7,   name: 'Carapuce'  },
  { id: 1,   name: 'Bulbizarre'},
  { id: 25,  name: 'Pikachu'   },
  { id: 39,  name: 'Rondoudou' },
  { id: 52,  name: 'Miaouss'   },
  { id: 54,  name: 'Psykokwak' },
  { id: 63,  name: 'Abra'      },
  { id: 94,  name: 'Ectoplasma'},
  { id: 133, name: 'Évoli'     },
  { id: 129, name: 'Magicarpe' },
  { id: 143, name: 'Ronflex'   },
  { id: 131, name: 'Lokhlass'  },
  { id: 113, name: 'Leveinard' },
  { id: 58,  name: 'Caninos'   },
  { id: 79,  name: 'Ramoloss'  },
  { id: 137, name: 'Porygon'   },
  { id: 147, name: 'Minidraco' },
  { id: 106, name: 'Kicklee'   },
  { id: 132, name: 'Métamorph' },
]

const phrases = [
  "Ce sera {name} ?",
  "Peut-être {name} ?",
  "Et si c'était {name} ?",
  "Ton destin : {name} ?",
  "On dirait {name}...",
  "{name} t'attend ?",
]

function Pokeball() {
  return (
    <svg className={s.pokeball} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="white" stroke="#1a1a1a" strokeWidth="1.5" />
      <path d="M1 10 Q1 1 10 1 Q19 1 19 10" fill="#E63946" />
      <rect x="1" y="9" width="18" height="2" fill="#1a1a1a" />
      <circle cx="10" cy="10" r="2.5" fill="white" stroke="#1a1a1a" strokeWidth="1.5" />
    </svg>
  )
}

export default function Landing({ isNight, onChoose, onResume }) {
  const [hoverPokemon, setHoverPokemon] = useState(null)
  const [isExiting, setIsExiting] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  const handleResume = () => {
    const ok = onResume?.()
    if (!ok) showToast('Aucune save trouvée')
  }

  const handleCtaEnter = useCallback(() => {
    const pokemon = gen1Pool[Math.floor(Math.random() * gen1Pool.length)]
    const template = phrases[Math.floor(Math.random() * phrases.length)]
    setIsExiting(false)
    setHoverPokemon({ ...pokemon, phrase: template.replace('{name}', pokemon.name) })
  }, [])

  const handleCtaLeave = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      setHoverPokemon(null)
      setIsExiting(false)
    }, 220)
  }, [])

  return (
    <main className={`${s.page} ${isNight ? s.night : s.day}`}>

      {/* 1 — Badge */}
      <div className={`${s.badge} ${s.section}`}>
        <span className={s.dot} />
        Your pocket companion
      </div>

      {/* 2 — Title */}
      <h1 className={`${s.title} ${s.section}`}>
        Raise your<br />
        <span className={s.titleItalic}>Pokémon.</span>
      </h1>

      {/* 3 — Subtitle */}
      <p className={`${s.subtitle} ${s.section}`}>
        Choose your companion. Feed it, play with it, watch it grow. A living Pokédex — just for you.
      </p>

      {/* 4 — Egg + CTA group */}
      <div className={`${s.eggCtaGroup} ${s.section}`}>
        <div className={s.eggRing}>
          <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/egg.png"
            alt="Pokémon Egg"
            className={s.eggImg}
            draggable={false}
          />
        </div>

        <button
          className={s.cta}
          onMouseEnter={handleCtaEnter}
          onMouseLeave={handleCtaLeave}
          onClick={onChoose}
        >
          <span className={`${s.ctaDefault} ${hoverPokemon && !isExiting ? s.ctaDefaultOut : ''} ${isExiting ? s.ctaDefaultIn : ''}`}>
            <Pokeball />
            What's inside ?
          </span>
          <span className={`${s.ctaHoverContent} ${hoverPokemon && !isExiting ? s.ctaHoverIn : ''} ${isExiting ? s.ctaHoverOut : ''}`}>
            {hoverPokemon && (
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${hoverPokemon.id}.png`}
                alt={hoverPokemon.name}
                className={s.ctaSprite}
              />
            )}
            {hoverPokemon?.phrase}
          </span>
        </button>

        <p
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.12em',
            textAlign: 'center',
            marginTop: '12px',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
          onClick={handleResume}
        >
          Déjà dresseur ? Se connecter
        </p>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999,
          background: 'rgba(30,30,40,0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 999,
          padding: '10px 22px',
          color: 'rgba(255,255,255,0.85)',
          fontSize: 12,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 300,
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}

      {/* 5 — Fine print */}
      <p className={`${s.finePrint} ${s.section}`}>
        Free · No account needed
      </p>

      {/* 6 — Divider */}
      <div className={`${s.divider} ${s.section}`} />

      {/* 7 — Features */}
      <div className={`${s.features} ${s.section}`}>
        {[
          { word: 'Feed', sub: '& care'   },
          { word: 'Play', sub: '& bond'   },
          { word: 'Grow', sub: '& evolve' },
        ].map(({ word, sub }) => (
          <div key={word} className={s.feature}>
            <span className={s.featureWord}>{word}</span>
            <span className={s.featureSub}>{sub}</span>
          </div>
        ))}
      </div>

    </main>
  )
}
