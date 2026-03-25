import { useState, useRef, useCallback, useEffect } from 'react'
import s from './EggSelector.module.css'
import eggFlame   from '../assets/eggs/egg-flame.png'
import eggOcean   from '../assets/eggs/egg-ocean.png'
import eggForest  from '../assets/eggs/egg-forest.png'
import eggThunder from '../assets/eggs/egg-thunder.png'
import eggMoon    from '../assets/eggs/egg-moon.png'
import eggShadow  from '../assets/eggs/egg-shadow.png'
import eggCrystal from '../assets/eggs/egg-crystal.png'
import eggWild    from '../assets/eggs/egg-wild.png'
import eggMystic  from '../assets/eggs/egg-mystic.png'
import eggMystery from '../assets/eggs/egg-mystery.png'

// ── Egg data ──────────────────────────────────────────────────
const eggs = [
  {
    id: 'flame', name: 'Œuf Flamme', hint: 'Feu & passion', image: eggFlame,
    pool: [{ id: 4, name: 'Salamèche' }, { id: 58, name: 'Caninos' }, { id: 77, name: 'Ponyta' }],
  },
  {
    id: 'ocean', name: 'Œuf Océan', hint: 'Eau & sérénité', image: eggOcean,
    pool: [{ id: 7, name: 'Carapuce' }, { id: 54, name: 'Psykokwak' }, { id: 116, name: 'Hypotrempe' }],
  },
  {
    id: 'forest', name: 'Œuf Forêt', hint: 'Nature & sagesse', image: eggForest,
    pool: [{ id: 1, name: 'Bulbizarre' }, { id: 102, name: 'Noeunoeuf' }],
  },
  {
    id: 'thunder', name: 'Œuf Foudre', hint: 'Énergie & vitesse', image: eggThunder,
    pool: [{ id: 25, name: 'Pikachu' }, { id: 81, name: 'Magnéti' }],
  },
  {
    id: 'moon', name: 'Œuf Lune', hint: 'Douceur & mystère', image: eggMoon,
    pool: [{ id: 35, name: 'Mélofée' }, { id: 39, name: 'Rondoudou' }],
  },
  {
    id: 'shadow', name: 'Œuf Ombre', hint: 'Obscurité & secret', image: eggShadow,
    pool: [{ id: 92, name: 'Fantominus' }, { id: 104, name: 'Osselait' }, { id: 23, name: 'Abo' }],
  },
  {
    id: 'crystal', name: 'Œuf Cristal', hint: 'Intelligence & logique', image: eggCrystal,
    pool: [{ id: 63, name: 'Abra' }, { id: 137, name: 'Porygon' }],
  },
  {
    id: 'wild', name: 'Œuf Sauvage', hint: 'Instinct & liberté', image: eggWild,
    pool: [
      { id: 52, name: 'Miaouss' }, { id: 133, name: 'Évoli' },
      { id: 132, name: 'Métamorph' }, { id: 79, name: 'Ramoloss' }, { id: 143, name: 'Ronflex' },
    ],
  },
  {
    id: 'mystic', name: 'Œuf Mystic', hint: 'Puissance & noblesse', image: eggMystic,
    pool: [{ id: 147, name: 'Minidraco' }, { id: 131, name: 'Lokhlass' }, { id: 115, name: 'Kangourex' }],
  },
  {
    id: 'mystery', name: 'Œuf Mystère', hint: '??? · Surprise totale', image: eggMystery,
    pool: [],
  },
]

// ── Auras élémentaires ────────────────────────────────────────
const eggAuras = {
  flame:   'drop-shadow(0 0 18px rgba(255, 80, 0, 0.7))',
  ocean:   'drop-shadow(0 0 18px rgba(0, 150, 255, 0.7))',
  forest:  'drop-shadow(0 0 18px rgba(50, 180, 50, 0.7))',
  thunder: 'drop-shadow(0 0 18px rgba(255, 220, 0, 0.8))',
  moon:    'drop-shadow(0 0 18px rgba(255, 150, 200, 0.7))',
  shadow:  'drop-shadow(0 0 18px rgba(120, 0, 180, 0.7))',
  crystal: 'drop-shadow(0 0 18px rgba(100, 220, 255, 0.7))',
  wild:    'drop-shadow(0 0 18px rgba(180, 120, 50, 0.6))',
  mystic:  'drop-shadow(0 0 18px rgba(255, 200, 0, 0.8))',
  mystery: 'drop-shadow(0 0 18px rgba(180, 180, 180, 0.5))',
}

