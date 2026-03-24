export const GAME_CONFIG = {
  hunger:        { max: 100, decayInterval: 45 * 60 * 1000 },
  thirst:        { max: 100, decayInterval: 30 * 60 * 1000 },
  entertainment: { max: 100, decayInterval: 35 * 60 * 1000 },
  toilet:        { max: 100, decayInterval: 3 * 60 * 60 * 1000 },
  health:        { max: 100, damageDelay: 2 * 60 * 60 * 1000 },
  energy: {
    max: 100,
    wakeHour: 8,
    sleepHour: 22,
    decayPerMinute: 100 / (14 * 60),
    rechargePerHour: 10,
  },
  xp: {
    perAction: 10,
    evolutionThreshold: 100,
  },
  alertThreshold: 30,
}

export const STORAGE_KEY = 'poketama_save'

export function freshStats() {
  return {
    hunger:        GAME_CONFIG.hunger.max,
    thirst:        GAME_CONFIG.thirst.max,
    entertainment: GAME_CONFIG.entertainment.max,
    toilet:        GAME_CONFIG.toilet.max,
    health:        GAME_CONFIG.health.max,
    energy:        GAME_CONFIG.energy.max,
  }
}

// Recalculate stats based on elapsed ms since last save.
// Each stat loses 1 point per full interval elapsed (floor-based, not continuous).
export function recalcStats(stats, elapsedMs) {
  const c = GAME_CONFIG
  const next = { ...stats }

  next.hunger        = Math.max(0, Math.min(c.hunger.max,        stats.hunger        - Math.floor(elapsedMs / c.hunger.decayInterval)))
  next.thirst        = Math.max(0, Math.min(c.thirst.max,        stats.thirst        - Math.floor(elapsedMs / c.thirst.decayInterval)))
  next.entertainment = Math.max(0, Math.min(c.entertainment.max, stats.entertainment - Math.floor(elapsedMs / c.entertainment.decayInterval)))
  next.toilet        = Math.max(0, Math.min(c.toilet.max,        stats.toilet        - Math.floor(elapsedMs / c.toilet.decayInterval)))

  // Energy — depends on current time of day (simplified: use now)
  const hour = new Date().getHours()
  const isAwake = hour >= c.energy.wakeHour && hour < c.energy.sleepHour
  if (isAwake) {
    const decayPerMs = c.energy.decayPerMinute / 60000
    next.energy = Math.max(0, Math.min(c.energy.max, stats.energy - decayPerMs * elapsedMs))
  } else {
    const rechargePerMs = c.energy.rechargePerHour / (3600 * 1000)
    next.energy = Math.max(0, Math.min(c.energy.max, stats.energy + rechargePerMs * elapsedMs))
  }

  // Health — penalty if needs hit 0 during absence (approximated)
  const needsAtZero = ['hunger', 'thirst', 'entertainment', 'toilet'].filter(k => next[k] <= 0).length
  if (needsAtZero > 0 && elapsedMs > c.health.damageDelay) {
    const damageHours = (elapsedMs - c.health.damageDelay) / (3600 * 1000)
    next.health = Math.max(1, stats.health - needsAtZero * damageHours * 5)
  } else {
    // Admin protection: health never reaches 0
    next.health = Math.max(1, Math.min(c.health.max, next.health))
  }

  return next
}

export const INVENTORY_KEY = 'poketama_inventory'
export const DEX_KEY = 'poketama_dex'
export const POOPS_KEY = 'poketama_poops'
export const PROGRESS_KEY = 'poketama_progress'

// { allPokemon: [{ id, name, level }], hatchesDone: number }
export function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { allPokemon: [], hatchesDone: 0 } }
  catch { return { allPokemon: [], hatchesDone: 0 } }
}

export function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data))
}

