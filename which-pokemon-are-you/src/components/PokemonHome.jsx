import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import s from './PokemonHome.module.css'
import { GAME_CONFIG, STORAGE_KEY, POOPS_KEY, freshStats, recalcStats, LEVEL_REWARDS, WILD_DROPS, EVOLUTIONS, addToInventory, loadProgress, saveProgress } from '../config/gameConfig'
import LevelUpOverlay from './LevelUpOverlay'
import { useFaviconBadge, drawFaviconWithBadge } from '../hooks/useFaviconBadge'
import scene1 from '../assets/scenes/scene1.png'
import scene2 from '../assets/scenes/scene2.png'
import scene3 from '../assets/scenes/scene3.png'
import scene4 from '../assets/scenes/scene4.png'
import { HAT_CATALOG } from '../config/hatCatalog'
import BagScreen from './BagScreen'

const scenes = [scene1, scene2, scene3, scene4]

const DECAY_RATES = {
  hunger:        1 / 45,
  thirst:        1 / 30,
  entertainment: 1 / 35,
  toilet:        1 / 180,
}

const MINIGAMES = [
  { id: 'doodle_jump', name: 'Poké Jump',         icon: '⬆️', color: '#4A90E2', available: false },
  { id: 'runner',      name: 'Endless Run',        icon: '🏃', color: '#E24A4A', available: false },
  { id: 'catch',       name: 'Attrape les baies',  icon: '🍇', color: '#4AE27A', available: false },
]


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

function HatSVG({ hat, style, onMouseDown, onTouchStart, facingLeft }) {
  const flip = facingLeft ? -1 : 1
  if (hat?.image) {
    return (
      <img
        src={hat.image}
        alt={hat.name || 'hat'}
        draggable={false}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          width: 56, height: 56, objectFit: 'contain',
          ...style,
          transform: `${style?.transform ?? 'translate(-50%, -50%)'} scaleX(${flip})`,
        }}
      />
    )
  }
  // Fallback SVG placeholder
  return (
    <svg
      width="38" height="32" viewBox="0 0 48 40"
      draggable={false}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{ filter: 'drop-shadow(0 0 2px white) drop-shadow(0 0 1px white)', ...style }}
    >
      <ellipse cx="24" cy="34" rx="22" ry="5" fill="#FF3B30"/>
      <rect x="10" y="14" width="28" height="20" rx="3" fill="#FF3B30"/>
      <ellipse cx="24" cy="14" rx="14" ry="8" fill="#FF3B30"/>
      <ellipse cx="18" cy="12" rx="4" ry="2" fill="rgba(255,255,255,0.4)" transform="rotate(-20 18 12)"/>
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
function buildNeedMessages(n) {
  return {
    hunger: [
      `${n}. faim. maintenant.`,
      `je mange ou je rage.`,
      `croquettes ou rien.`,
      `ventre vide, mood nul.`,
    ],
    thirst: [
      `${n} de l'eau stp.`,
      `je sèche ici.`,
      `soif niveau extrême.`,
      `hydrate-moi ou else.`,
    ],
    entertainment: [
      `${n} t'es là ?`,
      `je m'ennuie à mourir.`,
      `on joue ou quoi ?`,
      `POV : abandon total.`,
    ],
    toilet: [
      `URGENT. non négo.`,
      `${n} vite vite vite.`,
      `c'est critique là.`,
      `toilettes. NOW.`,
    ],
  }
}

function buildGenericMessages(n) {
  return [
    `${n} on est bons ?`,
    `vie de poké, c'est ça.`,
    `ratio bonne journée : ok`,
    `je suis là. t'inquiète.`,
    `t'as vu mes stats ?`,
    `${n} tu m'manques ngl`,
    `j'ai fait 3 pas. content.`,
    `soleil ou pas, je suis là.`,
  ]
}

const POKEMON_MESSAGES = {
  129: (n) => [
    `splash. c'est tout.`,
    `un jour j'évoluerai.`,
    `${n} pourquoi moi.`,
  ],
  143: () => [
    `manger. dormir. repeat.`,
    `réveille-moi pour manger.`,
    `zzzz... croquettes... zzzz`,
  ],
  132: () => [
    `je suis qui déjà ?`,
    `forme libre. humeur idem.`,
  ],
  25: (n) => [
    `PIKA. (= nourris-moi)`,
    `...pika. (= ennui total)`,
    `${n} PIKA PIKA.`,
  ],
  54: () => [
    `ma tête. toujours.`,
    `quak. (douleur chronique)`,
  ],
}

