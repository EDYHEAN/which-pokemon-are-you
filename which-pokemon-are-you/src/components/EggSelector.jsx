import { useState, useRef, useCallback, useEffect } from 'react'
import s from './EggSelector.module.css'

const pokemon = [
  { id: 1,   name: 'Bulbizarre',  no: '001', type: 'Plante / Poison', size: '0.7m',  weight: '6.9kg',   temperament: 'Doux et réservé' },
  { id: 4,   name: 'Salamèche',   no: '004', type: 'Feu',             size: '0.6m',  weight: '8.5kg',   temperament: 'Courageux et fier' },
  { id: 7,   name: 'Carapuce',    no: '007', type: 'Eau',             size: '0.5m',  weight: '9.0kg',   temperament: 'Calme et protecteur' },
  { id: 25,  name: 'Pikachu',     no: '025', type: 'Électrik',        size: '0.4m',  weight: '6.0kg',   temperament: 'Vif et espiègle' },
  { id: 35,  name: 'Mélofée',     no: '035', type: 'Fée',             size: '0.6m',  weight: '7.5kg',   temperament: 'Curieux et câlin' },
  { id: 39,  name: 'Rondoudou',   no: '039', type: 'Normal / Fée',    size: '0.5m',  weight: '5.5kg',   temperament: 'Sensible et expressif' },
  { id: 52,  name: 'Miaouss',     no: '052', type: 'Normal',          size: '0.4m',  weight: '4.2kg',   temperament: 'Rusé et indépendant' },
  { id: 54,  name: 'Psykokwak',   no: '054', type: 'Eau',             size: '0.8m',  weight: '19.6kg',  temperament: 'Perplexe et attachant' },
  { id: 58,  name: 'Caninos',     no: '058', type: 'Feu',             size: '0.7m',  weight: '19.0kg',  temperament: 'Loyal et impulsif' },
  { id: 63,  name: 'Abra',        no: '063', type: 'Psy',             size: '0.9m',  weight: '19.5kg',  temperament: 'Introverti et mystérieux' },
  { id: 77,  name: 'Ponyta',      no: '077', type: 'Feu',             size: '1.0m',  weight: '30.0kg',  temperament: 'Libre et fougueux' },
  { id: 79,  name: 'Ramoloss',    no: '079', type: 'Eau / Psy',       size: '1.2m',  weight: '36.0kg',  temperament: 'Contemplatif et serein' },
  { id: 92,  name: 'Fantominus',  no: '092', type: 'Spectre / Poison',size: '1.3m',  weight: '0.1kg',   temperament: 'Espiègle et insaisissable' },
  { id: 102, name: 'Noeunoeuf',   no: '102', type: 'Plante / Psy',    size: '0.4m',  weight: '5.0kg',   temperament: 'Zen et collectif' },
  { id: 113, name: 'Leveinard',   no: '113', type: 'Normal',          size: '1.1m',  weight: '55.5kg',  temperament: 'Généreux et maternel' },
  { id: 115, name: 'Kangourex',   no: '115', type: 'Normal',          size: '2.2m',  weight: '80.0kg',  temperament: 'Protecteur et déterminé' },
  { id: 116, name: 'Hypotrempe',  no: '116', type: 'Eau',             size: '0.4m',  weight: '8.0kg',   temperament: 'Gracieux et timide' },
  { id: 129, name: 'Magicarpe',   no: '129', type: 'Eau',             size: '0.9m',  weight: '10.0kg',  temperament: 'Persévérant malgré tout' },
  { id: 131, name: 'Lokhlass',    no: '131', type: 'Eau / Glace',     size: '2.5m',  weight: '220.0kg', temperament: 'Majestueux et mystérieux' },
  { id: 132, name: 'Métamorph',   no: '132', type: 'Normal',          size: '0.3m',  weight: '4.0kg',   temperament: 'Adaptable et imprévisible' },
  { id: 133, name: 'Évoli',       no: '133', type: 'Normal',          size: '0.3m',  weight: '6.5kg',   temperament: 'Curieux et indécis' },
  { id: 137, name: 'Porygon',     no: '137', type: 'Normal',          size: '0.8m',  weight: '36.5kg',  temperament: 'Logique et précis' },
  { id: 143, name: 'Ronflex',     no: '143', type: 'Normal',          size: '2.1m',  weight: '460.0kg', temperament: 'Paisible et gourmand' },
  { id: 147, name: 'Minidraco',   no: '147', type: 'Dragon',          size: '1.8m',  weight: '3.3kg',   temperament: 'Noble et ambitieux' },
]

