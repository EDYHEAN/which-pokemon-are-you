import { useState, useEffect, useRef, useCallback } from 'react'
import s from './PokemonHome.module.css'
import { GAME_CONFIG, STORAGE_KEY, freshStats, recalcStats, tickStats, LEVEL_REWARDS, addToInventory } from '../config/gameConfig'
import LevelUpOverlay from './LevelUpOverlay'

// ── SVG Icons — pixel art style ───────────────────────────────
function IconFork() {
  return (
    <svg width="16" height="16" viewBox="0 0 8 8" fill="currentColor">
      <rect x="1" y="0" width="1" height="4"/>
      <rect x="3" y="0" width="1" height="4"/>
      <rect x="5" y="0" width="1" height="4"/>
      <rect x="1" y="4" width="5" height="1"/>
      <rect x="3" y="5" width="1" height="3"/>
    </svg>
  )
}

function IconDrop() {
  return (
    <svg width="16" height="16" viewBox="0 0 8 8" fill="currentColor">
      <rect x="3" y="0" width="2" height="1"/>
      <rect x="2" y="1" width="4" height="1"/>
      <rect x="1" y="2" width="6" height="3"/>
      <rect x="2" y="5" width="4" height="1"/>
      <rect x="3" y="6" width="2" height="1"/>
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 8 8" fill="currentColor">
      <rect x="3" y="0" width="2" height="2"/>
      <rect x="0" y="2" width="8" height="2"/>
      <rect x="1" y="4" width="6" height="2"/>
      <rect x="0" y="6" width="3" height="2"/>
      <rect x="5" y="6" width="3" height="2"/>
    </svg>
  )
}