export const LEVEL_REWARDS = {
  1:  { id: 'potion',           name: 'Potion',             emoji: '🧪', effect: 'health+20',        description: '+20 HP',                  quantity: 2 },
  2:  { id: 'balle',            name: 'Balle Rebondissante', emoji: '⚽', effect: 'entertainment+30', description: '+30 divertissement',       quantity: 2 },
  3:  { id: 'super_potion',     name: 'Super Potion',       emoji: '💊', effect: 'health+50',        description: '+50 HP',                  quantity: 1 },
  4:  { id: 'friandise',        name: 'Friandise Dorée',    emoji: '✨', effect: 'xp+30',            description: '+30 XP bonus',            quantity: 2 },
  5:  { id: 'super_bonbon',     name: 'Super Bonbon',       emoji: '🍬', effect: 'level+1',          description: '+1 Level instantané',     quantity: 1 },
  6:  { id: 'capsule_energie',  name: 'Capsule Énergie',    emoji: '⚡', effect: 'energy+100',       description: 'Énergie pleine',          quantity: 1 },
  7:  { id: 'jouet_plume',      name: 'Jouet Plume',        emoji: '🪶', effect: 'entertainment+50', description: '+50 divertissement',       quantity: 2 },
  8:  { id: 'hyper_potion',     name: 'Hyper Potion',       emoji: '💉', effect: 'health+100',       description: 'HP au maximum',           quantity: 1 },
  9:  { id: 'savon_magique',    name: 'Savon Magique',      emoji: '🧼', effect: 'toilet+100',       description: 'Toilette instantanée',    quantity: 2 },
  10: { id: 'super_bonbon_rare',name: 'Super Bonbon ★',     emoji: '⭐', effect: 'level+2',          description: '+2 Levels instantanés',   quantity: 1 },
}

export const EVOLUTION_STONES = {
  fire:    { id: 'pierre_feu',    name: 'Pierre Feu',    emoji: '🔴', description: 'Pierre ardente' },
  water:   { id: 'pierre_eau',    name: 'Pierre Eau',    emoji: '🔵', description: 'Pierre océanique' },
  thunder: { id: 'pierre_foudre', name: 'Pierre Foudre', emoji: '⚡', description: 'Pierre électrique' },
  moon:    { id: 'pierre_lune',   name: 'Pierre Lune',   emoji: '🌙', description: 'Pierre lunaire' },
  leaf:    { id: 'pierre_plante', name: 'Pierre Plante', emoji: '🍃', description: 'Pierre végétale' },
}

export const WILD_DROPS = [
  { id: 'potion',       name: 'Potion',       emoji: '🧪', effect: 'health+20',        description: '+20 HP',            chance: 0.12 },
  { id: 'balle',        name: 'Balle',        emoji: '⚽', effect: 'entertainment+30', description: '+30 divertissement', chance: 0.05 },
  { id: 'super_bonbon', name: 'Super Bonbon', emoji: '🍬', effect: 'level+1',          description: '+1 Level',          chance: 0.03 },
  { id: 'pierre_feu',    ...EVOLUTION_STONES.fire,    chance: 0.02 },
  { id: 'pierre_eau',    ...EVOLUTION_STONES.water,   chance: 0.02 },
  { id: 'pierre_foudre', ...EVOLUTION_STONES.thunder, chance: 0.02 },
  { id: 'pierre_lune',   ...EVOLUTION_STONES.moon,    chance: 0.02 },
  { id: 'pierre_plante', ...EVOLUTION_STONES.leaf,    chance: 0.02 },
]