function reducedAura(aura) {
  return aura.replace(/rgba\(([^,]+,[^,]+,[^,]+),\s*([\d.]+)\)/, (_, rgb, a) =>
    `rgba(${rgb}, ${(parseFloat(a) * 0.3).toFixed(2)})`)
}

// ── Egg image component ───────────────────────────────────────
function EggShape({ egg, size = 120, animated = false, aura = null }) {
  const style = {
    width: size,
    height: Math.round(size * 1.25),
    objectFit: 'contain',
    flexShrink: 0,
    display: 'block',
    pointerEvents: 'none',
  }
  // Center card: aura baked into crack-glow via CSS var; adjacent: static filter
  if (animated && aura) style['--egg-aura'] = aura
  else if (!animated && aura) style.filter = aura
  return (
    <img
      src={egg.image}
      alt={egg.name}
      className={animated ? s.eggWobble : ''}
      style={style}
      draggable={false}
    />
  )
}

// ── Carousel constants ────────────────────────────────────────
const CLONE = 3
const CARD_W = 300
const GAP    = 16
const STEP   = CARD_W + GAP

const EXT = [...eggs.slice(-CLONE), ...eggs, ...eggs.slice(0, CLONE)]

const SCALE_BY_DIST   = [1, 0.7,  0.533, 0]
const OPACITY_BY_DIST = [1, 0.75, 0.35,  0]