const TYPE_COLORS = {
  Plante:   '#4CAF50', Poison:  '#A040A0', Feu:     '#FF6B35',
  Eau:      '#4A9EFF', Électrik:'#FFD700', Psy:     '#FF69B4',
  Normal:   '#A8A8A8', Fée:     '#FFB7C5', Dragon:  '#7038F8',
  Spectre:  '#705898', Glace:   '#98D8D8',
}

const bubbleTexts = ['！', '♡', 'やった！', '✨', 'Ouiii !', 'Choisis-moi !']

// ── Carousel constants ────────────────────────────────────────
// 3 clones on each side ensures dist-2 neighbours always exist
const CLONE   = 3
const CARD_W  = 300
const GAP     = 16
const STEP    = CARD_W + GAP  // 316px per slot

// Extended array: [last-3, last-2, last-1, 0..23, 0, 1, 2]  (30 items)
const EXT = [
  ...pokemon.slice(-CLONE),
  ...pokemon,
  ...pokemon.slice(0, CLONE),
]

// Scale / opacity per distance from centre
const SCALE_BY_DIST   = [1, 0.7,  0.533, 0]
const OPACITY_BY_DIST = [1, 0.75, 0.35,  0]

// ── Card3D (zone-based tilt, centre only) ─────────────────────
const ZONES = [
  { rotX:  1, rotY: -1 }, { rotX:  1, rotY:  0 }, { rotX:  1, rotY:  1 },
  { rotX:  0, rotY: -1 },                           { rotX:  0, rotY:  1 },
  { rotX: -1, rotY: -1 }, { rotX: -1, rotY:  0 }, { rotX: -1, rotY:  1 },
]

function zoneStyle(i) {
  const top  = i < 3, bot = i > 4
  return {
    position: 'absolute',
    width:  (!top && !bot) ? '50%' : '33.33%',
    height: top || bot ? '33%' : '34%',
    top:    top ? 0 : bot ? '67%' : '33%',
    left:   [0,3,5].includes(i) ? 0 : [2,4,7].includes(i) ? '67%' : '33%',
    zIndex: 10, cursor: 'pointer',
  }
}

