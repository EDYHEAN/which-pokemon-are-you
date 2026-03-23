import { useState, useEffect, useRef, useCallback } from 'react'
import s from './PokemonHome.module.css'
import { GAME_CONFIG, STORAGE_KEY, freshStats, recalcStats, tickStats } from '../config/gameConfig'

// ── SVG Icons ─────────────────────────────────────────────────
function IconFork() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  )
}

function IconDrop() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6 8 4 13 4 16a8 8 0 0 0 16 0c0-3-2-8-8-14z"/>
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function IconExclaim() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="14"/>
      <circle cx="12" cy="18.5" r="1" fill="currentColor" strokeWidth="0"/>
    </svg>
  )
}

// ── Confetti ──────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
const CONFETTI_PIECES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left: `${Math.random() * 100}%`,
  top:  `${40 + Math.random() * 30}%`,
  rot:  `${(Math.random() - 0.5) * 720}deg`,
  delay: `${Math.random() * 400}ms`,
}))

function LevelUpCelebration({ level }) {
  return (
    <>
      <div className={s.levelUpBanner}>Niveau {level} !</div>
      <div className={s.confetti}>
        {CONFETTI_PIECES.map(p => (
          <div
            key={p.id}
            className={s.confettiPiece}
            style={{
              left:       p.left,
              top:        p.top,
              background: p.color,
              '--rot':    p.rot,
              '--delay':  p.delay,
            }}
          />
        ))}
      </div>
    </>
  )
}

// ── Colour helpers ────────────────────────────────────────────
function needColor(val) {
  if (val > 60) return '#4CAF50'
  if (val > 30) return '#FF9800'
  return '#FF4444'
}

// ── localStorage helpers ──────────────────────────────────────
function loadSave(pokemon) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const save = JSON.parse(raw)
    // Only reuse save if same pokemon
    if (save.pokemon?.id !== pokemon.id) return null
    return save
  } catch {
    return null
  }
}

function writeSave(pokemon, stats, xp, level) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      pokemon:   { id: pokemon.id, name: pokemon.name },
      stats,
      xp,
      level,
      lastSaved: Date.now(),
    }))
  } catch { /* ignore quota errors */ }
}