// ── SVG Patterns (kept for potential reuse) ───────────────────
function EggPattern({ pattern }) {
  const cls = s.eggPattern
  switch (pattern) {
    case 'flames':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="white" opacity="0.35">
          <path d="M22 135 Q12 112 22 88 Q30 108 42 94 Q36 120 50 128 Q62 110 54 78 Q72 100 64 135 Z"/>
          <path d="M78 128 Q70 110 78 92 Q85 106 94 96 Q88 118 99 123 Z" opacity="0.7"/>
        </svg>
      )
    case 'waves':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="none" stroke="white" strokeWidth="2.5" opacity="0.35">
          <path d="M5 40 Q20 28 35 40 Q50 52 65 40 Q80 28 95 40 Q110 52 125 40"/>
          <path d="M5 68 Q20 56 35 68 Q50 80 65 68 Q80 56 95 68 Q110 80 125 68"/>
          <path d="M5 96 Q20 84 35 96 Q50 108 65 96 Q80 84 95 96 Q110 108 125 96"/>
          <path d="M5 124 Q20 112 35 124 Q50 136 65 124 Q80 112 95 124 Q110 136 125 124"/>
        </svg>
      )
    case 'dots':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="white" opacity="0.4">
          <circle cx="28" cy="35" r="5.5"/><circle cx="72" cy="28" r="4"/>
          <circle cx="98" cy="58" r="5"/><circle cx="18" cy="75" r="4"/>
          <circle cx="55" cy="72" r="6.5"/><circle cx="92" cy="90" r="4.5"/>
          <circle cx="32" cy="108" r="5"/><circle cx="78" cy="115" r="4"/>
          <circle cx="55" cy="50" r="3.5"/><circle cx="88" cy="42" r="3"/>
          <circle cx="14" cy="52" r="3.5"/><circle cx="65" cy="130" r="3"/>
        </svg>
      )
    case 'zigzag':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="none" stroke="white" strokeWidth="2.5" opacity="0.35" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5,45 22,28 39,45 56,28 73,45 90,28 107,45"/>
          <polyline points="5,75 22,58 39,75 56,58 73,75 90,58 107,75"/>
          <polyline points="5,105 22,88 39,105 56,88 73,105 90,88 107,105"/>
          <polyline points="5,132 22,115 39,132 56,115 73,132 90,115 107,132"/>
        </svg>
      )
    case 'stars':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="white" opacity="0.4">
          {[
            [24, 32, 9], [78, 42, 7], [48, 72, 11],
            [18, 108, 7], [88, 95, 9], [60, 128, 6],
            [96, 58, 5], [38, 52, 5],
          ].map(([cx, cy, r], i) => (
            <path key={i} d={
              `M${cx},${cy-r} L${cx+r*.3},${cy-r*.3} L${cx+r},${cy} ` +
              `L${cx+r*.3},${cy+r*.3} L${cx},${cy+r} ` +
              `L${cx-r*.3},${cy+r*.3} L${cx-r},${cy} L${cx-r*.3},${cy-r*.3} Z`
            }/>
          ))}
        </svg>
      )
    case 'mist':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="white" opacity="0.45">
          <ellipse cx="32" cy="55" rx="28" ry="13" opacity="0.7"/>
          <ellipse cx="88" cy="78" rx="22" ry="11" opacity="0.5"/>
          <ellipse cx="50" cy="108" rx="30" ry="13" opacity="0.6"/>
          <ellipse cx="72" cy="36" rx="20" ry="9"  opacity="0.4"/>
          <ellipse cx="22" cy="92" rx="20" ry="9"  opacity="0.35"/>
          <ellipse cx="95" cy="118" rx="18" ry="8" opacity="0.4"/>
        </svg>
      )
    case 'geometric':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4">
          <polygon points="60,14 82,50 38,50"/>
          <polygon points="16,64 38,100 -6,100"/>
          <polygon points="82,58 104,94 60,94"/>
          <polygon points="38,110 60,146 16,146"/>
          <polygon points="86,110 108,146 64,146"/>
        </svg>
      )
    case 'spots':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="white" opacity="0.38">
          <ellipse cx="26" cy="42" rx="13" ry="11"/>
          <ellipse cx="78" cy="35" rx="10" ry="12"/>
          <ellipse cx="94" cy="72" rx="12" ry="10"/>
          <ellipse cx="18" cy="92" rx="10" ry="11"/>
          <ellipse cx="58" cy="98" rx="15" ry="12"/>
          <ellipse cx="90" cy="118" rx="11" ry="10"/>
          <ellipse cx="38" cy="128" rx="9" ry="10"/>
          <ellipse cx="65" cy="58" rx="8"  ry="9"/>
        </svg>
      )
    case 'scales': {
      const arcPath = (x, y) => `M${x},${y} Q${x+12.5},${y-14} ${x+25},${y}`
      const evenXs = [-8, 17, 42, 67, 92, 117]
      const oddXs  = [5, 30, 55, 80, 105]
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4">
          {[28, 56, 84, 112, 140].map((y, ri) =>
            (ri % 2 === 0 ? evenXs : oddXs).map((x, j) => (
              <path key={`${ri}-${j}`} d={arcPath(x, y)}/>
            ))
          )}
        </svg>
      )
    }
    case 'question':
      return (
        <svg className={cls} viewBox="0 0 120 150" opacity="0.55">
          <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
            fill="white" fontSize="80" fontFamily="Cormorant Garamond, serif"
            fontWeight="300">?</text>
        </svg>
      )
    default:
      return null
  }
}

// ── Card3D (zone-based tilt) ──────────────────────────────────
const ZONES = [
  { rotX:  1, rotY: -1 }, { rotX:  1, rotY:  0 }, { rotX:  1, rotY:  1 },
  { rotX:  0, rotY: -1 },                           { rotX:  0, rotY:  1 },
  { rotX: -1, rotY: -1 }, { rotX: -1, rotY:  0 }, { rotX: -1, rotY:  1 },
]

function zoneStyle(i) {
  const top = i < 3, bot = i > 4
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
        <div key={i} onMouseEnter={() => enter(z.rotX, z.rotY)} style={zoneStyle(i)}/>
      ))}
    </div>
  )
}

// ── Pokeball icon ─────────────────────────────────────────────
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
// All eggs pools merged for mystery egg
const allPools = [
  { id: 4, name: 'Salamèche' }, { id: 58, name: 'Caninos' }, { id: 77, name: 'Ponyta' },
  { id: 7, name: 'Carapuce' }, { id: 54, name: 'Psykokwak' }, { id: 116, name: 'Hypotrempe' },
  { id: 1, name: 'Bulbizarre' }, { id: 102, name: 'Noeunoeuf' },
  { id: 25, name: 'Pikachu' }, { id: 81, name: 'Magnéti' },
  { id: 35, name: 'Mélofée' }, { id: 39, name: 'Rondoudou' },
  { id: 92, name: 'Fantominus' }, { id: 104, name: 'Osselait' }, { id: 23, name: 'Abo' },
  { id: 63, name: 'Abra' }, { id: 137, name: 'Porygon' },
  { id: 52, name: 'Miaouss' }, { id: 133, name: 'Évoli' }, { id: 132, name: 'Métamorph' },
  { id: 79, name: 'Ramoloss' }, { id: 143, name: 'Ronflex' },
  { id: 147, name: 'Minidraco' }, { id: 131, name: 'Lokhlass' }, { id: 115, name: 'Kangourex' },
]

