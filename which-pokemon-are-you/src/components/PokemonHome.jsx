import { useState, useEffect, useRef, useCallback } from 'react'
import s from './PokemonHome.module.css'
import { GAME_CONFIG, STORAGE_KEY, POOPS_KEY, freshStats, recalcStats, LEVEL_REWARDS, WILD_DROPS, EVOLUTIONS, addToInventory, loadProgress, saveProgress } from '../config/gameConfig'
import LevelUpOverlay from './LevelUpOverlay'

function KennelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 8 8" fill="currentColor">
      <rect x="0" y="3" width="8" height="1"/>
      <rect x="1" y="4" width="1" height="4"/>
      <rect x="6" y="4" width="1" height="4"/>
      <rect x="1" y="4" width="6" height="1"/>
      <rect x="3" y="0" width="2" height="1"/>
      <rect x="2" y="1" width="4" height="1"/>
      <rect x="1" y="2" width="6" height="1"/>
    </svg>
  )
}

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
      pokemon:   { id: pokemon.id, name: pokemon.name, isShiny: pokemon.isShiny ?? false },
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

// ── Wild Pokémon pool ─────────────────────────────────────────
const WILD_POOL = [
  { id: 16, name: 'Roucool' },
  { id: 19, name: 'Ratata' },
  { id: 21, name: 'Piafabec' },
  { id: 41, name: 'Nosferapti' },
  { id: 43, name: 'Mystherbe' },
  { id: 48, name: 'Coconfort' },
  { id: 60, name: 'Ptitard' },
  { id: 69, name: 'Chétiflor' },
]

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
export default function PokemonHome({ pokemon, isNight, onSwitchPokemon }) {
  const [stats,        setStats]        = useState(null)
  const [xp,           setXp]           = useState(0)
  const [level,        setLevel]        = useState(1)
  const [levelUpData,  setLevelUpData]  = useState(null) // { level, reward }
  const [bubble,       setBubble]       = useState(null)
  const [poops,        setPoops]        = useState([])
  const [dyingPoops,   setDyingPoops]   = useState(new Set()) // poop IDs mid-death animation
  const [xpFloats,     setXpFloats]     = useState([])         // { id, x, text }
  const [wildPokemon,  setWildPokemon]  = useState(null)       // { id, name, hp, maxHp, x, fromLeft }
  const [wildHit,      setWildHit]      = useState(false)
  const [wildDying,    setWildDying]    = useState(false)
  const [dmgFloats,    setDmgFloats]    = useState([])         // { id, x }
  const [dropNotif,    setDropNotif]    = useState(null)       // { emoji, name }
  const [dropItem,     setDropItem]     = useState(null)       // { emoji, x }
  const [hitStars,     setHitStars]     = useState([])         // { id, x, tx, ty }
  const [deathFlash,   setDeathFlash]   = useState(false)
  const [deathParticles, setDeathParticles] = useState([])     // { id, x, tx, ty, color, size, delay }
  const [deathStars,   setDeathStars]   = useState([])         // { id, x }
  const [showChenil,   setShowChenil]   = useState(false)
  const [chenilData,   setChenilData]   = useState(null)       // { allPokemon, activePokemonIndex }

  const statsRef    = useRef(null)
  const xpRef       = useRef(0)
  const levelRef    = useRef(1)
  const bubbleRef   = useRef(null)
  const bubbleTimer = useRef(null)
  const poopsRef    = useRef([])
  const wildRef     = useRef(null)
  const wildTimerRef = useRef(null)
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

    // Load persisted poops
    try {
      const savedPoops = JSON.parse(localStorage.getItem(POOPS_KEY)) || []
      setPoops(savedPoops)
      poopsRef.current = savedPoops
    } catch { /* ignore */ }

    // Ensure current pokemon is tracked in progress with full state
    const prog = loadProgress()
    const pidx = prog.allPokemon.findIndex(p => p.id === pokemon.id)
    if (pidx >= 0) {
      prog.allPokemon[pidx] = {
        ...prog.allPokemon[pidx],
        name: pokemon.name,
        isShiny: pokemon.isShiny ?? false,
        level: initLevel,
        xp: initXp,
        stats: initStats,
      }
      prog.activePokemonIndex = pidx
    } else {
      prog.allPokemon.push({
        id: pokemon.id, name: pokemon.name, isShiny: pokemon.isShiny ?? false,
        level: initLevel, xp: initXp, stats: initStats,
      })
      prog.activePokemonIndex = prog.allPokemon.length - 1
    }
    saveProgress(prog)
  }, [pokemon])

  // ── Periodic save every 60s + poop spawn check ──────────────
  useEffect(() => {
    if (!stats) return
    const interval = setInterval(() => {
      writeSave(pokemon, statsRef.current, xpRef.current, levelRef.current)

      // Spawn a poop if toilet is empty and under the cap
      if (statsRef.current?.toilet === 0 && poopsRef.current.length < 4) {
        if (Math.random() < 0.5) {
          const newPoop = { id: Date.now(), x: 10 + Math.random() * 70 }
          const newPoops = [...poopsRef.current, newPoop]
          setPoops(newPoops)
          poopsRef.current = newPoops
          localStorage.setItem(POOPS_KEY, JSON.stringify(newPoops))
        }
      }
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
          if (save.xp !== undefined)    { setXp(save.xp);       xpRef.current    = save.xp }
          if (save.level !== undefined && save.level !== levelRef.current) {
            const newLevel = save.level
            const reward   = LEVEL_REWARDS[newLevel] || null
            levelRef.current = newLevel
            setLevel(newLevel)
            setLevelUpData({ level: newLevel, reward })

            const prog = loadProgress()
            const pi   = prog.allPokemon.findIndex(p => p.id === pokemon.id)
            if (pi >= 0) { prog.allPokemon[pi].level = newLevel; prog.allPokemon[pi].xp = save.xp ?? 0 }
            else prog.allPokemon.push({ id: pokemon.id, name: pokemon.name, isShiny: pokemon.isShiny ?? false, level: newLevel, xp: save.xp ?? 0, stats: save.stats })
            saveProgress(prog)
            window.dispatchEvent(new CustomEvent('poketama-level-up'))
            checkLevelEvolution(pokemon.id, pokemon.name, pokemon.isShiny, newLevel)
          }
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

  // ── Wild Pokémon spawn (random 45-90s) ───────────────────
  useEffect(() => {
    let timeout
    function scheduleSpawn() {
      const delay = 45000 + Math.random() * 45000
      timeout = setTimeout(() => {
        if (!wildRef.current) {
          const pick = WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)]
          const fromLeft = Math.random() < 0.5
          const newWild = { ...pick, hp: 10, maxHp: 10, x: 10 + Math.random() * 60, fromLeft }
          setWildPokemon(newWild)
          wildRef.current = newWild
          // Auto-despawn after 30s if untouched
          wildTimerRef.current = setTimeout(() => {
            setWildPokemon(null)
            wildRef.current = null
          }, 30000)
        }
        scheduleSpawn()
      }, delay)
    }
    scheduleSpawn()
    return () => {
      clearTimeout(timeout)
      clearTimeout(wildTimerRef.current)
    }
  }, [])

  // ── Evolution check helper ────────────────────────────────
  function checkLevelEvolution(pokemonId, pokemonName, pokemonIsShiny, newLevel) {
    const evo = EVOLUTIONS[pokemonId]
    if (evo && evo.method === 'level' && newLevel >= evo.atLevel) {
      window.dispatchEvent(new CustomEvent('poketama-evolve', {
        detail: { oldId: pokemonId, oldName: pokemonName, newId: evo.evolvesTo, newName: evo.name, isShiny: pokemonIsShiny ?? false },
      }))
    }
  }

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

        const prog = loadProgress()
        const pi = prog.allPokemon.findIndex(p => p.id === pokemon.id)
        if (pi >= 0) prog.allPokemon[pi].level = newLevel
        else prog.allPokemon.push({ id: pokemon.id, name: pokemon.name, level: newLevel })
        saveProgress(prog)
        window.dispatchEvent(new CustomEvent('poketama-level-up'))
        checkLevelEvolution(pokemon.id, pokemon.name, pokemon.isShiny, newLevel)
      }

      writeSave(pokemon, next, xpRef.current, levelRef.current)
      return next
    })
  }, [pokemon])

  // ── Poop click ───────────────────────────────────────────
  const handlePoopClick = useCallback((e, poopId, poopX) => {
    e.stopPropagation()
    if (dyingPoops.has(poopId)) return

    // Start death animation
    setDyingPoops(prev => new Set([...prev, poopId]))

    // Floating "+5 XP" label
    const floatId = Date.now() + Math.random()
    setXpFloats(prev => [...prev, { id: floatId, x: poopX, text: '+5 XP' }])
    setTimeout(() => setXpFloats(prev => prev.filter(f => f.id !== floatId)), 1000)

    // Remove poop + grant XP after animation completes
    setTimeout(() => {
      setDyingPoops(prev => { const n = new Set(prev); n.delete(poopId); return n })

      const newPoops = poopsRef.current.filter(p => p.id !== poopId)
      setPoops(newPoops)
      poopsRef.current = newPoops
      localStorage.setItem(POOPS_KEY, JSON.stringify(newPoops))

      const rawXp = xpRef.current + 5
      if (rawXp >= GAME_CONFIG.xp.evolutionThreshold) {
        const newLevel = levelRef.current + 1
        levelRef.current = newLevel
        setLevel(newLevel)
        xpRef.current = 0
        setXp(0)
        const reward = LEVEL_REWARDS[newLevel] || null
        if (reward) addToInventory(reward.id, reward.quantity)
        setLevelUpData({ level: newLevel, reward: reward || null })

        const prog = loadProgress()
        const pi = prog.allPokemon.findIndex(p => p.id === pokemon.id)
        if (pi >= 0) prog.allPokemon[pi].level = newLevel
        else prog.allPokemon.push({ id: pokemon.id, name: pokemon.name, level: newLevel })
        saveProgress(prog)
        window.dispatchEvent(new CustomEvent('poketama-level-up'))
        checkLevelEvolution(pokemon.id, pokemon.name, pokemon.isShiny, newLevel)
      } else {
        xpRef.current = rawXp
        setXp(rawXp)
      }
      writeSave(pokemon, statsRef.current, xpRef.current, levelRef.current)
    }, 300)
  }, [dyingPoops, pokemon])

  // ── Wild Pokémon hit ─────────────────────────────────────
  const handleWildClick = useCallback((e) => {
    e.stopPropagation()
    if (!wildPokemon || wildDying) return

    const newHp = wildPokemon.hp - 1
    const hitX  = wildPokemon.x + 3

    // Red flash 80ms
    setWildHit(true)
    setTimeout(() => setWildHit(false), 80)

    // Hit stars — 4 diagonal sparks
    const starGroupId = `${Date.now()}-${Math.random()}`
    const newStars = [
      { tx: '20px', ty: '-20px' }, { tx: '-20px', ty: '-20px' },
      { tx: '20px', ty:  '20px' }, { tx: '-20px', ty:  '20px' },
    ].map((d, i) => ({ id: `${starGroupId}-${i}`, x: hitX, ...d }))
    const starIds = new Set(newStars.map(s => s.id))
    setHitStars(prev => [...prev, ...newStars])
    setTimeout(() => setHitStars(prev => prev.filter(s => !starIds.has(s.id))), 400)

    // "-1" damage float
    const dmgId = Date.now() + Math.random()
    setDmgFloats(prev => [...prev, { id: dmgId, x: hitX }])
    setTimeout(() => setDmgFloats(prev => prev.filter(f => f.id !== dmgId)), 650)

    if (newHp <= 0) {
      // ── DEATH ───────────────────────────────────────────
      clearTimeout(wildTimerRef.current)
      setWildDying(true)
      const deadX = wildPokemon.x + 3
      setWildPokemon(prev => prev ? { ...prev, hp: 0 } : prev)

      const xpGain = 15 + Math.floor(Math.random() * 11) // 15-25

      // "+XX XP" float
      const xpId = Date.now() + Math.random() + 1
      setXpFloats(prev => [...prev, { id: xpId, x: deadX, text: `+${xpGain} XP` }])
      setTimeout(() => setXpFloats(prev => prev.filter(f => f.id !== xpId)), 1100)

      // White flash overlay
      setDeathFlash(true)
      setTimeout(() => setDeathFlash(false), 300)

      // 8 explosion particles
      const pColors = ['#FF4444','#FF9900','#FFD700','#FF44AA','#44FFAA','#4488FF','#FF8844','#FFFFFF']
      const particles = Array.from({ length: 8 }, (_, i) => ({
        id: i, x: deadX,
        tx: `${Math.round((Math.random() - 0.5) * 120)}px`,
        ty: `${Math.round((Math.random() - 0.5) * 120)}px`,
        color: pColors[i],
        size: `${4 + Math.floor(Math.random() * 5)}px`,
        delay: `${i * 0.05}s`,
      }))
      setDeathParticles(particles)
      setTimeout(() => setDeathParticles([]), 700)

      // 3 ⭐ stars flying up
      const dStars = [-12, 0, 12].map((offset, i) => ({ id: i, x: deadX + offset / 10 }))
      setDeathStars(dStars)
      setTimeout(() => setDeathStars([]), 800)

      // Drop roll — cumulative chance through WILD_DROPS table
      const roll = Math.random()
      let cumulative = 0
      let drop = null
      for (const d of WILD_DROPS) {
        cumulative += d.chance
        if (roll < cumulative) { drop = d; break }
      }

      if (drop) {
        addToInventory(drop.id, 1)
        setDropItem({ emoji: drop.emoji, x: deadX })
        setTimeout(() => setDropItem(null), 2000)
        setDropNotif({ emoji: drop.emoji, name: drop.name })
        setTimeout(() => setDropNotif(null), 2800)
      }

      setTimeout(() => {
        setWildDying(false)
        setWildPokemon(null)
        wildRef.current = null

        const rawXp = xpRef.current + xpGain
        if (rawXp >= GAME_CONFIG.xp.evolutionThreshold) {
          const newLevel = levelRef.current + 1
          levelRef.current = newLevel
          setLevel(newLevel)
          xpRef.current = 0
          setXp(0)
          const reward = LEVEL_REWARDS[newLevel] || null
          if (reward) addToInventory(reward.id, reward.quantity)
          setLevelUpData({ level: newLevel, reward: reward || null })

          const prog = loadProgress()
          const pi = prog.allPokemon.findIndex(p => p.id === pokemon.id)
          if (pi >= 0) prog.allPokemon[pi].level = newLevel
          else prog.allPokemon.push({ id: pokemon.id, name: pokemon.name, level: newLevel })
          saveProgress(prog)
          window.dispatchEvent(new CustomEvent('poketama-level-up'))
          checkLevelEvolution(pokemon.id, pokemon.name, pokemon.isShiny, newLevel)
        } else {
          xpRef.current = rawXp
          setXp(rawXp)
        }
        writeSave(pokemon, statsRef.current, xpRef.current, levelRef.current)
      }, 700)

    } else {
      const updated = { ...wildPokemon, hp: newHp }
      setWildPokemon(updated)
      wildRef.current = updated
    }
  }, [wildPokemon, wildDying, pokemon])

  // ── Chenil ────────────────────────────────────────────────
  const handleOpenChenil = useCallback(() => {
    // Save current state to allPokemon before opening
    const prog = loadProgress()
    const pidx = prog.allPokemon.findIndex(p => p.id === pokemon.id)
    if (pidx >= 0) {
      prog.allPokemon[pidx] = {
        ...prog.allPokemon[pidx],
        level: levelRef.current,
        xp: xpRef.current,
        stats: statsRef.current,
      }
      saveProgress(prog)
    }
    setChenilData({
      allPokemon: prog.allPokemon || [],
      activePokemonIndex: prog.activePokemonIndex ?? pidx ?? 0,
    })
    setShowChenil(true)
  }, [pokemon])

  const handleActivatePokemon = useCallback((idx) => {
    const prog = loadProgress()
    const { allPokemon = [], activePokemonIndex = 0 } = prog

    // Save current state
    if (allPokemon[activePokemonIndex]) {
      allPokemon[activePokemonIndex] = {
        ...allPokemon[activePokemonIndex],
        level: levelRef.current,
        xp: xpRef.current,
        stats: statsRef.current,
      }
    }

    const newEntry = allPokemon[idx]
    if (!newEntry) return

    // Write new pokemon's state to STORAGE_KEY
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      pokemon: { id: newEntry.id, name: newEntry.name, isShiny: newEntry.isShiny ?? false },
      stats: newEntry.stats || freshStats(),
      xp: newEntry.xp ?? 0,
      level: newEntry.level ?? 1,
      lastSaved: Date.now(),
    }))

    prog.allPokemon = allPokemon
    prog.activePokemonIndex = idx
    saveProgress(prog)

    setShowChenil(false)
    if (onSwitchPokemon) {
      onSwitchPokemon({ id: newEntry.id, name: newEntry.name, isShiny: newEntry.isShiny ?? false })
    }
  }, [pokemon, onSwitchPokemon])

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

        {/* Poops */}
        {poops.map(poop => (
          <div
            key={poop.id}
            className={`${s.poop} ${dyingPoops.has(poop.id) ? s.poopDying : ''}`}
            style={{ left: `${poop.x}%` }}
            onClick={e => handlePoopClick(e, poop.id, poop.x)}
          >💩</div>
        ))}

        {/* Floating XP labels */}
        {xpFloats.map(f => (
          <div key={f.id} className={s.xpFloat} style={{ left: `${f.x + 1}%` }}>
            {f.text}
          </div>
        ))}

        {/* Wild Pokémon */}
        {wildPokemon && (
          <div
            className={[s.wildWrap, wildDying ? s.wildDying : ''].filter(Boolean).join(' ')}
            style={{ left: `${wildPokemon.x}%` }}
            onClick={handleWildClick}
          >
            <div className={s.wildHpBar}>
              <div className={s.wildHpFill} style={{ width: `${(wildPokemon.hp / wildPokemon.maxHp) * 100}%` }}/>
            </div>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${wildPokemon.id}.png`}
              alt={wildPokemon.name}
              className={[
                s.wildSprite,
                wildHit ? s.wildHit : '',
                wildPokemon.hp <= 3 && !wildDying ? s.wildCritical : '',
              ].filter(Boolean).join(' ')}
              style={!wildPokemon.fromLeft ? { transform: 'scaleX(-1)' } : {}}
              draggable={false}
            />
          </div>
        )}

        {/* Hit stars (per click) */}
        {hitStars.map(star => (
          <div
            key={star.id}
            className={s.hitStar}
            style={{ left: `${star.x}%`, bottom: '32%', '--tx': star.tx, '--ty': star.ty }}
          >✦</div>
        ))}

        {/* Damage floats (-1) */}
        {dmgFloats.map(f => (
          <div key={f.id} className={s.dmgFloat} style={{ left: `${f.x}%` }}>-1</div>
        ))}

        {/* Death particles */}
        {deathParticles.map(p => (
          <div
            key={p.id}
            className={s.deathParticle}
            style={{
              left: `${p.x}%`, bottom: '30%',
              '--tx': p.tx, '--ty': p.ty,
              '--color': p.color, '--size': p.size, '--delay': p.delay,
            }}
          />
        ))}

        {/* Death stars ⭐ */}
        {deathStars.map(ds => (
          <div key={ds.id} className={s.deathStarItem} style={{ left: `${ds.x}%`, bottom: '30%' }}>⭐</div>
        ))}

        {/* Dropping item animation */}
        {dropItem && (
          <div className={s.dropItemAnim} style={{ left: `${dropItem.x}%` }}>{dropItem.emoji}</div>
        )}

        {/* Drop notification */}
        {dropNotif && (
          <div className={s.dropNotif}>{dropNotif.emoji} {dropNotif.name} obtenu !</div>
        )}

        {/* Death flash overlay */}
        {deathFlash && <div className={s.deathFlashOverlay}/>}

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
            <button className={`${s.actionBtn} ${s.chenilBtn}`} onClick={handleOpenChenil}>
              <KennelIcon/>
              <span className={s.actionLabel}>Chenil</span>
            </button>
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

      {showChenil && chenilData && (
        <div className={s.chenilOverlay}>
          <div className={s.chenilPanel}>
            <div className={s.chenilHeader}>
              <p className={s.chenilTitle}>Mes Pokémon</p>
              <button className={s.chenilClose} onClick={() => setShowChenil(false)}>×</button>
            </div>
            <div className={s.chenilList}>
              {chenilData.allPokemon.map((entry, idx) => {
                const isActive = idx === chenilData.activePokemonIndex
                const xpPct = Math.round(((entry.xp ?? 0) / GAME_CONFIG.xp.evolutionThreshold) * 100)
                const spriteUrl = entry.isShiny
                  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${entry.id}.png`
                  : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.id}.png`
                return (
                  <div key={entry.id} className={`${s.chenilCard} ${isActive ? s.chenilCardActive : ''}`}>
                    <img src={spriteUrl} alt={entry.name} className={s.chenilSprite} draggable={false}
                      style={entry.isShiny ? { filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.5))' } : {}}
                    />
                    <div className={s.chenilInfo}>
                      <p className={s.chenilName}>
                        {entry.name}
                        {entry.isShiny && <span className={s.chenilShiny}>✨</span>}
                      </p>
                      <p className={s.chenilLvl}>Niv. {entry.level ?? 1}</p>
                      <div className={s.chenilXpBar}>
                        <div className={s.chenilXpFill} style={{ width: `${xpPct}%` }}/>
                      </div>
                    </div>
                    <div className={s.chenilActions}>
                      {isActive
                        ? <span className={s.chenilActiveBadge}>ACTIF</span>
                        : <button className={s.chenilActivateBtn} onClick={() => handleActivatePokemon(idx)}>Activer</button>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