export const EVOLUTIONS = {
  // Par niveau
  1:   { evolvesTo: 2,   name: 'Herbizarre',  atLevel: 16, method: 'level' },
  4:   { evolvesTo: 5,   name: 'Reptincel',   atLevel: 16, method: 'level' },
  7:   { evolvesTo: 8,   name: 'Carabaffe',   atLevel: 16, method: 'level' },
  23:  { evolvesTo: 24,  name: 'Arbok',       atLevel: 22, method: 'level' },
  54:  { evolvesTo: 55,  name: 'Akwakwak',    atLevel: 33, method: 'level' },
  58:  { evolvesTo: 59,  name: 'Arcanin',     atLevel: 28, method: 'level' },
  77:  { evolvesTo: 78,  name: 'Galopa',      atLevel: 40, method: 'level' },
  79:  { evolvesTo: 80,  name: 'Flagadoss',   atLevel: 37, method: 'level' },
  92:  { evolvesTo: 93,  name: 'Spectrum',    atLevel: 25, method: 'level' },
  116: { evolvesTo: 117, name: 'Hypocéan',    atLevel: 32, method: 'level' },
  129: { evolvesTo: 130, name: 'Léviator',    atLevel: 20, method: 'level' },
  147: { evolvesTo: 148, name: 'Draco',       atLevel: 30, method: 'level' },
  // Par pierre
  25:  { evolvesTo: 26,  name: 'Raichu',      method: 'stone', stone: 'pierre_foudre' },
  35:  { evolvesTo: 36,  name: 'Mélodelfe',   method: 'stone', stone: 'pierre_lune' },
  39:  { evolvesTo: 40,  name: 'Grodoudou',   method: 'stone', stone: 'pierre_lune' },
  81:  { evolvesTo: 82,  name: 'Magnéton',    method: 'stone', stone: 'pierre_foudre' },
  102: { evolvesTo: 103, name: 'Noadkoko',    method: 'stone', stone: 'pierre_plante' },
  133: { evolvesTo: 134, name: 'Aquali',      method: 'stone', stone: 'pierre_eau' },
}

export function loadInventory() {
  try { return JSON.parse(localStorage.getItem(INVENTORY_KEY)) || [] }
  catch { return [] }
}

export function saveInventory(items) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items))
}

export function addToInventory(itemId, quantity = 1) {
  const items = loadInventory()
  const existing = items.find(i => i.id === itemId)
  if (existing) { existing.quantity += quantity }
  else { items.push({ id: itemId, quantity }) }
  saveInventory(items)
}

export function loadDex() {
  try { return JSON.parse(localStorage.getItem(DEX_KEY)) || [] }
  catch { return [] }
}

export function addToDex(pokemon) {
  const dex = loadDex()
  const idx = dex.findIndex(p => p.id === pokemon.id)
  const entry = { id: pokemon.id, name: pokemon.name, isShiny: pokemon.isShiny ?? false }
  if (idx >= 0) {
    dex[idx] = entry // update name + isShiny on re-hatch
  } else {
    dex.push(entry)
  }
  localStorage.setItem(DEX_KEY, JSON.stringify(dex))
}

// Apply an item's effect directly to the save in localStorage.
// Caller must dispatch 'poketama-stats-update' afterwards.
export function applyItemEffect(itemId, pokemon) {
  try {
    const rawSave = localStorage.getItem(STORAGE_KEY)
    if (!rawSave) return
    const save = JSON.parse(rawSave)
    if (save.pokemon?.id !== pokemon.id) return

    // Look up in LEVEL_REWARDS first, then WILD_DROPS
    const item =
      Object.values(LEVEL_REWARDS).find(r => r.id === itemId) ||
      WILD_DROPS.find(r => r.id === itemId)
    if (!item) return

    const stats = { ...save.stats }
    const eff = item.effect

    if      (eff === 'health+20')         stats.health         = Math.min(100, stats.health + 20)
    else if (eff === 'health+50')         stats.health         = Math.min(100, stats.health + 50)
    else if (eff === 'health+100')        stats.health         = 100
    else if (eff === 'entertainment+30')  stats.entertainment  = Math.min(100, stats.entertainment + 30)
    else if (eff === 'entertainment+50')  stats.entertainment  = Math.min(100, stats.entertainment + 50)
    else if (eff === 'energy+100')        stats.energy         = 100
    else if (eff === 'toilet+100')        stats.toilet         = 100
    else if (eff.startsWith('xp+')) {
      const amount = parseInt(eff.split('+')[1])
      const newXp  = (save.xp || 0) + amount
      if (newXp >= GAME_CONFIG.xp.evolutionThreshold) {
        save.level = (save.level || 1) + 1
        save.xp    = newXp - GAME_CONFIG.xp.evolutionThreshold
      } else {
        save.xp = newXp
      }
    }
    else if (eff === 'level+1') {
      save.level = (save.level || 1) + 1
      save.xp    = 0
    }
    else if (eff === 'level+2') {
      save.level = (save.level || 1) + 2
      save.xp    = 0
    }

    save.stats = stats
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
  } catch {}
}