export default function EggSelector({ isNight, onBack, onChoose }) {
  const [extIndex, setExtIndexState] = useState(CLONE)
  const extIndexRef = useRef(CLONE)

  const [bubble, setBubble]           = useState(null)
  const [bubbleExiting, setBubbleExiting] = useState(false)
  const [isDealing, setIsDealing]     = useState(true)

  const trackRef    = useRef(null)
  const isMoving    = useRef(false)
  const isAnimating = useRef(false)
  const bubbleTimer = useRef(null)
  const touchStartX = useRef(null)

  const dealRotations = useRef(EXT.map(() => (Math.random() - 0.5) * 16)).current

  const rainbowRef  = useRef(null)
  const specularRef = useRef(null)
  const shineRef    = useRef(null)

  const setExtIndex = useCallback((val) => {
    const next = typeof val === 'function' ? val(extIndexRef.current) : val
    extIndexRef.current = next
    setExtIndexState(next)
  }, [])

  const activeIndex = ((extIndex - CLONE) % eggs.length + eggs.length) % eggs.length
  const activeEgg   = eggs[activeIndex]

  const trackTranslateX = -(extIndex * STEP + CARD_W / 2)

  // ── Navigation ───────────────────────────────────────────
  const navigate = useCallback((target) => {
    if (isAnimating.current) return
    isAnimating.current = true
    isMoving.current = true
    setBubble(null)
    setExtIndex(target)
    setTimeout(() => { isAnimating.current = false }, 500)
  }, [setExtIndex])

  const prev = useCallback(() => navigate(extIndexRef.current - 1), [navigate])
  const next = useCallback(() => navigate(extIndexRef.current + 1), [navigate])

  // ── Infinite-loop reset ──────────────────────────────────
  const handleTransitionEnd = useCallback((e) => {
    if (e.target !== trackRef.current || e.propertyName !== 'transform') return
    const cur = extIndexRef.current
    let newIdx = null
    if (cur < CLONE)                   newIdx = cur + eggs.length
    else if (cur >= CLONE + eggs.length) newIdx = cur - eggs.length
    if (newIdx !== null) {
      const t = trackRef.current
      t.classList.add(s.noTransition)
      t.style.transition = 'none'
      setExtIndex(newIdx)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        t.classList.remove(s.noTransition)
        t.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        isMoving.current = false
      }))
    } else {
      isMoving.current = false
    }
  }, [setExtIndex])

  // ── Touch swipe ──────────────────────────────────────────
  const handleTouchStart = useCallback((e) => { touchStartX.current = e.touches[0].clientX }, [])
  const handleTouchEnd   = useCallback((e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50) prev(); else if (dx < -50) next()
    touchStartX.current = null
  }, [prev, next])

  // ── Holo effects ─────────────────────────────────────────
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

  // ── Bubble ───────────────────────────────────────────────
  const bubbleTexts = ['！', '♡', '✨', 'Choisis-moi !', 'C\'est moi !', 'やった！']

  const handleCenterEnter = useCallback(() => {
    setBubble({ text: bubbleTexts[Math.floor(Math.random() * bubbleTexts.length)] })
    setBubbleExiting(false)
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

  // ── Deal animation ───────────────────────────────────────
  useEffect(() => {
    isMoving.current = true
    const t = setTimeout(() => { setIsDealing(false); isMoving.current = false }, 970)
    return () => clearTimeout(t)
  }, [])

  // ── Render ───────────────────────────────────────────────
  return (
    <main className={`${s.page} ${isNight ? s.night : s.day}`}>

      <button className={s.back} onClick={onBack}>← Back</button>

      <header className={s.header}>
        <h1 className={s.title}>Choose your egg</h1>
        <p className={s.subtitle}>Your Pokémon is a mystery · Gen I</p>
      </header>

      {/* Carousel */}
      <div className={s.carousel} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

        <button className={`${s.navArrow} ${s.navLeft}`} onClick={prev} aria-label="Précédent">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 4L7 10L13 16"/>
          </svg>
        </button>

        <div
          ref={trackRef}
          className={s.track}
          style={{ transform: `translateX(${trackTranslateX}px) translateY(-50%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {EXT.map((egg, i) => {
            const dist      = Math.abs(i - extIndex)
            const isCenter  = dist === 0
            const isVisible = dist <= 2
            const scale     = SCALE_BY_DIST[Math.min(dist, 3)]
            const opacity   = OPACITY_BY_DIST[Math.min(dist, 3)]
            const zIdx      = isCenter ? 3 : dist === 1 ? 2 : 1

            const isDealingCard = isDealing && dist <= 2
            const dealStyle = isDealingCard ? {
              '--deal-x':      `${-(i - extIndex) * STEP}px`,
              '--deal-rotate': `${dealRotations[i]}deg`,
              '--final-scale': scale,
              '--deal-delay':  `${dist * 80}ms`,
            } : {}

            const cardButton = (
              <button
                className={`${s.card} ${isCenter ? s.cardCenter : ''}`}
                style={{ width: '100%', height: '100%' }}
                onClick={!isCenter && isVisible ? () => navigate(i) : undefined}
                onMouseEnter={isCenter ? handleCenterEnter : undefined}
                onMouseLeave={isCenter ? handleCenterLeave : undefined}
                tabIndex={isCenter ? 0 : -1}
              >
                {isCenter && <>
                  <div ref={rainbowRef}  className={s.holoRainbow}/>
                  <div ref={specularRef} className={s.holoSpecular}/>
                  <div ref={shineRef}    className={s.holoShine}/>
                </>}

                {isCenter && bubble && (
                  <div className={`${s.bubble} ${bubbleExiting ? s.bubbleOut : ''}`} aria-hidden="true">
                    {bubble.text}
                  </div>
                )}

                {isCenter ? (
                  <div className={s.cardContent}>
                    <EggShape egg={egg} size={94} animated aura={eggAuras[egg.id]}/>
                    <span className={s.eggName}>{egg.name}</span>
                    <span className={s.eggHint}>{egg.hint}</span>
                    <span className={s.poolCount}>
                      {egg.pool.length === 0 ? '∞' : egg.pool.length} Pokémon possibles
                    </span>
                    <div className={s.silhouettes}>
                      {egg.pool.length > 0
                        ? egg.pool.map(p => (
                            <img
                              key={p.id}
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`}
                              alt=""
                              className={s.silhouetteSprite}
                              draggable={false}
                            />
                          ))
                        : <span className={s.mysteryHint}>· · · · ·</span>
                      }
                    </div>
                  </div>
                ) : (
                  <div className={s.cardContentSmall}>
                    <EggShape egg={egg} size={70} aura={reducedAura(eggAuras[egg.id])}/>
                    <span className={s.eggNameSmall}>{egg.name}</span>
                  </div>
                )}
              </button>
            )

            return (
              <div
                key={i}
                className={[s.trackCard, isDealingCard ? s.dealing : ''].filter(Boolean).join(' ')}
                style={{
                  ...(isDealingCard ? {} : { transform: `scale(${scale})`, opacity }),
                  zIndex: zIdx,
                  pointerEvents: isVisible ? 'auto' : 'none',
                  ...dealStyle,
                }}
              >
                {isCenter
                  ? <Card3D onHoloMove={holoMove} onHoloLeave={holoLeave}>{cardButton}</Card3D>
                  : cardButton
                }
              </div>
            )
          })}
        </div>

        <button className={`${s.navArrow} ${s.navRight}`} onClick={next} aria-label="Suivant">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4L13 10L7 16"/>
          </svg>
        </button>

      </div>

      {/* CTA */}
      <div className={s.ctaWrap}>
        <button className={s.cta} onClick={() => {
          const pool = activeEgg.pool.length > 0 ? activeEgg.pool : allPools
          const pokemon = pool[Math.floor(Math.random() * pool.length)]
          onChoose?.(activeEgg, pokemon)
        }}>
          <EggShape egg={activeEgg} size={22}/>
          Choisir l'{activeEgg.name} →
        </button>
      </div>

    </main>
  )
}