function Card3D({ children, onHoloMove, onHoloLeave }) {
  const innerRef = useRef(null)

  const enter = (rotX, rotY) => {
    if (!innerRef.current) return
    innerRef.current.style.transform  = `perspective(600px) rotateX(${rotX * 12}deg) rotateY(${rotY * 12}deg) scale(1.04)`
    innerRef.current.style.transition = 'transform 0.15s ease'
  }
  const leave = () => {
    if (innerRef.current) {
      innerRef.current.style.transform  = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)'
      innerRef.current.style.transition = 'transform 0.4s ease'
    }
    onHoloLeave?.()
  }
  const move = (e) => {
    if (!onHoloMove) return
    const r = e.currentTarget.getBoundingClientRect()
    onHoloMove((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
         onMouseLeave={leave} onMouseMove={move}>
      <div ref={innerRef} style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
      {ZONES.map((z, i) => (
        <div key={i} onMouseEnter={() => enter(z.rotX, z.rotY)} style={zoneStyle(i)} />
      ))}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────
function Pokeball() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className={s.pokeball}>
      <circle cx="10" cy="10" r="9" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
      <path d="M1 10 Q1 1 10 1 Q19 1 19 10" fill="#E63946"/>
      <rect x="1" y="9" width="18" height="2" fill="#1a1a1a"/>
      <circle cx="10" cy="10" r="2.5" fill="white" stroke="#1a1a1a" strokeWidth="1.5"/>
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────
export default function EggSelector({ isNight, onBack }) {
  // extIndex: position in EXT array. Starts at CLONE (= pokemon[0]).
  const [extIndex, setExtIndexState] = useState(CLONE)
  const extIndexRef = useRef(CLONE)

  const [bubble, setBubble]               = useState(null)
  const [bubbleExiting, setBubbleExiting] = useState(false)
  const [isDealing, setIsDealing]         = useState(true)

  const trackRef    = useRef(null)
  const isMoving    = useRef(false)
  const bubbleTimer = useRef(null)
  const touchStartX = useRef(null)

  // Stable random rotations per EXT position for deal animation
  const dealRotations = useRef(
    EXT.map(() => (Math.random() - 0.5) * 16)
  ).current

  // Holo overlay refs — conditionally attached to current centre card
  const rainbowRef  = useRef(null)
  const specularRef = useRef(null)
  const shineRef    = useRef(null)

  // Keep ref in sync with state
  const setExtIndex = useCallback((val) => {
    const next = typeof val === 'function' ? val(extIndexRef.current) : val
    extIndexRef.current = next
    setExtIndexState(next)
  }, [])

  // Derived active pokemon (0-based index in original array)
  const activeIndex  = ((extIndex - CLONE) % pokemon.length + pokemon.length) % pokemon.length
  const activePokemon = pokemon[activeIndex]

  // track translateX: left: 50% on the track, so translateX centres card at extIndex
  const trackTranslateX = -(extIndex * STEP + CARD_W / 2)

  // ── Navigation ────────────────────────────────────────────
  const navigate = useCallback((targetExtIndex) => {
    if (isMoving.current) return
    isMoving.current = true
    setBubble(null)
    setExtIndex(targetExtIndex)
  }, [setExtIndex])

  const prev = useCallback(() => navigate(extIndexRef.current - 1), [navigate])
  const next = useCallback(() => navigate(extIndexRef.current + 1), [navigate])

  // ── Infinite-loop reset after transition ──────────────────
  const handleTransitionEnd = useCallback((e) => {
    // Only care about the track's own transform transition
    if (e.target !== trackRef.current || e.propertyName !== 'transform') return

    const cur = extIndexRef.current
    let newIdx = null
    if (cur < CLONE)                    newIdx = cur + pokemon.length
    else if (cur >= CLONE + pokemon.length) newIdx = cur - pokemon.length

    if (newIdx !== null) {
      // Disable ALL transitions, jump to the matching real position (visually identical)
      const t = trackRef.current
      t.classList.add(s.noTransition)
      t.style.transition = 'none'
      setExtIndex(newIdx)
      // Re-enable on next paint cycle
      requestAnimationFrame(() => requestAnimationFrame(() => {
        t.classList.remove(s.noTransition)
        t.style.transition = ''
        isMoving.current = false
      }))
    } else {
      isMoving.current = false
    }
  }, [setExtIndex])

  // ── Touch swipe ───────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50)       prev()
    else if (dx < -50) next()
    touchStartX.current = null
  }, [prev, next])

  // ── Holo effects (ref-based, no state) ───────────────────
  const holoMove = useCallback((x, y) => {
    const op = String(0.4 + x * 0.3)
    if (rainbowRef.current) {
      rainbowRef.current.style.background = `linear-gradient(${135 + x * 60}deg, rgba(255,0,128,0.15) 0%, rgba(255,200,0,0.15) 20%, rgba(0,255,128,0.15) 40%, rgba(0,128,255,0.15) 60%, rgba(128,0,255,0.15) 80%, rgba(255,0,128,0.15) 100%)`
      rainbowRef.current.style.opacity    = op
      rainbowRef.current.style.transition = 'none'
    }
    if (specularRef.current) {
      specularRef.current.style.background = `radial-gradient(ellipse at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.25) 0%, transparent 50%)`
      specularRef.current.style.opacity    = op
      specularRef.current.style.transition = 'none'
    }
    if (shineRef.current) {
      shineRef.current.style.background  = `repeating-linear-gradient(${45 + x * 90}deg, transparent 0%, rgba(255,255,255,0.03) 1px, transparent 2px, transparent 4px)`
      shineRef.current.style.opacity     = op
      shineRef.current.style.transition  = 'none'
    }
  }, [])

  const holoLeave = useCallback(() => {
    ;[rainbowRef, specularRef, shineRef].forEach(r => {
      if (r.current) { r.current.style.transition = 'opacity 0.4s ease'; r.current.style.opacity = '0' }
    })
  }, [])

  // ── Bubble ────────────────────────────────────────────────
  const handleCenterEnter = useCallback(() => {
    const text = bubbleTexts[Math.floor(Math.random() * bubbleTexts.length)]
    setBubble({ text }); setBubbleExiting(false)
    clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => {
      setBubbleExiting(true)
      setTimeout(() => { setBubble(null); setBubbleExiting(false) }, 300)
    }, 2000)
  }, [])

  const handleCenterLeave = useCallback(() => {
    clearTimeout(bubbleTimer.current)
    setBubbleExiting(true)
    setTimeout(() => { setBubble(null); setBubbleExiting(false) }, 300)
  }, [])

  // ── Deal animation (lock nav, unlock after cards settle) ──
  useEffect(() => {
    isMoving.current = true
    const timer = setTimeout(() => {
      setIsDealing(false)
      isMoving.current = false
    }, 970)
    return () => clearTimeout(timer)
  }, [])

  // ── Render ────────────────────────────────────────────────
  return (
    <main className={`${s.page} ${isNight ? s.night : s.day}`}>

      <button className={s.back} onClick={onBack}>← Back</button>

      <header className={s.header}>
        <h1 className={s.title}>Choose your companion</h1>
        <p className={s.subtitle}>Gen I · {pokemon.length} Pokémon</p>
      </header>

      {/* Carousel */}
      <div
        className={s.carousel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left arrow */}
        <button className={`${s.navArrow} ${s.navLeft}`} onClick={prev} aria-label="Précédent">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 4L7 10L13 16"/>
          </svg>
        </button>

        {/* Scrolling track */}
        <div
          ref={trackRef}
          className={s.track}
          style={{ transform: `translateX(${trackTranslateX}px) translateY(-50%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {EXT.map((p, i) => {
            const dist     = Math.abs(i - extIndex)
            const isCenter = dist === 0
            const isVisible = dist <= 2
            const scale    = SCALE_BY_DIST[Math.min(dist, 3)]
            const opacity  = OPACITY_BY_DIST[Math.min(dist, 3)]
            const zIdx     = isCenter ? 3 : dist === 1 ? 2 : 1

            const cardButton = (
              <button
                className={[s.card, isCenter ? s.cardCenter : ''].join(' ')}
                style={{ width: '100%', height: '100%' }}
                onClick={!isCenter && isVisible ? () => navigate(i) : undefined}
                onMouseEnter={isCenter ? handleCenterEnter : undefined}
                onMouseLeave={isCenter ? handleCenterLeave : undefined}
                tabIndex={isCenter ? 0 : -1}
              >
                {/* Holo overlays — only on centre card */}
                {isCenter && <>
                  <div ref={rainbowRef}  className={s.holoRainbow}/>
                  <div ref={specularRef} className={s.holoSpecular}/>
                  <div ref={shineRef}    className={s.holoShine}/>
                </>}

                {/* BD bubble */}
                {isCenter && bubble && (
                  <div className={`${s.bubble} ${bubbleExiting ? s.bubbleOut : ''}`} aria-hidden="true">
                    {bubble.text}
                  </div>
                )}

                {/* Card content */}
                {isCenter ? (
                  <div className={s.cardContent}>
                    <span className={s.pokedexNo}>#{p.no}</span>
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`}
                      alt={p.name} className={s.sprite} draggable={false}
                    />
                    <span className={s.name}>{p.name}</span>
                    <div className={s.divider}/>
                    <div className={s.typeBadges}>
                      {p.type.split(' / ').map(t => {
                        const c = TYPE_COLORS[t] ?? '#A8A8A8'
                        return (
                          <span key={t} className={s.typeBadge}
                            style={{ background: c + '22', color: c, border: `1px solid ${c}55` }}>
                            {t}
                          </span>
                        )
                      })}
                    </div>
                    <p className={s.statLine}>{p.size} · {p.weight}</p>
                    <p className={s.temperament}>{p.temperament}</p>
                  </div>
                ) : (
                  <div className={s.cardContentSmall}>
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`}
                      alt={p.name} className={s.spriteSmall} draggable={false}
                    />
                    <span className={s.nameSmall}>{p.name}</span>
                  </div>
                )}
              </button>
            )

            const isDealingCard = isDealing && dist <= 2
            const dealStyle = isDealingCard ? {
              '--deal-x':      `${-(i - extIndex) * STEP}px`,
              '--deal-rotate': `${dealRotations[i]}deg`,
              '--final-scale': scale,
              '--deal-delay':  `${dist * 80}ms`,
            } : {}

            return (
              <div
                key={i}
                className={[s.trackCard, isDealingCard ? s.dealing : ''].filter(Boolean).join(' ')}
                style={{
                  // During dealing the animation handles transform + opacity
                  ...(isDealingCard ? {} : { transform: `scale(${scale})`, opacity }),
                  zIndex:        zIdx,
                  pointerEvents: isVisible ? 'auto' : 'none',
                  ...dealStyle,
                }}
              >
                {isCenter ? (
                  <Card3D onHoloMove={holoMove} onHoloLeave={holoLeave}>
                    {cardButton}
                  </Card3D>
                ) : cardButton}
              </div>
            )
          })}
        </div>

        {/* Right arrow */}
        <button className={`${s.navArrow} ${s.navRight}`} onClick={next} aria-label="Suivant">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4L13 10L7 16"/>
          </svg>
        </button>
      </div>

      {/* CTA */}
      <div className={s.ctaWrap}>
        <button className={s.cta}>
          <Pokeball/>
          Adopt {activePokemon.name}
        </button>
      </div>

    </main>
  )
}