// ── Main component ────────────────────────────────────────────
export default function PokemonHome({ pokemon, isNight, onSwitchPokemon, godMode = false }) {
  const [stats,        setStats]        = useState(null)
  const [xp,           setXp]           = useState(0)
  const [level,        setLevel]        = useState(1)
  const [levelUpData,  setLevelUpData]  = useState(null) // { level, reward }
  const [bubble,       setBubble]       = useState(null)
  const [poops,        setPoops]        = useState([])
  const [dyingPoops,   setDyingPoops]   = useState(new Set()) // poop IDs mid-death animation
  const [xpFloats,     setXpFloats]     = useState([])         // { id, x, text }
  const [wilds,        setWilds]        = useState([])         // [{ id, pokemonId, name, x, hp, maxHp, isDefeated, lastTap }]
  const [wildHits,     setWildHits]     = useState(new Set())  // ids doing white flash
  const [wildDyings,   setWildDyings]   = useState(new Set())  // ids doing fadeOut
  const [dmgFloats,    setDmgFloats]    = useState([])         // { id, x, text }
  const [userVibrating, setUserVibrating] = useState(false)
  const [dropNotif,    setDropNotif]    = useState(null)       // { emoji, name }
  const [dropItem,     setDropItem]     = useState(null)       // { emoji, x }
  const [hitStars,     setHitStars]     = useState([])         // { id, x, tx, ty }
  const [deathFlash,   setDeathFlash]   = useState(false)
  const [deathParticles, setDeathParticles] = useState([])     // { id, x, tx, ty, color, size, delay }
  const [deathStars,   setDeathStars]   = useState([])         // { id, x }
  const [showChenil,   setShowChenil]   = useState(false)
  const [chenilData,   setChenilData]   = useState(null)       // { allPokemon, activePokemonIndex }
  const [cooldowns,       setCooldowns]       = useState({ hunger: 0, thirst: 0, toilet: 0 })
  const [showMinigames,   setShowMinigames]   = useState(false)
  const [minigamesClosing, setMinigamesClosing] = useState(false)
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
  const wildsRef            = useRef([])
  const triggerWildDefeatRef = useRef(null)
  const pokemonPosRef  = useRef(50)
  const walkDurationRef = useRef(0)
  const [sceneIndex, setSceneIndex] = useState(() => {
    const v = parseInt(localStorage.getItem('poketama_scene'), 10)
    return isNaN(v) || v < 0 || v >= scenes.length ? 0 : v
  })
  const [equippedHatId,  setEquippedHatId]  = useState(() => localStorage.getItem('poketama_hat') || null)
  const equippedHat = equippedHatId ? (HAT_CATALOG[equippedHatId] ?? null) : null
  const [isDragging,     setIsDragging]     = useState(false)
  const [hatPos,         setHatPos]         = useState({ x: 0, y: 0 })
  const [isPlacementMode, setIsPlacementMode] = useState(false)
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 })

  const [bagOpen,        setBagOpen]        = useState(false)
  const [bagClosing,     setBagClosing]     = useState(false)
  const [bagNotif,       setBagNotif]       = useState(false)
  const [hatRenderPos,   setHatRenderPos]   = useState({ x: 0, y: 0 })

  const spriteRef         = useRef(null)
  const zoneRef           = useRef(null)
  const dragPosRef        = useRef({ x: 0, y: 0 })
  const isPlacementRef    = useRef(false)
  const rafRef            = useRef(null)
  const statsLastUpdated  = useRef(Date.now())
  const tickCountRef      = useRef(0)

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    const save = loadSave(pokemon)
    let initStats, initXp, initLevel

    if (save) {
      const elapsed = Date.now() - (save.lastSaved || Date.now())
      const minutes = elapsed / 60000
      const s = { ...save.stats }
      const hour = new Date().getHours()
      s.hunger        = Math.max(0, s.hunger        - minutes / 45)
      s.thirst        = Math.max(0, s.thirst        - minutes / 30)
      s.entertainment = Math.max(0, s.entertainment - minutes / 35)
      s.toilet        = Math.max(0, s.toilet        - minutes / 180)
      if (hour >= 8 && hour < 22) {
        s.energy = Math.max(0, s.energy - (minutes / (14 * 60)) * 100)
      } else {
        s.energy = Math.min(100, s.energy + minutes * 10 / 60)
      }
      const needsAt0 = ['hunger','thirst','entertainment','toilet'].filter(k => s[k] <= 0).length
      if (needsAt0 > 0 && elapsed > 2 * 60 * 60 * 1000) {
        const dmgHours = (elapsed - 2 * 60 * 60 * 1000) / 3600000
        s.health = Math.max(1, s.health - needsAt0 * dmgHours * 5)
      }
      s.hunger = Math.round(s.hunger); s.thirst = Math.round(s.thirst)
      s.entertainment = Math.round(s.entertainment); s.toilet = Math.round(s.toilet)
      s.energy = Math.round(s.energy); s.health = Math.round(s.health)
      initStats = s
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
    statsRef.current     = initStats
    xpRef.current        = initXp
    levelRef.current     = initLevel
    statsLastUpdated.current = Date.now()

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
    const onHat   = (e) => setEquippedHatId(e.detail.hatId)
    const onReposition = () => {
      isPlacementRef.current = true
      setIsPlacementMode(true)
      const zone = zoneRef.current?.getBoundingClientRect()
      if (zone) {
        const pos = { x: zone.width / 2, y: zone.height / 2 }
        dragPosRef.current = pos
        setDragCurrentPos(pos)
      }
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
      isPlacementRef.current = false
      setIsPlacementMode(false)
      return
    }
    const saved = localStorage.getItem(`poketama_hat_offset_${pokemon.id}`)
    if (saved) {
      try { setHatPos(JSON.parse(saved)) } catch {}
    } else {
      const tutorialDone = localStorage.getItem('poketama_hat_tutorial_done') === 'true'
      if (!tutorialDone) {
        // First hat ever — show placement tutorial
        isPlacementRef.current = true
        setIsPlacementMode(true)
        const zone = zoneRef.current?.getBoundingClientRect()
        if (zone) {
          const pos = { x: zone.width / 2, y: zone.height / 2 }
          dragPosRef.current = pos
          setDragCurrentPos(pos)
        }
      } else {
        // Tutorial already done — use default center offset (0,0)
        const defaultOffset = { x: 0, y: -20 }
        setHatPos(defaultOffset)
        localStorage.setItem(`poketama_hat_offset_${pokemon.id}`, JSON.stringify(defaultOffset))
      }
    }
  }, [equippedHatId, pokemon.id])

  // ── Desktop drag ──────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return

    const pokemonId = pokemon.id

    const handleMouseMove = (e) => {
      const zone = zoneRef.current?.getBoundingClientRect()
      if (!zone) return
      const pos = { x: e.clientX - zone.left, y: e.clientY - zone.top }
      dragPosRef.current = pos
      setDragCurrentPos(pos)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      if (!isPlacementRef.current) return
      const sprite = spriteRef.current?.getBoundingClientRect()
      const zone   = zoneRef.current?.getBoundingClientRect()
      if (!sprite || !zone) return
      const spriteCenterX = sprite.left - zone.left + sprite.width  / 2
      const spriteCenterY = sprite.top  - zone.top  + sprite.height / 2
      const offset = { x: dragPosRef.current.x - spriteCenterX, y: dragPosRef.current.y - spriteCenterY }
      setHatPos(offset)
      localStorage.setItem(`poketama_hat_offset_${pokemonId}`, JSON.stringify(offset))
      localStorage.setItem('poketama_hat_tutorial_done', 'true')
      isPlacementRef.current = false
      setIsPlacementMode(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup',   handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   handleMouseUp)
    }
  }, [isDragging])

  // ── Hat initial position when placement mode activates ────────
  useLayoutEffect(() => {
    if (!isPlacementMode) return
    const zone = zoneRef.current?.getBoundingClientRect()
    if (!zone || zone.width === 0) return
    const pos = { x: zone.width / 2, y: zone.height / 2 }
    dragPosRef.current = pos
    setDragCurrentPos(pos)
  }, [isPlacementMode])

  // ── Hat RAF loop — real-time tracking of sprite position ──────
  useEffect(() => {
    if (isPlacementMode || !equippedHat) {
      cancelAnimationFrame(rafRef.current)
      return
    }
    function tick() {
      const sprite = spriteRef.current?.getBoundingClientRect()
      const zone   = zoneRef.current?.getBoundingClientRect()
      if (sprite && zone) {
        const spriteCenterX = sprite.left - zone.left + sprite.width  / 2
        const spriteCenterY = sprite.top  - zone.top  + sprite.height / 2
        const effectiveX    = facingLeft ? -hatPos.x : hatPos.x
        setHatRenderPos({ x: spriteCenterX + effectiveX, y: spriteCenterY + hatPos.y })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }, [isPlacementMode, equippedHat, hatPos, facingLeft])


  // ── Mobile drag ───────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return

    const pokemonId = pokemon.id

    const handleTouchMove = (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const zone  = zoneRef.current?.getBoundingClientRect()
      if (!zone) return
      const pos = { x: touch.clientX - zone.left, y: touch.clientY - zone.top }
      dragPosRef.current = pos
      setDragCurrentPos(pos)
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      if (!isPlacementRef.current) return
      const sprite = spriteRef.current?.getBoundingClientRect()
      const zone   = zoneRef.current?.getBoundingClientRect()
      if (!sprite || !zone) return
      const spriteCenterX = sprite.left - zone.left + sprite.width  / 2
      const spriteCenterY = sprite.top  - zone.top  + sprite.height / 2
      const offset = { x: dragPosRef.current.x - spriteCenterX, y: dragPosRef.current.y - spriteCenterY }
      setHatPos(offset)
      localStorage.setItem(`poketama_hat_offset_${pokemonId}`, JSON.stringify(offset))
      localStorage.setItem('poketama_hat_tutorial_done', 'true')
      isPlacementRef.current = false
      setIsPlacementMode(false)
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend',  handleTouchEnd)
    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend',  handleTouchEnd)
    }
  }, [isDragging])

  // ── Stats ticker — timestamp-based, zero stale closure ──────
  useEffect(() => {
    const tick = () => {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return

      const save = JSON.parse(raw)
      const now = Date.now()
      const minutes = (now - save.lastSaved) / 60000
      if (minutes < 0.1) return

      const s = { ...save.stats }

      s.hunger        = Math.max(0, s.hunger        - DECAY_RATES.hunger        * minutes)
      s.thirst        = Math.max(0, s.thirst        - DECAY_RATES.thirst        * minutes)
      s.entertainment = Math.max(0, s.entertainment - DECAY_RATES.entertainment * minutes)
      s.toilet        = Math.max(0, s.toilet        - DECAY_RATES.toilet        * minutes)

      const hour = new Date().getHours()
      if (hour >= 8 && hour < 22) {
        s.energy = Math.max(0, s.energy - (minutes / 840) * 100)
      }

      Object.keys(s).forEach(k => {
        if (typeof s[k] === 'number') s[k] = Math.round(s[k])
      })

      // Poop spawn if toilet empty
      if (s.toilet === 0 && poopsRef.current.length < 4 && Math.random() < 0.5) {
        const newPoop  = { id: Date.now(), x: 10 + Math.random() * 70 }
        const newPoops = [...poopsRef.current, newPoop]
        setPoops(newPoops)
        poopsRef.current = newPoops
        localStorage.setItem(POOPS_KEY, JSON.stringify(newPoops))
      }

      const newSave = { ...save, stats: s, lastSaved: now }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSave))
      statsRef.current = s
      setStats(s)
    }

    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])

  // ── Cooldown 1s decrement ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev }
        let changed = false
        for (const k of ['hunger', 'thirst', 'toilet']) {
          if (next[k] > 0) { next[k]--; changed = true }
        }
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

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
            if (reward) setBagNotif(true)
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
      if (bubbleRef.current) return

      const currentStats = statsRef.current
      const trainerName = localStorage.getItem('poketama_trainer_name') || 'Dresseur'

      const needKeys = ['hunger', 'thirst', 'entertainment', 'toilet']
      const urgentNeeds = needKeys.filter(k => currentStats && currentStats[k] <= 30)

      let text
      if (urgentNeeds.length > 0) {
        const key = urgentNeeds[Math.floor(Math.random() * urgentNeeds.length)]
        const msgs = buildNeedMessages(trainerName)[key]
        text = msgs[Math.floor(Math.random() * msgs.length)]
      } else {
        const pokemonMsgFn = POKEMON_MESSAGES[pokemon.id]
        if (pokemonMsgFn && Math.random() < 0.3) {
          const msgs = pokemonMsgFn(trainerName)
          text = msgs[Math.floor(Math.random() * msgs.length)]
        } else {
          const msgs = buildGenericMessages(trainerName)
          text = msgs[Math.floor(Math.random() * msgs.length)]
        }
      }

      const truncated = text.length > 50 ? text.slice(0, 50).trimEnd() + '…' : text
      const bubble = { emoji: '', text: truncated, key: Date.now(), auto: true }
      setBubble(bubble)
      bubbleRef.current = bubble
      clearTimeout(bubbleTimer.current)
      bubbleTimer.current = setTimeout(() => {
        setBubble(null)
        bubbleRef.current = null
      }, 4300)
    }, 25 * 1000)

    return () => clearInterval(interval)
  }, [!!stats, pokemon])

  // ── Wild Pokémon spawn (random 30-60s, max 3 simultaneous) ──
  useEffect(() => {
    let timeout
    function scheduleSpawn() {
      const delay = 30000 + Math.random() * 30000
      timeout = setTimeout(() => {
        setWilds(prev => {
          const active = prev.filter(w => !w.isDefeated)
          if (active.length >= 3) return prev
          const pick = WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)]
          const dir = Math.random() < 0.5 ? 1 : -1
          const newWild = {
            id: Date.now(),
            pokemonId: pick.id,
            name: pick.name,
            x: 10 + Math.random() * 70,
            speedX: 0.1 + Math.random() * 1.1,
            hp: 100,
            maxHp: 100,
            isDefeated: false,
            lastTap: 0,
            direction: dir,
            facingLeft: dir < 0,
            isPaused: false,
            pauseTimer: 0,
          }
          return [...active, newWild]
        })
        scheduleSpawn()
      }, delay)
    }
    scheduleSpawn()
    return () => clearTimeout(timeout)
  }, [])

  // ── Wild JS movement — organic bounce with pauses ────────
  useEffect(() => {
    const interval = setInterval(() => {
      setWilds(prev => {
        if (!prev.some(w => !w.isDefeated)) return prev
        return prev.map(w => {
          if (w.isDefeated) return w
          if (w.isPaused) {
            const newTimer = w.pauseTimer - 1
            return newTimer <= 0 ? { ...w, isPaused: false, pauseTimer: 0 } : { ...w, pauseTimer: newTimer }
          }
          let x = w.x + w.direction * w.speedX
          let direction = w.direction
          if (x > 82) { x = 82; direction = -1 }
          if (x < 8)  { x = 8;  direction = 1  }
          let speedX = w.speedX + (Math.random() - 0.5) * 0.02
          speedX = Math.max(0.1, Math.min(1.2, speedX))
          const isPaused  = Math.random() < 0.025
          const pauseTimer = isPaused ? Math.floor(20 + Math.random() * 60) : 0
          return { ...w, x, direction, facingLeft: direction < 0, speedX, isPaused, pauseTimer }
        })
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // ── Manual wild spawn (sidebar button via custom event) ───
  useEffect(() => {
    function handleForceSpawn() {
      setWilds(prev => {
        const active = prev.filter(w => !w.isDefeated)
        if (active.length >= 3) return prev
        const pick = WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)]
        const dir = Math.random() < 0.5 ? 1 : -1
        return [...active, {
          id: Date.now(),
          pokemonId: pick.id,
          name: pick.name,
          x: 10 + Math.random() * 70,
          speedX: 0.1 + Math.random() * 1.1,
          hp: 100, maxHp: 100,
          isDefeated: false, lastTap: 0,
          direction: dir, facingLeft: dir < 0,
          isPaused: false, pauseTimer: 0,
        }]
      })
    }
    window.addEventListener('poketama-spawn-wild', handleForceSpawn)
    return () => window.removeEventListener('poketama-spawn-wild', handleForceSpawn)
  }, [])

  // ── Keep wildsRef in sync ─────────────────────────────────
  useEffect(() => { wildsRef.current = wilds }, [wilds])

  // ── Favicon badge when wilds present ─────────────────────
  useEffect(() => {
    if (wilds.filter(w => !w.isDefeated).length > 0) {
      drawFaviconWithBadge(true)
    } else {
      recheckFavicon()
    }
  }, [wilds])

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
      const wasBelow100 = prev[statKey] < 100
      const next = { ...prev, [statKey]: GAME_CONFIG[statKey].max }
      statsRef.current = next

      if (!wasBelow100) {
        writeSave(pokemon, next, xpRef.current, levelRef.current)
        return next
      }

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
          setBagNotif(true)
        }
        setLevelUpData({ level: newLevel, reward: reward || null })

        const prog = loadProgress()
        const pi = prog.allPokemon.findIndex(p => p.id === pokemon.id)
        if (pi >= 0) prog.allPokemon[pi].level = newLevel
        else prog.allPokemon.push({ id: pokemon.id, name: pokemon.name, level: newLevel })
        saveProgress(prog)
        window.dispatchEvent(new CustomEvent('poketama-level-up'))
        checkLevelEvolution(pokemon.id, pokemon.name, pokemon.isShiny, newLevel)
        next.health = Math.min(100, next.health + 30)
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
        if (reward) { addToInventory(reward.id, reward.quantity); setBagNotif(true) }
        setLevelUpData({ level: newLevel, reward: reward || null })

        const prog = loadProgress()
        const pi = prog.allPokemon.findIndex(p => p.id === pokemon.id)
        if (pi >= 0) prog.allPokemon[pi].level = newLevel
        else prog.allPokemon.push({ id: pokemon.id, name: pokemon.name, level: newLevel })
        saveProgress(prog)
        window.dispatchEvent(new CustomEvent('poketama-level-up'))
        checkLevelEvolution(pokemon.id, pokemon.name, pokemon.isShiny, newLevel)
        const boosted = { ...statsRef.current, health: Math.min(100, statsRef.current.health + 30) }
        statsRef.current = boosted
        setStats(boosted)
      } else {
        xpRef.current = rawXp
        setXp(rawXp)
      }
      writeSave(pokemon, statsRef.current, xpRef.current, levelRef.current)
    }, 300)
  }, [dyingPoops, pokemon])

  // ── Wild defeat sequence (shared tap + auto) ─────────────
  const triggerWildDefeat = useCallback((wildId, hitX, xpGain) => {
    setWilds(prev => prev.map(w => w.id === wildId ? { ...w, hp: 0, isDefeated: true } : w))
    setWildDyings(prev => new Set([...prev, wildId]))

    const xpId = Date.now() + Math.random() + 1
    setXpFloats(prev => [...prev, { id: xpId, x: hitX, text: `+${xpGain} XP` }])
    setTimeout(() => setXpFloats(prev => prev.filter(f => f.id !== xpId)), 1100)

    setDeathFlash(true)
    setTimeout(() => setDeathFlash(false), 300)

    const pColors = ['#FF4444','#FF9900','#FFD700','#FF44AA','#44FFAA','#4488FF','#FF8844','#FFFFFF']
    const particles = Array.from({ length: 8 }, (_, i) => ({
      id: i, x: hitX,
      tx: `${Math.round((Math.random() - 0.5) * 120)}px`,
      ty: `${Math.round((Math.random() - 0.5) * 120)}px`,
      color: pColors[i],
      size: `${4 + Math.floor(Math.random() * 5)}px`,
      delay: `${i * 0.05}s`,
    }))
    setDeathParticles(particles)
    setTimeout(() => setDeathParticles([]), 700)

    const dStars = [-12, 0, 12].map((offset, i) => ({ id: i, x: hitX + offset / 10 }))
    setDeathStars(dStars)
    setTimeout(() => setDeathStars([]), 800)

    const roll = Math.random()
    let cumulative = 0
    let drop = null
    for (const d of WILD_DROPS) {
      cumulative += d.chance
      if (roll < cumulative) { drop = d; break }
    }
    if (drop) {
      addToInventory(drop.id, 1)
      setDropItem({ emoji: drop.emoji, x: hitX })
      setTimeout(() => setDropItem(null), 2000)
      setDropNotif({ emoji: drop.emoji, name: drop.name })
      setTimeout(() => setDropNotif(null), 2800)
    }

    setTimeout(() => {
      setWilds(prev => prev.filter(w => w.id !== wildId))
      setWildDyings(prev => { const n = new Set(prev); n.delete(wildId); return n })

      const rawXp = xpRef.current + xpGain
      if (rawXp >= GAME_CONFIG.xp.evolutionThreshold) {
        const newLevel = levelRef.current + 1
        levelRef.current = newLevel
        setLevel(newLevel)
        xpRef.current = 0
        setXp(0)
        const reward = LEVEL_REWARDS[newLevel] || null
        if (reward) { addToInventory(reward.id, reward.quantity); setBagNotif(true) }
        setLevelUpData({ level: newLevel, reward: reward || null })
        const prog = loadProgress()
        const pi = prog.allPokemon.findIndex(p => p.id === pokemon.id)
        if (pi >= 0) prog.allPokemon[pi].level = newLevel
        else prog.allPokemon.push({ id: pokemon.id, name: pokemon.name, level: newLevel })
        saveProgress(prog)
        window.dispatchEvent(new CustomEvent('poketama-level-up'))
        checkLevelEvolution(pokemon.id, pokemon.name, pokemon.isShiny, newLevel)
        const boosted = { ...statsRef.current, health: Math.min(100, statsRef.current.health + 30) }
        statsRef.current = boosted
        setStats(boosted)
      } else {
        xpRef.current = rawXp
        setXp(rawXp)
      }
      writeSave(pokemon, statsRef.current, xpRef.current, levelRef.current)
    }, 700)
  }, [pokemon])

  // Keep defeat ref in sync for auto-combat interval
  useEffect(() => { triggerWildDefeatRef.current = triggerWildDefeat }, [triggerWildDefeat])

  // ── Auto-combat: wild attacks every 3s if not tapped for 10s ──
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const activeWilds = wildsRef.current.filter(w => !w.isDefeated)
      if (activeWilds.length === 0) return

      activeWilds.forEach(w => {
        if (w.lastTap !== 0 && now - w.lastTap < 10000) return

        const newHp = w.hp - 30

        const dmgId = Date.now() + Math.random()
        setDmgFloats(prev => [...prev, { id: dmgId, x: w.x, text: '-30' }])
        setTimeout(() => setDmgFloats(prev => prev.filter(f => f.id !== dmgId)), 650)

        setUserVibrating(true)
        setTimeout(() => setUserVibrating(false), 300)

        setStats(prev => {
          if (!prev) return prev
          const next = { ...prev, health: Math.max(0, prev.health - 1), energy: Math.max(0, prev.energy - 0.5) }
          statsRef.current = next
          writeSave(pokemon, next, xpRef.current, levelRef.current)
          return next
        })

        if (newHp <= 0) {
          triggerWildDefeatRef.current?.(w.id, w.x, 15)
        } else {
          setWilds(prev => prev.map(ww => ww.id === w.id ? { ...ww, hp: newHp } : ww))
        }
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [pokemon])

  // ── Wild tap: -25hp, white flash, update lastTap ──────────
  const handleWildClick = useCallback((e, wildId) => {
    e.stopPropagation()
    const wild = wildsRef.current.find(w => w.id === wildId)
    if (!wild || wild.isDefeated) return

    const newHp = wild.hp - 25
    const hitX = wild.x

    setWildHits(prev => new Set([...prev, wildId]))
    setTimeout(() => setWildHits(prev => { const n = new Set(prev); n.delete(wildId); return n }), 200)

    const starGroupId = `${Date.now()}-${Math.random()}`
    const newStars = [
      { tx: '20px', ty: '-20px' }, { tx: '-20px', ty: '-20px' },
      { tx: '20px', ty:  '20px' }, { tx: '-20px', ty:  '20px' },
    ].map((d, i) => ({ id: `${starGroupId}-${i}`, x: hitX, ...d }))
    const starIds = new Set(newStars.map(s => s.id))
    setHitStars(prev => [...prev, ...newStars])
    setTimeout(() => setHitStars(prev => prev.filter(s => !starIds.has(s.id))), 400)

    const dmgId = Date.now() + Math.random()
    setDmgFloats(prev => [...prev, { id: dmgId, x: hitX, text: '-25' }])
    setTimeout(() => setDmgFloats(prev => prev.filter(f => f.id !== dmgId)), 650)

    setWilds(prev => prev.map(w => w.id === wildId ? { ...w, hp: Math.max(0, newHp), lastTap: Date.now() } : w))

    if (newHp <= 0) {
      triggerWildDefeat(wildId, hitX, 15)
    }
  }, [triggerWildDefeat])

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
        {isPlacementMode && equippedHat && (
          <HatSVG
            style={{
              position: 'absolute',
              left: `${dragCurrentPos.x}px`,
              top: `${dragCurrentPos.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              cursor: isDragging ? 'grabbing' : 'grab',
              pointerEvents: 'all',
              userSelect: 'none',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true) }}
            onTouchStart={(e) => { e.preventDefault(); setIsDragging(true) }}
          />
        )}

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

        {/* Wild Pokémon — position wrapper + animated sprite (no transform conflict) */}
        {wilds.map(wild => (
          <div
            key={wild.id}
            className={[s.wildWrap, wildDyings.has(wild.id) ? s.wildDying : ''].filter(Boolean).join(' ')}
            style={{ left: `${wild.x}%` }}
            onClick={(e) => handleWildClick(e, wild.id)}
          >
            <div className={s.wildHpBar}>
              <div className={s.wildHpFill} style={{ width: `${(wild.hp / wild.maxHp) * 100}%` }}/>
            </div>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${wild.pokemonId}.png`}
              alt={wild.name}
              className={[
                s.wildSprite,
                wildHits.has(wild.id) ? s.wildHit : '',
                wild.hp <= 25 && !wild.isDefeated ? s.wildCritical : '',
              ].filter(Boolean).join(' ')}
              style={{
                transform: `scaleX(${wild.facingLeft ? -1 : 1})`,
              }}
              draggable={false}
            />
          </div>
        ))}

        {/* Hit stars (per click) */}
        {hitStars.map(star => (
          <div
            key={star.id}
            className={s.hitStar}
            style={{ left: `${star.x}%`, bottom: '32%', '--tx': star.tx, '--ty': star.ty }}
          >✦</div>
        ))}

        {/* Damage floats */}
        {dmgFloats.map(f => (
          <div key={f.id} className={s.dmgFloat} style={{ left: `${f.x}%` }}>{f.text || '-10'}</div>
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
            <div
              key={bubble.key}
              className={s.reactionBubble}
              style={!bubble.auto ? { animationDuration: '1.5s' } : undefined}
            >
              {bubble.emoji ? `${bubble.emoji} ${bubble.text}` : bubble.text}
            </div>
          )}
          <div className={`${s.pokemonShadow} ${isWalking ? s.pokemonShadowWalking : ''}`}/>
          <img
            ref={spriteRef}
            src={spriteUrl}
            alt={pokemon.name}
            className={`${s.pokemonSprite} ${isWalking ? s.pokemonSpriteWalking : ''} ${userVibrating ? s.userVibrating : ''}`}
            style={{ '--flip': facingLeft ? -1 : 1, zIndex: 1, position: 'relative' }}
            draggable={false}
          />
        </div>

        {/* ── Hat : mode placement (overlay + chapeau draggable) ── */}
        {/* ── Badge GOD mode ── */}
        {godMode && (
          <div style={{
            position: 'absolute', top: 8, left: 8, zIndex: 60,
            background: '#FF3B30', color: 'white',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em',
            padding: '2px 6px', borderRadius: '4px',
            pointerEvents: 'none',
          }}>GOD</div>
        )}

        {isPlacementMode && equippedHat && <>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 150,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '16px',
            pointerEvents: 'none',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.92)', borderRadius: '100px',
              padding: '8px 18px', fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px', fontWeight: '300', color: '#1a1a1a',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            }}>
              Placez le chapeau sur la tête de votre Pokémon
            </div>
          </div>
          <HatSVG
            hat={equippedHat}
            onMouseDown={(e) => { e.preventDefault(); setIsDragging(true) }}
            onTouchStart={(e) => { e.preventDefault(); setIsDragging(true) }}
            style={{
              position: 'absolute',
              left: `${dragCurrentPos.x}px`,
              top:  `${dragCurrentPos.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 999,
              cursor: isDragging ? 'grabbing' : 'grab',
              pointerEvents: 'all',
              userSelect: 'none',
            }}
          />
        </>}

        {/* ── Hat : mode normal — suivi temps réel via RAF ── */}
        {!isPlacementMode && equippedHat && (
          <HatSVG hat={equippedHat} facingLeft={facingLeft} style={{
            position: 'absolute',
            left: hatRenderPos.x,
            top:  hatRenderPos.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}/>
        )}

        {/* ── Bouton sac ── */}
        <button
          onClick={() => { setBagOpen(true); setBagClosing(false); setBagNotif(false) }}
          style={{
            position: 'absolute', top: '12px', right: '12px', zIndex: 50,
            width: '38px', height: '38px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', cursor: 'pointer', padding: 0,
          }}
        >
          🎒
          {bagNotif && (
            <span style={{
              position: 'absolute', top: 3, right: 3,
              width: 8, height: 8, borderRadius: '50%',
              background: '#FF3B30',
              border: '1.5px solid rgba(0,0,0,0.3)',
              pointerEvents: 'none',
            }}/>
          )}
        </button>

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
              { key: 'hunger',  label: 'Nourrir',   icon: <IconFork/>    },
              { key: 'thirst',  label: 'Hydrater',  icon: <IconDrop/>    },
              { key: 'entertainment', label: 'Jouer', icon: <IconStar/>   },
              { key: 'toilet',  label: 'Toilettes', icon: <IconExclaim/> },
            ].map(({ key, label, icon }) => {
              const isPlay = key === 'entertainment'
              const cd = isPlay ? 0 : (cooldowns[key] || 0)
              return (
                <button
                  key={key}
                  className={s.actionBtn}
                  disabled={cd > 0}
                  style={cd > 0 ? { opacity: 0.5 } : undefined}
                  onClick={() => {
                    if (isPlay) {
                      setShowMinigames(true)
                    } else {
                      handleAction(key)
                      setCooldowns(prev => ({ ...prev, [key]: 60 }))
                    }
                  }}
                >
                  {icon}
                  <span className={s.actionLabel}>{cd > 0 ? `${cd}s` : label}</span>
                </button>
              )
            })}
            <button className={`${s.actionBtn} ${s.chenilBtn}`} onClick={handleOpenChenil}>
              <KennelIcon/>
              <span className={s.actionLabel}>Chenil</span>
            </button>
          </div>
        </div>

        {/* ── Overlay derrière le drawer ── */}
        {bagOpen && (
          <div
            style={{
              position: 'absolute', inset: 0,
              zIndex: 99,
              background: 'transparent',
            }}
            onClick={() => {
              setBagClosing(true)
              setTimeout(() => { setBagOpen(false); setBagClosing(false) }, 350)
            }}
          />
        )}

        {/* ── Drawer sac — enfant du dashboard, height: 100% ── */}
        {bagOpen && (
          <div
            className={`${s.bagDrawer} ${bagClosing ? s.bagDrawerClosing : ''}`}
            style={{ zIndex: 100 }}
          >
            <BagScreen
              pokemon={pokemon}
              isNight={isNight}
              godMode={godMode}
              embedded
              onClose={() => {
                setBagClosing(true)
                setTimeout(() => { setBagOpen(false); setBagClosing(false) }, 350)
              }}
            />
          </div>
        )}

      </div>

      {levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          reward={levelUpData.reward}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {/* ── Overlay derrière le drawer mini-jeux ── */}
      {showMinigames && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 99, background: 'transparent' }}
          onClick={() => {
            setMinigamesClosing(true)
            setTimeout(() => { setShowMinigames(false); setMinigamesClosing(false) }, 350)
          }}
        />
      )}

      {/* ── Drawer mini-jeux ── */}
      {showMinigames && (() => {
        let scores = {}
        try { scores = JSON.parse(localStorage.getItem(`poketama_scores_${pokemon.id}`)) || {} } catch {}
        const closeMinigames = () => {
          setMinigamesClosing(true)
          setTimeout(() => { setShowMinigames(false); setMinigamesClosing(false) }, 350)
        }
        return (
          <div
            className={`${s.bagDrawer} ${minigamesClosing ? s.bagDrawerClosing : ''}`}
            style={{ zIndex: 100 }}
          >
            <div className={s.minigamesDrawer}>
              <div className={s.minigamesHeader}>
                <div>
                  <p className={s.minigamesTitle}>Mini-jeux</p>
                  <p className={s.minigamesSubtitle}>Score sauvegardé par Pokémon</p>
                </div>
                <button className={s.minigamesClose} onClick={closeMinigames}>×</button>
              </div>
              <div className={s.minigamesGrid}>
                {MINIGAMES.map(game => (
                  <div key={game.id} className={s.minigameCard}>
                    <div
                      className={s.minigameCardIllus}
                      style={{ background: `linear-gradient(135deg, ${game.color}28 0%, ${game.color}55 100%)` }}
                    >
                      <span className={s.minigameCardIcon}>{game.icon}</span>
                    </div>
                    <p className={s.minigameCardName}>{game.name}</p>
                    <p className={s.minigameCardScore}>
                      Record : {scores[game.id] > 0 ? scores[game.id] : '--'}
                    </p>
                    <span className={s.minigameBadgeSoon}>Bientôt</span>
                  </div>
                ))}
                <div className={`${s.minigameCard} ${s.minigameCardPlaceholder}`}>
                  <div className={s.minigameCardIllus} style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className={s.minigameCardIcon}>✦</span>
                  </div>
                  <p className={s.minigameCardName}>À venir</p>
                  <p className={s.minigameCardScore}>—</p>
                  <span className={s.minigameBadgeSoon}>Bientôt</span>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
