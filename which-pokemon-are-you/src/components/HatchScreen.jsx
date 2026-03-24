import { useState, useEffect, useRef } from 'react'
import s from './HatchScreen.module.css'

// ── Helpers ───────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff},${alpha})`
}

function darkenHex(hex, amount = 40) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, ((n >> 16) & 0xff) - amount)
  const g = Math.max(0, ((n >>  8) & 0xff) - amount)
  const b = Math.max(0, ( n        & 0xff) - amount)
  return `rgb(${r},${g},${b})`
}

// ── EggPattern (copied from EggSelector) ──────────────────────
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
        </svg>
      )
    case 'zigzag':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="none" stroke="white" strokeWidth="2.5" opacity="0.35" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5,45 22,28 39,45 56,28 73,45 90,28 107,45"/>
          <polyline points="5,75 22,58 39,75 56,58 73,75 90,58 107,75"/>
          <polyline points="5,105 22,88 39,105 56,88 73,105 90,88 107,105"/>
        </svg>
      )
    case 'stars':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="white" opacity="0.4">
          {[[24,32,9],[78,42,7],[48,72,11],[18,108,7],[88,95,9],[60,128,6]].map(([cx,cy,r],i) => (
            <path key={i} d={`M${cx},${cy-r} L${cx+r*.3},${cy-r*.3} L${cx+r},${cy} L${cx+r*.3},${cy+r*.3} L${cx},${cy+r} L${cx-r*.3},${cy+r*.3} L${cx-r},${cy} L${cx-r*.3},${cy-r*.3} Z`}/>
          ))}
        </svg>
      )
    case 'mist':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="white" opacity="0.45">
          <ellipse cx="32" cy="55" rx="28" ry="13" opacity="0.7"/>
          <ellipse cx="88" cy="78" rx="22" ry="11" opacity="0.5"/>
          <ellipse cx="50" cy="108" rx="30" ry="13" opacity="0.6"/>
        </svg>
      )
    case 'geometric':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4">
          <polygon points="60,14 82,50 38,50"/>
          <polygon points="16,64 38,100 -6,100"/>
          <polygon points="82,58 104,94 60,94"/>
        </svg>
      )
    case 'spots':
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="white" opacity="0.38">
          <ellipse cx="26" cy="42" rx="13" ry="11"/>
          <ellipse cx="78" cy="35" rx="10" ry="12"/>
          <ellipse cx="58" cy="98" rx="15" ry="12"/>
          <ellipse cx="90" cy="118" rx="11" ry="10"/>
        </svg>
      )
    case 'scales': {
      const arcPath = (x, y) => `M${x},${y} Q${x+12.5},${y-14} ${x+25},${y}`
      return (
        <svg className={cls} viewBox="0 0 120 150" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4">
          {[28,56,84,112].map((y, ri) =>
            (ri%2===0 ? [-8,17,42,67,92,117] : [5,30,55,80,105]).map((x, j) => (
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
            fill="white" fontSize="80" fontFamily="Cormorant Garamond, serif" fontWeight="300">?</text>
        </svg>
      )
    default: return null
  }
}

// ── EggShape ──────────────────────────────────────────────────
function EggShape({ egg, size, className }) {
  const h = Math.round(size * 1.25)
  return (
    <div
      className={`${s.eggShape} ${className || ''}`}
      style={{
        width:      size,
        height:     h,
        background: `linear-gradient(145deg, ${egg.color2} 0%, ${egg.color1} 60%, ${darkenHex(egg.color1)} 100%)`,
        boxShadow:  `0 8px 32px ${hexToRgba(egg.color1, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.4)`,
        border:     '1px solid rgba(255,255,255,0.3)',
        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        position:   'relative',
        overflow:   'hidden',
        flexShrink: 0,
      }}
    >
      <EggPattern pattern={egg.pattern}/>
    </div>
  )
}

// ── Crack SVG ─────────────────────────────────────────────────
function Cracks() {
  return (
    <svg className={s.cracks} viewBox="0 0 240 300" fill="none"
      stroke="white" strokeWidth="1.5" strokeLinecap="round">
      {/* crack 1 — top left */}
      <path className={s.crack1} d="M95 60 L80 88 L92 95 L75 130" opacity="0"/>
      {/* crack 2 — right side */}
      <path className={s.crack2} d="M155 90 L168 115 L155 122 L165 155" opacity="0"/>
      {/* crack 3 — bottom */}
      <path className={s.crack3} d="M110 200 L120 178 L130 185 L140 165" opacity="0"/>
    </svg>
  )
}

// ── Burst particles ───────────────────────────────────────────
const PARTICLE_CONFIGS = [
  { px: '-80px', py: '-60px', delay: '0ms',   color: '#FFD700' },
  { px: '80px',  py: '-70px', delay: '60ms',  color: '#FF8C00' },
  { px: '-90px', py: '20px',  delay: '120ms', color: '#FFD700' },
  { px: '90px',  py: '30px',  delay: '80ms',  color: '#FFF44F' },
  { px: '-50px', py: '90px',  delay: '40ms',  color: '#FF8C00' },
  { px: '60px',  py: '85px',  delay: '100ms', color: '#FFD700' },
  { px: '-20px', py: '-95px', delay: '20ms',  color: '#FFF44F' },
  { px: '30px',  py: '-90px', delay: '140ms', color: '#FFD700' },
  { px: '100px', py: '-30px', delay: '50ms',  color: '#FF8C00' },
  { px: '-100px',py: '-10px', delay: '90ms',  color: '#FFF44F' },
  { px: '-70px', py: '-80px', delay: '30ms',  color: '#FFD700' },
  { px: '70px',  py: '-75px', delay: '110ms', color: '#FF8C00' },
]

function BurstParticles() {
  return (
    <div className={s.particles}>
      {PARTICLE_CONFIGS.map((p, i) => (
        <div
          key={i}
          className={s.particle}
          style={{
            '--px':   p.px,
            '--py':   p.py,
            '--delay': p.delay,
            background: p.color,
          }}
        />
      ))}
    </div>
  )
}

// ── Orbit particles ───────────────────────────────────────────
const ORBIT_DOTS = [
  { angle: '0deg',    radius: '110px', color: '#FFD700', duration: '2s',   size: 7 },
  { angle: '60deg',   radius: '115px', color: '#FF8C00', duration: '2.5s', size: 5 },
  { angle: '120deg',  radius: '108px', color: '#FFF44F', duration: '1.8s', size: 6 },
  { angle: '180deg',  radius: '112px', color: '#FFD700', duration: '2.2s', size: 4 },
  { angle: '240deg',  radius: '116px', color: '#FF8C00', duration: '2.8s', size: 6 },
  { angle: '300deg',  radius: '109px', color: '#FFF44F', duration: '2.1s', size: 5 },
]

function OrbitRing() {
  return (
    <div className={s.orbitRing}>
      {ORBIT_DOTS.map((d, i) => (
        <div
          key={i}
          className={s.orbitDot}
          style={{
            '--start-angle': d.angle,
            '--radius':      d.radius,
            background:      d.color,
            width:           d.size,
            height:          d.size,
            animationDuration: d.duration,
            boxShadow: `0 0 6px ${d.color}`,
          }}
        />
      ))}
    </div>
  )
}

// ── Shiny particle configs — generated once ───────────────────
function makeShinyParticles() {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: 4 + Math.random() * 4,
    tx: `${Math.round((Math.random() - 0.5) * 400)}px`,
    ty: `${Math.round((Math.random() - 0.5) * 400)}px`,
    delay: `${(Math.random() * 0.8).toFixed(2)}s`,
    dur: `${(1.2 + Math.random() * 0.6).toFixed(2)}s`,
  }))
}

