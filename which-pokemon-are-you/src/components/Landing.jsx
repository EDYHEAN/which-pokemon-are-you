import { useState, useEffect } from 'react'
import s from './Landing.module.css'

const POKEMON_IDS = [249, 448, 282, 384, 644, 800, 888, 6]

const STATS = [
  { number: '1025', label: 'Pokémon' },
  { number: '7',    label: 'Situations' },
  { number: '2 min', label: 'Experience' },
]

export default function Landing() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(i => (i + 1) % POKEMON_IDS.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className={s.page}>

      {/* 1 — Eyebrow */}
      <p className={`${s.eyebrow} ${s.section}`}>
        Pokémon × Personality
      </p>

      {/* 2 — Carousel */}
      <div className={`${s.carouselWrapper} ${s.section}`}>
        <div className={s.carouselFrame}>
          {POKEMON_IDS.map((id, i) => (
            <img
              key={id}
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
              alt=""
              className={`${s.pokemonImg} ${i === active ? s.active : ''}`}
              draggable={false}
            />
          ))}
        </div>
        <div className={s.dots}>
          {POKEMON_IDS.map((id, i) => (
            <span
              key={id}
              className={`${s.dot} ${i === active ? s.activeDot : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 3 — Title */}
      <h1 className={`${s.title} ${s.section}`}>
        Meet your<br />
        <span className={s.titleItalic}>Pokémon.</span>
      </h1>

      {/* 4 — Subtitle */}
      <p className={`${s.subtitle} ${s.section}`}>
        7 real situations. Analyzed by AI. One Pokémon — from 1025 — that's entirely yours.
      </p>

      {/* 5 — Divider */}
      <div className={`${s.divider} ${s.section}`} />

      {/* 6 — Stats */}
      <div className={`${s.stats} ${s.section}`}>
        {STATS.map(({ number, label }) => (
          <div key={label} className={s.stat}>
            <span className={s.statNumber}>{number}</span>
            <span className={s.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* 7 — CTA */}
      <button className={`${s.cta} ${s.section}`}>
        Begin the experience →
      </button>

      {/* 8 — Fine print */}
      <p className={`${s.finePrint} ${s.section}`}>
        Free · AI-powered · Shareable
      </p>

    </main>
  )
}
