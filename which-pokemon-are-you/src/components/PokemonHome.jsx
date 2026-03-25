import { useState, useEffect, useRef, useCallback } from 'react'
import s from './PokemonHome.module.css'
import { GAME_CONFIG, STORAGE_KEY, POOPS_KEY, freshStats, recalcStats, LEVEL_REWARDS, WILD_DROPS, EVOLUTIONS, addToInventory, loadProgress, saveProgress } from '../config/gameConfig'
import LevelUpOverlay from './LevelUpOverlay'
import { useFaviconBadge, drawFaviconWithBadge } from '../hooks/useFaviconBadge'
import scene1 from '../assets/scenes/scene1.png'
import scene2 from '../assets/scenes/scene2.png'
import scene3 from '../assets/scenes/scene3.png'
import scene4 from '../assets/scenes/scene4.png'

const scenes = [scene1, scene2, scene3, scene4]


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
  const [pokemonPos,   setPokemonPos]   = useState(50)         // % horizontal in habitat
  const [isWalking,    setIsWalking]    = useState(false)
  const [facingLeft,   setFacingLeft]   = useState(false)

  const recheckFavicon = useFaviconBadge(stats)

  const statsRef       = useRef(null)
  const xpRef          = useRef(0)
  const levelRef       = useRef(1)
  const bubbleRef      = useRef(null)
  const bubbleTimer    = useRef(null)
  const poopsRef       = useRef([])
  const wildRef        = useRef(null)
  const wildTimerRef   = useRef(null)
  const wildWrapRef    = useRef(null)
  const pokemonPosRef  = useRef(50)
  const walkDurationRef = useRef(0)
  const [sceneIndex, setSceneIndex] = useState(() => {
    const v = parseInt(localStorage.getItem('poketama_scene'), 10)
    return isNaN(v) || v < 0 || v >= scenes.length ? 0 : v
  })
  const [equippedHat,    setEquippedHat]    = useState(() => localStorage.getItem('poketama_hat') || null)
  const [isDragging,     setIsDragging]     = useState(false)
  const [hatPos,         setHatPos]         = useState({ x: 0, y: 0 })
  const [isPlacementMode, setIsPlacementMode] = useState(false)
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 })

  const spriteRef = useRef(null)
  const zoneRef   = useRef(null)

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

  // ── Scene / hat event listeners ──────────────────────────────
  useEffect(() => {
    const onScene = (e) => setSceneIndex(e.detail.sceneId)
    const onHat   = (e) => setEquippedHat(e.detail.hatId)
    const onReposition = () => {
      setIsPlacementMode(true)
      const zone = zoneRef.current?.getBoundingClientRect()
      if (zone) setDragCurrentPos({ x: zone.width / 2, y: zone.height / 2 })
    }
    window.addEventListener('poketama-scene-change',   onScene)
    window.addEventListener('poketama-hat-change',     onHat)
    window.addEventListener('poketama-hat-reposition', onReposition)
    return () => {
      window.removeEventListener('poketama-scene-change',   onScene)
      window.removeEventListener('poketama-hat-change',     onHat)
      window.removeEventListener('poketama-hat-reposition', onReposition)
    }
  }, [])

  // ── Load saved hat offset / trigger placement on equip ────────
  useEffect(() => {
    if (!equippedHat) {
      setHatPos({ x: 0, y: 0 })
      setIsPlacementMode(false)
      return
    }
    const saved = localStorage.getItem(`poketama_hat_offset_${pokemon.id}`)
    if (saved) {
      try { setHatPos(JSON.parse(saved)) } catch {}
    } else {
      setIsPlacementMode(true)
      const zone = zoneRef.current?.getBoundingClientRect()
      if (zone) setDragCurrentPos({ x: zone.width / 2, y: zone.height / 2 })
    }
  }, [equippedHat, pokemon.id])

  // ── Desktop drag ──────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e) => {
      const zone = zoneRef.current?.getBoundingClientRect()
      if (!zone) return
      setDragCurrentPos({ x: e.clientX - zone.left, y: e.clientY - zone.top })
    }

    const handleMouseUp = (e) => {
      setIsDragging(false)
      if (!isPlacementMode) return
      const sprite = spriteRef.current?.getBoundingClientRect()
      const zone   = zoneRef.current?.getBoundingClientRect()
      if (!sprite || !zone) return
      const spriteCenterX = sprite.left - zone.left + sprite.width  / 2
      const spriteCenterY = sprite.top  - zone.top  + sprite.height / 2
      const offset = { x: dragCurrentPos.x - spriteCenterX, y: dragCurrentPos.y - spriteCenterY }
      setHatPos(offset)
      localStorage.setItem(`poketama_hat_offset_${pokemon.id}`, JSON.stringify(offset))
      setIsPlacementMode(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup',   handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   handleMouseUp)
    }
  }, [isDragging, dragCurrentPos, isPlacementMode, pokemon.id])

  // ── Mobile drag ───────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return

    const handleTouchMove = (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const zone  = zoneRef.current?.getBoundingClientRect()
      if (!zone) return
      setDragCurrentPos({ x: touch.clientX - zone.left, y: touch.clientY - zone.top })
    }

    const handleTouchEnd = (e) => {
      setIsDragging(false)
      if (!isPlacementMode) return
      const sprite = spriteRef.current?.getBoundingClientRect()
      const zone   = zoneRef.current?.getBoundingClientRect()
      if (!sprite || !zone) return
      const spriteCenterX = sprite.left - zone.left + sprite.width  / 2
      const spriteCenterY = sprite.top  - zone.top  + sprite.height / 2
      const offset = { x: dragCurrentPos.x - spriteCenterX, y: dragCurrentPos.y - spriteCenterY }
      setHatPos(offset)
      localStorage.setItem(`poketama_hat_offset_${pokemon.id}`, JSON.stringify(offset))
      setIsPlacementMode(false)
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend',  handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend',  handleTouchEnd)
    }
  }, [isDragging, dragCurrentPos, isPlacementMode, pokemon.id])

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
          const newWild = { ...pick, hp: 10, maxHp: 10 }
          setWildPokemon(newWild)
          wildRef.current = newWild
          drawFaviconWithBadge(true)
          // Auto-despawn after 11s (matches 10s walk animation + 1s grace)
          wildTimerRef.current = setTimeout(() => {
            setWildPokemon(null)
            wildRef.current = null
            recheckFavicon()
          }, 11000)
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

  // ── Pokémon random movement ───────────────────────────────
  useEffect(() => {
    let moveTimeout
    function scheduleNextMove() {
      const waitTime = 8000 + Math.random() * 12000
      moveTimeout = setTimeout(() => {
        const newPos = 20 + Math.random() * 60
        const currentPos = pokemonPosRef.current
        setFacingLeft(newPos < currentPos)
        const distance = Math.abs(newPos - currentPos)
        const walkDuration = Math.max(400, distance * 40)
        walkDurationRef.current = walkDuration
        setIsWalking(true)
        setPokemonPos(newPos)
        pokemonPosRef.current = newPos
        setTimeout(() => {
          setIsWalking(false)
          scheduleNextMove()
        }, walkDuration)
      }, waitTime)
    }
    scheduleNextMove()
    return () => clearTimeout(moveTimeout)
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

    // Read current animated position from DOM
    const el = wildWrapRef.current
    const leftPx = el ? parseFloat(window.getComputedStyle(el).left) || 0 : 0
    const containerW = el?.parentElement?.clientWidth || 300
    const hitX = (leftPx / containerW) * 100 + 3

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
      // Freeze current animated left before replacing animation
      if (el) el.style.left = `${leftPx}px`
      setWildDying(true)
      const deadX = hitX
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
        recheckFavicon()

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
  }, [wildPokemon, wildDying, pokemon, recheckFavicon])

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
  const mode  = isNight ? s.night : s.day

  // ── Hat style — computed each render from live DOM rects ──────
  const getHatStyle = () => {
    if (isPlacementMode) {
      return {
        position: 'absolute',
        left: dragCurrentPos.x,
        top:  dragCurrentPos.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 200,
        cursor: isDragging ? 'grabbing' : 'grab',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
        animation: isDragging ? 'none' : undefined,
      }
    }
    const sprite = spriteRef.current?.getBoundingClientRect()
    const zone   = zoneRef.current?.getBoundingClientRect()
    if (!sprite || !zone) return { display: 'none' }
    const spriteCenterX = sprite.left - zone.left + sprite.width  / 2
    const spriteCenterY = sprite.top  - zone.top  + sprite.height / 2
    return {
      position: 'absolute',
      left: spriteCenterX + hatPos.x,
      top:  spriteCenterY + hatPos.y,
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
      pointerEvents: 'none',
    }
  }

  return (
    <div className={`${s.page} ${mode}`}>

      {/* ── Habitat ── */}
      <div
        ref={zoneRef}
        className={s.habitat}
        style={{
          backgroundImage: `url(${scenes[sceneIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }}
      >

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
            ref={wildWrapRef}
            className={[s.wildWrap, wildDying ? s.wildDying : ''].filter(Boolean).join(' ')}
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

        <div
          className={s.pokemonWrap}
          style={{
            left: `${pokemonPos}%`,
            transform: 'translateX(-50%)',
            transition: isWalking ? `left ${walkDurationRef.current}ms linear` : 'none',
          }}
          onClick={handleTap}
        >
          {bubble && (
            <div key={bubble.key} className={s.reactionBubble}>
              {bubble.emoji} {bubble.text}
            </div>
          )}
          <div className={`${s.pokemonShadow} ${isWalking ? s.pokemonShadowWalking : ''}`}/>
          <img
            ref={spriteRef}
            src={spriteUrl}
            alt={pokemon.name}
            className={`${s.pokemonSprite} ${isWalking ? s.pokemonSpriteWalking : ''}`}
            style={{ '--flip': facingLeft ? -1 : 1, zIndex: 1, position: 'relative' }}
            draggable={false}
          />
        </div>

        {/* ── Hat placement overlay (pointer-events: none — window handles drag) ── */}
        {isPlacementMode && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 150,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '16px',
            pointerEvents: 'none',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.92)',
              borderRadius: '100px',
              padding: '8px 18px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: '300',
              color: '#1a1a1a',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            }}>
              Placez le chapeau sur la tête de votre Pokémon
            </div>
          </div>
        )}

        {/* ── Hat element — absolute in habitat ── */}
        {equippedHat && (
          <svg
            width="40" height="26" viewBox="0 0 28 18"
            style={getHatStyle()}
            onMouseDown={isPlacementMode ? (e) => { e.preventDefault(); setIsDragging(true) } : undefined}
            onTouchStart={isPlacementMode ? (e) => { e.preventDefault(); setIsDragging(true) } : undefined}
            className={isPlacementMode && !isDragging ? s.hatDraggable : undefined}
          >
            <rect x="5" y="0" width="18" height="12" rx="3" fill="#2a2a2a"/>
            <rect x="0" y="11" width="28" height="5" rx="2" fill="#1a1a1a"/>
          </svg>
        )}

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