// ── Main component ────────────────────────────────────────────
export default function PokemonHome({ pokemon }) {
  const [stats,        setStats]        = useState(null)
  const [xp,           setXp]           = useState(0)
  const [level,        setLevel]        = useState(1)
  const [showLevelUp,  setShowLevelUp]  = useState(false)

  const statsRef = useRef(null)
  const xpRef    = useRef(0)
  const levelRef = useRef(1)

  // ── Init: load & recalculate ──────────────────────────────
  useEffect(() => {
    const save = loadSave(pokemon)
    let initStats, initXp, initLevel

    if (save) {
      const elapsed = Date.now() - save.lastSaved
      initStats = recalcStats(save.stats, elapsed)
      initXp    = save.xp    ?? 0
      initLevel = save.level ?? 1
    } else {
      initStats = freshStats()
      initXp    = 0
      initLevel = 1
    }

    setStats(initStats)
    setXp(initXp)
    setLevel(initLevel)
    statsRef.current = initStats
    xpRef.current    = initXp
    levelRef.current = initLevel
  }, [pokemon])

  // ── Tick every 60s ───────────────────────────────────────
  useEffect(() => {
    if (!stats) return

    const interval = setInterval(() => {
      setStats(prev => {
        const next = tickStats(prev)
        statsRef.current = next
        writeSave(pokemon, next, xpRef.current, levelRef.current)
        return next
      })
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [!!stats, pokemon])

  // ── Action handler ───────────────────────────────────────
  const handleAction = useCallback((statKey) => {
    setStats(prev => {
      if (!prev) return prev
      const next = { ...prev, [statKey]: GAME_CONFIG[statKey].max }
      statsRef.current = next

      // XP
      const newXp = xpRef.current + GAME_CONFIG.xp.perAction
      xpRef.current = newXp
      setXp(newXp)

      // Level up?
      if (newXp >= GAME_CONFIG.xp.evolutionThreshold) {
        const newLevel = levelRef.current + 1
        levelRef.current = newLevel
        setLevel(newLevel)
        xpRef.current = 0
        setXp(0)
        setShowLevelUp(true)
        setTimeout(() => setShowLevelUp(false), 1600)
      }

      writeSave(pokemon, next, xpRef.current, levelRef.current)
      return next
    })
  }, [pokemon])

  if (!stats) return null

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`
  const T = GAME_CONFIG.alertThreshold

  // Alerts for needs ≤ threshold
  const alerts = [
    { key: 'hunger',        icon: <IconFork/>,    show: stats.hunger        <= T },
    { key: 'thirst',        icon: <IconDrop/>,    show: stats.thirst        <= T },
    { key: 'entertainment', icon: <IconStar/>,    show: stats.entertainment <= T },
    { key: 'toilet',        icon: <IconExclaim/>, show: stats.toilet        <= T },
  ].filter(a => a.show)

  const xpPct = Math.round((xp / GAME_CONFIG.xp.evolutionThreshold) * 100)

  return (
    <div className={s.page}>

      {/* ── Habitat ── */}
      <div className={s.habitat}>
        <div className={s.ground}/>

        {alerts.length > 0 && (
          <div className={s.alerts}>
            {alerts.map(a => (
              <div key={a.key} className={s.alertBubble}>
                {a.icon}
              </div>
            ))}
          </div>
        )}

        <div className={s.pokemonWrap}>
          <img src={spriteUrl} alt={pokemon.name} className={s.pokemonSprite} draggable={false}/>
        </div>
      </div>

      {/* ── Dashboard ── */}
      <div className={s.dashboard}>

        {/* Header */}
        <div className={s.dashHeader}>
          <img src={spriteUrl} alt="" className={s.dashSprite} draggable={false}/>
          <div>
            <p className={s.dashName}>{pokemon.name}</p>
            <p className={s.dashLevel}>Niv. {level}</p>
          </div>
        </div>

        {/* Stats section */}
        <div className={s.section}>
          <p className={s.sectionLabel}>Stats</p>

          {/* Health */}
          <div className={s.statRow}>
            <span className={s.statLabel}>❤ Santé</span>
            <div className={s.statTrack}>
              <div className={s.statFill} style={{ width: `${stats.health}%`, background: '#FF4444' }}/>
            </div>
            <span className={s.statValue}>{Math.round(stats.health)}</span>
          </div>

          {/* Energy */}
          <div className={s.statRow}>
            <span className={s.statLabel}>⚡ Énergie</span>
            <div className={s.statTrack}>
              <div className={s.statFill} style={{ width: `${stats.energy}%`, background: '#FFD700' }}/>
            </div>
            <span className={s.statValue}>{Math.round(stats.energy)}</span>
          </div>

          {/* XP */}
          <div className={s.statRow}>
            <span className={s.statLabel}>✨ XP</span>
            <div className={s.statTrack}>
              <div className={s.statFill} style={{ width: `${xpPct}%`, background: '#9B59B6' }}/>
            </div>
            <span className={s.statValue} style={{ fontSize: 9 }}>
              Niv.{level} {xp}/{GAME_CONFIG.xp.evolutionThreshold}
            </span>
          </div>
        </div>

        {/* Needs section */}
        <div className={s.section}>
          <p className={s.sectionLabel}>Besoins</p>
          <div className={s.needsGrid}>
            {[
              { key: 'hunger',        label: 'Faim',    icon: <IconFork/>    },
              { key: 'thirst',        label: 'Soif',    icon: <IconDrop/>    },
              { key: 'entertainment', label: 'Jeu',     icon: <IconStar/>    },
              { key: 'toilet',        label: 'Toilettes', icon: <IconExclaim/> },
            ].map(({ key, label, icon }) => {
              const val = Math.round(stats[key])
              const color = needColor(val)
              const critical = val <= T
              return (
                <div key={key} className={s.needCard}>
                  <div className={s.needTop}>
                    <span className={s.needIcon} style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {icon}
                      {label}
                    </span>
                    <span className={s.needPct} style={{ color }}>{val}%</span>
                  </div>
                  <div className={s.needTrack}>
                    <div
                      className={`${s.needFill} ${critical ? s.critical : ''}`}
                      style={{ width: `${val}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions section */}
        <div className={s.section}>
          <p className={s.sectionLabel}>Actions</p>
          <div className={s.actionsGrid}>
            {[
              { key: 'hunger',        label: 'Nourrir',   icon: <IconFork/>    },
              { key: 'thirst',        label: 'Hydrater',  icon: <IconDrop/>    },
              { key: 'entertainment', label: 'Jouer',     icon: <IconStar/>    },
              { key: 'toilet',        label: 'Toilettes', icon: <IconExclaim/> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                className={s.actionBtn}
                onClick={() => handleAction(key)}
              >
                {icon}
                <span className={s.actionLabel}>{label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Level-up celebration */}
      {showLevelUp && <LevelUpCelebration level={level}/>}

    </div>
  )
}
