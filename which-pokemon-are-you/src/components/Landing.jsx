import s from './Landing.module.css'

export default function Landing() {
  return (
    <main className={s.page}>

      {/* 1 — Badge */}
      <div className={`${s.badge} ${s.section}`}>
        <span className={s.dot} />
        Your pocket companion
      </div>

      {/* 2 — Eyebrow */}
      <p className={`${s.eyebrow} ${s.section}`}>
        Pokémon × Tamagotchi
      </p>

      {/* 3 — Hero */}
      <div className={`${s.heroWrapper} ${s.section}`}>
        <img
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png"
          alt="Jigglypuff"
          className={s.hero}
          draggable={false}
        />
      </div>

      {/* 4 — Title */}
      <h1 className={`${s.title} ${s.section}`}>
        Raise your<br />
        <span className={s.titleItalic}>Pokémon.</span>
      </h1>

      {/* 5 — Subtitle */}
      <p className={`${s.subtitle} ${s.section}`}>
        Choose your companion. Feed it, play with it, watch it grow. A living Pokédex — just for you.
      </p>

      {/* 6 — Divider */}
      <div className={`${s.divider} ${s.section}`} />

      {/* 7 — Features */}
      <div className={`${s.features} ${s.section}`}>
        {[
          { word: 'Feed',  sub: '& care'  },
          { word: 'Play',  sub: '& bond'  },
          { word: 'Grow',  sub: '& evolve'},
        ].map(({ word, sub }) => (
          <div key={word} className={s.feature}>
            <span className={s.featureWord}>{word}</span>
            <span className={s.featureSub}>{sub}</span>
          </div>
        ))}
      </div>

      {/* 8 — CTA */}
      <button className={`${s.cta} ${s.section}`}>
        Choose your Pokémon →
      </button>

      {/* 9 — Fine print */}
      <p className={`${s.finePrint} ${s.section}`}>
        Free · No account needed
      </p>

    </main>
  )
}