function IconExclaim() {
  return (
    <svg width="16" height="16" viewBox="0 0 8 8" fill="currentColor">
      <rect x="3" y="0" width="2" height="5"/>
      <rect x="3" y="6" width="2" height="2"/>
    </svg>
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

// ── Scene configs ─────────────────────────────────────────────
const SCENES = [
  {
    bg:     'linear-gradient(180deg, #87CEEB 0%, #98D8C8 60%, #4a7c3f 100%)',
    ground: 'linear-gradient(180deg, #4a7c3f 0%, #3a6a2f 100%)',
  },
  {
    bg:     'linear-gradient(180deg, #2d5a1b 0%, #1a3a0f 100%)',
    ground: 'linear-gradient(180deg, #1a3a0f 0%, #0f2408 100%)',
  },
  {
    bg:     'linear-gradient(180deg, #87CEEB 0%, #FFF4C2 70%, #C2A96E 100%)',
    ground: 'linear-gradient(180deg, #C2A96E 0%, #b89a5e 100%)',
  },
]

// ── Scene 0 — Prairie ─────────────────────────────────────────
function ScenePrairie() {
  return (
    <>
      {/* Tree left */}
      <div style={{ position:'absolute', left:'6%', bottom:'26%', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:52, height:52, background:'#4a9e3a', borderRadius:'50%', marginBottom:-16, flexShrink:0 }}/>
        <div style={{ width:12, height:44, background:'#7a5225', borderRadius:'3px 3px 0 0', flexShrink:0 }}/>
      </div>
      {/* Tree right large */}
      <div style={{ position:'absolute', right:'7%', bottom:'26%', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:72, height:72, background:'#3d8c30', borderRadius:'50%', marginBottom:-22, flexShrink:0 }}/>
        <div style={{ width:16, height:60, background:'#6b4520', borderRadius:'3px 3px 0 0', flexShrink:0 }}/>
      </div>
      {/* Tree far right small */}
      <div style={{ position:'absolute', right:'1%', bottom:'26%', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:38, height:38, background:'#5aa840', borderRadius:'50%', marginBottom:-12, flexShrink:0 }}/>
        <div style={{ width:10, height:30, background:'#7a5225', borderRadius:'3px 3px 0 0', flexShrink:0 }}/>
      </div>
      {/* Grass tufts left */}
      <div style={{ position:'absolute', left:'26%', bottom:'26%', zIndex:1, display:'flex', alignItems:'flex-end', gap:3 }}>
        {[10, 14, 11, 13, 9].map((h, i) => (
          <div key={i} style={{ width:4, height:h, background:'#4a9e3a', borderRadius:'3px 3px 0 0' }}/>
        ))}
      </div>
      {/* Grass tufts right */}
      <div style={{ position:'absolute', left:'58%', bottom:'26%', zIndex:1, display:'flex', alignItems:'flex-end', gap:3 }}>
        {[8, 12, 9, 11].map((h, i) => (
          <div key={i} style={{ width:4, height:h, background:'#5aa840', borderRadius:'3px 3px 0 0' }}/>
        ))}
      </div>
      {/* Rock */}
      <div style={{ position:'absolute', left:'38%', bottom:'27%', zIndex:1 }}>
        <div style={{ width:32, height:20, background:'#9a9a9a', borderRadius:'50%', position:'relative' }}>
          <div style={{ position:'absolute', top:3, left:5, width:10, height:5, background:'rgba(255,255,255,0.25)', borderRadius:'50%' }}/>
        </div>
      </div>
    </>
  )
}

// ── Scene 1 — Forêt ───────────────────────────────────────────
function SceneForest() {
  return (
    <>
      {/* Light rays */}
      {[6, 24, 52, 72, 90].map((left, i) => (
        <div key={i} style={{
          position:'absolute', top:0, left:`${left}%`,
          width:18 + i * 3, height:'75%',
          background:'linear-gradient(180deg, rgba(255,255,180,0.07) 0%, transparent 100%)',
          transform:'skewX(-12deg)',
          zIndex:1, pointerEvents:'none',
        }}/>
      ))}
      {/* Tree far left */}
      <div style={{ position:'absolute', left:'-3%', bottom:'26%', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:80, height:120, background:'#1f4a14', borderRadius:'40% 40% 10% 10%', marginBottom:-28, flexShrink:0 }}/>
        <div style={{ width:20, height:100, background:'#1a3a0f', flexShrink:0 }}/>
      </div>
      {/* Tree far right */}
      <div style={{ position:'absolute', right:'-3%', bottom:'26%', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:90, height:130, background:'#1a3f10', borderRadius:'40% 40% 10% 10%', marginBottom:-32, flexShrink:0 }}/>
        <div style={{ width:22, height:120, background:'#162e0a', flexShrink:0 }}/>
      </div>
      {/* Tree mid left */}
      <div style={{ position:'absolute', left:'14%', bottom:'26%', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:60, height:90, background:'#254d14', borderRadius:'40% 40% 10% 10%', marginBottom:-22, flexShrink:0 }}/>
        <div style={{ width:14, height:80, background:'#1e4210', flexShrink:0 }}/>
      </div>
      {/* Tree mid right */}
      <div style={{ position:'absolute', right:'17%', bottom:'26%', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:64, height:100, background:'#204818', borderRadius:'40% 40% 10% 10%', marginBottom:-24, flexShrink:0 }}/>
        <div style={{ width:16, height:88, background:'#192e0a', flexShrink:0 }}/>
      </div>
      {/* Mushroom left */}
      <div style={{ position:'absolute', left:'28%', bottom:'26%', zIndex:1 }}>
        <div style={{ width:6, height:10, background:'#E8D5B7', margin:'0 auto', borderRadius:'1px 1px 0 0' }}/>
        <div style={{ width:18, height:11, background:'#CC2222', borderRadius:'50% 50% 20% 20%', marginTop:-5, marginLeft:-6, position:'relative' }}>
          <div style={{ position:'absolute', top:2, left:3, width:4, height:4, background:'rgba(255,255,255,0.85)', borderRadius:'50%' }}/>
          <div style={{ position:'absolute', top:5, left:10, width:3, height:3, background:'rgba(255,255,255,0.85)', borderRadius:'50%' }}/>
        </div>
      </div>
      {/* Mushroom right small */}
      <div style={{ position:'absolute', right:'30%', bottom:'26%', zIndex:1 }}>
        <div style={{ width:5, height:8, background:'#E8D5B7', margin:'0 auto', borderRadius:'1px 1px 0 0' }}/>
        <div style={{ width:14, height:9, background:'#CC2222', borderRadius:'50% 50% 20% 20%', marginTop:-4, marginLeft:-5, position:'relative' }}>
          <div style={{ position:'absolute', top:2, left:3, width:3, height:3, background:'rgba(255,255,255,0.85)', borderRadius:'50%' }}/>
        </div>
      </div>
      {/* Mossy rock */}
      <div style={{ position:'absolute', left:'43%', bottom:'27%', zIndex:1 }}>
        <div style={{ width:38, height:24, background:'#777', borderRadius:'50%', position:'relative' }}>
          <div style={{ position:'absolute', top:2, left:3, width:32, height:18, background:'rgba(50,120,50,0.4)', borderRadius:'50%' }}/>
          <div style={{ position:'absolute', top:3, left:7, width:8, height:4, background:'rgba(255,255,255,0.14)', borderRadius:'50%' }}/>
        </div>
      </div>
    </>
  )
}

// ── Scene 2 — Plage ───────────────────────────────────────────
function SceneBeach() {
  return (
    <>
      {/* Waves */}
      <div className={s.wave}>
        <svg viewBox="0 0 860 44" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
          <path d="M0 22 Q108 6 215 22 Q322 38 430 22 Q538 6 645 22 Q752 38 860 22 L860 44 L0 44 Z" fill="rgba(100,180,255,0.55)"/>
          <path d="M0 28 Q108 18 215 28 Q322 38 430 28 Q538 18 645 28 Q752 38 860 28 L860 44 L0 44 Z" fill="rgba(160,220,255,0.3)"/>
        </svg>
      </div>
      {/* Palm tree */}
      <div style={{ position:'absolute', right:'5%', bottom:'26%', zIndex:1 }}>
        {[
          { rotate:-45, top:-28, left:-34 },
          { rotate:-20, top:-32, left:-20 },
          { rotate:5,   top:-35, left:-6  },
          { rotate:28,  top:-30, left:4   },
          { rotate:50,  top:-22, left:10  },
        ].map((leaf, i) => (
          <div key={i} style={{
            position:'absolute', top:leaf.top, left:leaf.left,
            width:46, height:11,
            background:'linear-gradient(90deg, #2d7a22, #4a9e3a)',
            borderRadius:'0 50% 50% 0',
            transform:`rotate(${leaf.rotate}deg)`,
            transformOrigin:'left center',
          }}/>
        ))}
        <div style={{ width:10, height:68, background:'linear-gradient(180deg, #8B6340, #6B4820)', borderRadius:5, transform:'rotate(4deg)', transformOrigin:'bottom center', margin:'0 auto' }}/>
      </div>
      {/* Shells */}
      {[[22,27],[42,27],[58,26]].map(([left, bottom], i) => (
        <div key={i} style={{
          position:'absolute', left:`${left}%`, bottom:`${bottom}%`,
          width:11, height:7, background:'#D4A574',
          borderRadius:'50% 50% 30% 30%', zIndex:1,
          border:'1px solid rgba(139,90,43,0.3)',
          boxShadow:'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}/>
      ))}
    </>
  )
}

// ── Tap reactions ─────────────────────────────────────────────
const REACTIONS = [
  { emoji: '♡', text: '!' },
  { emoji: '⭐', text: '...' },
  { emoji: '💤', text: 'Zzz' },
  { emoji: '✨', text: '!' },
  { emoji: '？', text: 'Hm?' },
  { emoji: '♪', text: '~' },
]

// ── Auto bubble messages ──────────────────────────────────────
const NEED_MESSAGES = {
  hunger:        { emoji: '🍖', text: 'J\'ai faim !' },
  thirst:        { emoji: '💧', text: 'J\'ai soif !' },
  entertainment: { emoji: '⭐', text: 'Je m\'ennuie !' },
  toilet:        { emoji: '🚽', text: 'Urgence !' },
}

const GENERIC_MESSAGES = [
  { emoji: '♡', text: 'Coucou !' },
  { emoji: '✨', text: 'Je t\'aime !' },
  { emoji: '🌟', text: 'On joue ?' },
  { emoji: '😊', text: 'Hehe~' },
  { emoji: '💤', text: 'Zzzz...' },
  { emoji: '🎵', text: 'La la la~' },
]

// ── Main component ────────────────────────────────────────────
export default function PokemonHome({ pokemon, isNight }) {
  const [stats,        setStats]        = useState(null)
  const [xp,           setXp]           = useState(0)
  const [level,        setLevel]        = useState(1)
  const [levelUpData,  setLevelUpData]  = useState(null) // { level, reward }
  const [bubble,       setBubble]       = useState(null)

  const statsRef    = useRef(null)
  const xpRef       = useRef(0)
  const levelRef    = useRef(1)
  const bubbleRef   = useRef(null)
  const bubbleTimer = useRef(null)
  const scene       = useRef(Math.floor(Math.random() * 3)).current

  // ── Init ──────────────────────────────────────────────────
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

  // ── Stats update listener (from BagScreen item use) ───────
  useEffect(() => {
    const handler = () => {
      try {
        const save = JSON.parse(localStorage.getItem(STORAGE_KEY))
        if (save?.pokemon?.id === pokemon.id) {
          setStats(save.stats)
          statsRef.current = save.stats
          if (save.xp !== undefined) { setXp(save.xp); xpRef.current = save.xp }
        }
      } catch {}
    }
    window.addEventListener('poketama-stats-update', handler)
    return () => window.removeEventListener('poketama-stats-update', handler)
  }, [pokemon])

  // ── Auto bubble every 20s ────────────────────────────────
  useEffect(() => {
    if (!stats) return
    const interval = setInterval(() => {
      // Skip if bubble is already visible
      if (bubbleRef.current) return

      const currentStats = statsRef.current
      const T = GAME_CONFIG.alertThreshold

      // Check for needs below threshold
      const needKeys = ['hunger', 'thirst', 'entertainment', 'toilet']
      const urgentNeeds = needKeys.filter(k => currentStats && currentStats[k] <= T)

      let msg
      if (urgentNeeds.length > 0) {
        const key = urgentNeeds[Math.floor(Math.random() * urgentNeeds.length)]
        msg = NEED_MESSAGES[key]
      } else {
        msg = GENERIC_MESSAGES[Math.floor(Math.random() * GENERIC_MESSAGES.length)]
      }

      const bubble = { emoji: msg.emoji, text: msg.text, key: Date.now(), auto: true }
      setBubble(bubble)
      bubbleRef.current = bubble
      clearTimeout(bubbleTimer.current)
      bubbleTimer.current = setTimeout(() => {
        setBubble(null)
        bubbleRef.current = null
      }, 4000)
    }, 20 * 1000)

    return () => clearInterval(interval)
  }, [!!stats])

  // ── Action handler ───────────────────────────────────────
  const handleAction = useCallback((statKey) => {
    setStats(prev => {
      if (!prev) return prev
      const next = { ...prev, [statKey]: GAME_CONFIG[statKey].max }
      statsRef.current = next

      const newXp = xpRef.current + GAME_CONFIG.xp.perAction
      xpRef.current = newXp
      setXp(newXp)

      if (newXp >= GAME_CONFIG.xp.evolutionThreshold) {
        const newLevel = levelRef.current + 1
        levelRef.current = newLevel
        setLevel(newLevel)
        xpRef.current = 0
        setXp(0)

        const reward = LEVEL_REWARDS[newLevel] || null
        if (reward) {
          addToInventory(reward.id, reward.quantity)
        }
        setLevelUpData({ level: newLevel, reward: reward || null })
      }

      writeSave(pokemon, next, xpRef.current, levelRef.current)
      return next
    })
  }, [pokemon])

  // ── Tap reaction ─────────────────────────────────────────
  const handleTap = useCallback(() => {
    const r = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
    const newBubble = { ...r, key: Date.now() }
    setBubble(newBubble)
    bubbleRef.current = newBubble
    clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => {
      setBubble(null)
      bubbleRef.current = null
    }, 1500)
  }, [])

  if (!stats) return null

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`
  const T = GAME_CONFIG.alertThreshold

  const alerts = [
    { key: 'hunger',        icon: <IconFork/>,    show: stats.hunger        <= T },
    { key: 'thirst',        icon: <IconDrop/>,    show: stats.thirst        <= T },
    { key: 'entertainment', icon: <IconStar/>,    show: stats.entertainment <= T },
    { key: 'toilet',        icon: <IconExclaim/>, show: stats.toilet        <= T },
  ].filter(a => a.show)

  const xpPct = Math.round((xp / GAME_CONFIG.xp.evolutionThreshold) * 100)
  const sc    = SCENES[scene]
  const mode  = isNight ? s.night : s.day

  return (
    <div className={`${s.page} ${mode}`}>

      {/* ── Habitat ── */}
      <div className={s.habitat} style={{ background: sc.bg }}>
        <div className={s.ground} style={{ background: sc.ground }}/>

        {scene === 0 && <ScenePrairie/>}
        {scene === 1 && <SceneForest/>}
        {scene === 2 && <SceneBeach/>}

        {alerts.length > 0 && (
          <div className={s.alerts}>
            {alerts.map(a => (
              <div key={a.key} className={s.alertBubble}>{a.icon}</div>
            ))}
          </div>
        )}

        <div className={s.pokemonWrap} onClick={handleTap}>
          {bubble && (
            <div key={bubble.key} className={s.reactionBubble}>
              {bubble.emoji} {bubble.text}
            </div>
          )}
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

        {/* Stats — one horizontal line */}
        <div className={s.section}>
          <p className={s.sectionLabel}>Stats</p>
          <div className={s.statsLine}>
            <span className={s.slIcon}>❤</span>
            <div className={s.slTrack}>
              <div className={s.slFill} style={{ width:`${stats.health}%`, background:'#FF4444' }}/>
            </div>
            <span className={s.slVal}>{Math.round(stats.health)}</span>
            <div className={s.slDiv}/>
            <span className={s.slIcon}>⚡</span>
            <div className={s.slTrack}>
              <div className={s.slFill} style={{ width:`${stats.energy}%`, background:'#FFD700' }}/>
            </div>
            <span className={s.slVal}>{Math.round(stats.energy)}</span>
            <div className={s.slDiv}/>
            <span className={s.slIcon}>✨</span>
            <div className={s.slTrack}>
              <div className={s.slFill} style={{ width:`${xpPct}%`, background:'#9B59B6' }}/>
            </div>
            <span className={s.slVal} style={{ fontSize:8 }}>Niv.{level}</span>
          </div>
        </div>

        {/* Needs */}
        <div className={s.section}>
          <p className={s.sectionLabel}>Besoins</p>
          <div className={s.needsGrid}>
            {[
              { key: 'hunger',        label: 'FAIM',  icon: <IconFork/>    },
              { key: 'thirst',        label: 'SOIF',  icon: <IconDrop/>    },
              { key: 'entertainment', label: 'JEU',   icon: <IconStar/>    },
              { key: 'toilet',        label: 'PIPI',  icon: <IconExclaim/> },
            ].map(({ key, label, icon }) => {
              const val = Math.round(stats[key])
              const color = needColor(val)
              const critical = val <= T
              return (
                <div key={key} className={s.needCard}>
                  <div className={s.needTop}>
                    <span className={s.needIcon}>
                      {icon}
                      {label}
                    </span>
                    <span className={s.needPct} style={{ color }}>{val}%</span>
                  </div>
                  <div className={s.needTrack}>
                    <div
                      className={`${s.needFill} ${critical ? s.critical : ''}`}
                      style={{ width:`${val}%`, '--fill-color': color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
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

      {levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          reward={levelUpData.reward}
          onClose={() => setLevelUpData(null)}
        />
      )}

    </div>
  )
}
