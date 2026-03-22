import { useState, useMemo, useCallback } from 'react'
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

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

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

export default function Landing() {
  const [isNight, setIsNight] = useState(true)
  const [hoverPokemon, setHoverPokemon] = useState(null)
  const [isExiting, setIsExiting] = useState(false)

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

  const stars = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      top:      `${Math.random() * 92}%`,
      left:     `${Math.random() * 100}%`,
      size:     1 + Math.random() * 1.5,
      duration: `${2 + Math.random() * 3}s`,
      delay:    `${Math.random() * 4}s`,
    }))
  , [])

  return (
    <main className={`${s.page} ${isNight ? s.night : s.day}`}>

      {/* Toggle — top right */}
      <button
        className={s.toggle}
        onClick={() => setIsNight(n => !n)}
        aria-label={isNight ? 'Switch to day' : 'Switch to night'}
      >
        {isNight ? <MoonIcon /> : <SunIcon />}
      </button>

      {/* Background layer */}
      <div className={s.bgLayer} aria-hidden="true">
        <div className={s.bgDay} />
        <div className={s.bgNight} />
        <div className={s.sun} />
        <div className={`${s.cloud} ${s.cloud1}`} />
        <div className={`${s.cloud} ${s.cloud2}`} />
        <div className={`${s.cloud} ${s.cloud3}`} />
        {isNight && stars.map(star => (
          <span
            key={star.id}
            className={s.star}
            style={{
              top:               star.top,
              left:              star.left,
              width:             `${star.size}px`,
              height:            `${star.size}px`,
              animationDuration: star.duration,
              animationDelay:    star.delay,
            }}
          />
        ))}
      </div>

      {/* 1 — Badge */}
      <div className={`${s.badge} ${s.section}`}>
        <span className={s.dot} />
        Your pocket companion
      </div>

      {/* 2 — Hero */}
      <div className={`${s.heroWrapper} ${s.section}`}>
        <div className={s.eggRing}>
          <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/egg.png"
            alt="Pokémon Egg"
            className={s.eggImg}
            draggable={false}
          />
        </div>
      </div>

      {/* 3 — Title */}
      <h1 className={`${s.title} ${s.section}`}>
        Raise your<br />
        <span className={s.titleItalic}>Pokémon.</span>
      </h1>

      {/* 4 — Subtitle */}
      <p className={`${s.subtitle} ${s.section}`}>
        Choose your companion. Feed it, play with it, watch it grow. A living Pokédex — just for you.
      </p>

      {/* 5 — Divider */}
      <div className={`${s.divider} ${s.section}`} />

      {/* 6 — Features */}
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

      {/* 7 — CTA */}
      <button
        className={`${s.cta} ${s.section}`}
        onMouseEnter={handleCtaEnter}
        onMouseLeave={handleCtaLeave}
      >
        <span className={`${s.ctaDefault} ${hoverPokemon && !isExiting ? s.ctaDefaultOut : ''} ${isExiting ? s.ctaDefaultIn : ''}`}>
          <Pokeball />
          Choose your Pokémon
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

      {/* 8 — Fine print */}
      <p className={`${s.finePrint} ${s.section}`}>
        Free · No account needed
      </p>

    </main>
  )
}
