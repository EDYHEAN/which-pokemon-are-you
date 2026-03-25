import { useState, useEffect, useRef } from 'react'
import s from './HatchScreen.module.css'

// ── EggShape ──────────────────────────────────────────────────
function EggShape({ egg, size, className }) {
  console.log('[HatchScreen] EggShape received egg:', egg)
  if (!egg?.image) {
    console.warn('[HatchScreen] egg.image is undefined — rendering fallback')
    return <div style={{ width: size, height: Math.round(size * 1.25), background: '#ccc', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}/>
  }
  return (
    <img
      src={egg.image}
      alt={egg.name || 'egg'}
      className={`${s.eggShape} ${className || ''}`}
      style={{ width: size, height: Math.round(size * 1.25), objectFit: 'contain' }}
      draggable={false}
    />
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