// ── Phrases ───────────────────────────────────────────────────
const PHRASES = [
  "Un aventurier dans l'âme.",
  "Discret mais redoutable.",
  "Doux en apparence, surprenant en vérité.",
  "Une énergie débordante t'attend.",
  "Le destin a bien fait les choses.",
  "Rare et précieux — prends-en soin.",
]

// ── Main component ────────────────────────────────────────────
// phase: 'shaking' | 'exploding' | 'flash' | 'silhouette' | 'revealing' | 'result'
export default function HatchScreen({ egg, pokemon, isNight, onRestart, onConfirm }) {
  const [phase, setPhase]           = useState('shaking')
  const [flashClass, setFlashClass] = useState(s.flashIn)
  const [filterStyle, setFilterStyle] = useState({ filter: 'brightness(0)' })
  const [customName, setCustomName] = useState('')
  const phrase         = useRef(PHRASES[Math.floor(Math.random() * PHRASES.length)]).current
  const isShiny        = useRef(Math.random() < 0.01).current
  const shinyParticles = useRef(makeShinyParticles()).current

  useEffect(() => {
    let timers = []

    // Phase 1 — shaking 2s
    timers.push(setTimeout(() => {
      setPhase('exploding')
    }, 2000))

    // Phase 2 — explosion 0.5s → flash
    timers.push(setTimeout(() => {
      setPhase('flash')
      setFlashClass(s.flashIn)
    }, 2500))

    // Flash holds for 0.3s then fade out, silhouette appears
    timers.push(setTimeout(() => {
      setPhase('silhouette')
      setFlashClass(s.flashOut)
    }, 2800))

    // Phase 3 — silhouette 2s
    timers.push(setTimeout(() => {
      setPhase('revealing')
      // Trigger CSS filter transition via inline style
      requestAnimationFrame(() => {
        setFilterStyle({ filter: 'brightness(1)', transition: 'filter 1s ease-in' })
      })
    }, 4800))

    // Phase 4 → result after reveal finishes
    timers.push(setTimeout(() => {
      setPhase('result')
    }, 5900))

    return () => timers.forEach(clearTimeout)
  }, [])

  const spriteUrl = isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemon.id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`

  return (
    <div className={`${s.page} ${isNight ? s.night : s.day}`}>

      {/* Flash overlay — gold if shiny */}
      {(phase === 'flash' || phase === 'silhouette') && (
        <div
          className={`${s.flash} ${flashClass}`}
          style={isShiny ? { background: 'rgba(255,215,0,0.9)' } : {}}
        />
      )}

      <div className={s.stage}>

        {/* ── SHAKING phase ── */}
        {phase === 'shaking' && (
          <>
            <div className={s.eggWrap}>
              <EggShape egg={egg} size={200} className={s.eggShaking}/>
              <Cracks/>
              <BurstParticles/>
            </div>
          </>
        )}

        {/* ── EXPLODING phase ── */}
        {phase === 'exploding' && (
          <div className={s.eggWrap}>
            <EggShape egg={egg} size={200} className={s.eggExploding}/>
          </div>
        )}

        {/* ── SILHOUETTE phase ── */}
        {(phase === 'silhouette' || phase === 'revealing') && (
          <>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {phase === 'silhouette' && <OrbitRing/>}
              <img
                src={spriteUrl}
                alt={pokemon.name}
                className={`${s.sprite} ${phase === 'silhouette' ? s.spriteSilhouette : s.spriteRevealing}`}
                style={phase === 'revealing' ? filterStyle : {}}
              />
            </div>
            <p className={s.mystery}>???</p>
          </>
        )}

        {/* ── RESULT phase ── */}
        {phase === 'result' && (
          <>
            <div style={{ position: 'relative' }}>
              <img
                src={spriteUrl}
                alt={pokemon.name}
                className={`${s.sprite} ${s.spriteResult}`}
                style={isShiny ? { filter: 'drop-shadow(0 0 16px rgba(255,215,0,0.7))' } : {}}
              />
              {/* Shiny particle rain */}
              {isShiny && (
                <div className={s.shinyParticles}>
                  {shinyParticles.map(p => (
                    <div
                      key={p.id}
                      className={s.shinyParticle}
                      style={{
                        width:  p.size,
                        height: p.size,
                        marginLeft: -(p.size / 2),
                        marginTop:  -(p.size / 2),
                        '--tx':    p.tx,
                        '--ty':    p.ty,
                        '--delay': p.delay,
                        '--dur':   p.dur,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {isShiny && <p className={s.shinyLabel}>✨ SHINY !</p>}
            <p className={s.pokemonName}>{pokemon.name}</p>
            <p className={s.pokemonPhrase}>{phrase}</p>
            <p className={s.nicknameLabel}>Donnez-lui un surnom</p>
            <input
              className={s.nameInput}
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Laisser tel quel..."
              maxLength={24}
              spellCheck={false}
            />
            <div className={s.ctaWrap}>
              <button className={s.cta} onClick={() => onConfirm(customName || pokemon.name, isShiny)}>
                <img src={spriteUrl} alt="" className={s.ctaSprite}/>
                Go m'occuper de {customName || pokemon.name} →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
