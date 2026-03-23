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

// Recalculate stats based on elapsed ms since last save
export function recalcStats(stats, elapsedMs) {
  const c = GAME_CONFIG
  const next = { ...stats }

  const decay = (val, max, interval) =>
    Math.max(0, val - (max / interval) * elapsedMs)

  next.hunger        = decay(stats.hunger,        c.hunger.max,        c.hunger.decayInterval)
  next.thirst        = decay(stats.thirst,        c.thirst.max,        c.thirst.decayInterval)
  next.entertainment = decay(stats.entertainment, c.entertainment.max, c.entertainment.decayInterval)
  next.toilet        = decay(stats.toilet,        c.toilet.max,        c.toilet.decayInterval)

  // Energy — depends on current time of day (simplified: use now)
  const hour = new Date().getHours()
  const isAwake = hour >= c.energy.wakeHour && hour < c.energy.sleepHour
  if (isAwake) {
    const decayPerMs = c.energy.decayPerMinute / 60000
    next.energy = Math.max(0, stats.energy - decayPerMs * elapsedMs)
  } else {
    const rechargePerMs = c.energy.rechargePerHour / (3600 * 1000)
    next.energy = Math.min(c.energy.max, stats.energy + rechargePerMs * elapsedMs)
  }

  // Health — simple penalty if any need was 0 (we approximate)
  const needsAtZero = ['hunger', 'thirst', 'entertainment', 'toilet'].filter(k => next[k] <= 0).length
  if (needsAtZero > 0 && elapsedMs > c.health.damageDelay) {
    const damageHours = (elapsedMs - c.health.damageDelay) / (3600 * 1000)
    next.health = Math.max(0, stats.health - needsAtZero * damageHours * 5)
  }

  return next
}

export function tickStats(stats) {
  const c = GAME_CONFIG
  const TICK_MS = 60 * 1000
  return recalcStats(stats, TICK_MS)
}

export const INVENTORY_KEY = 'poketama_inventory'
export const DEX_KEY = 'poketama_dex'

export const LEVEL_REWARDS = {
  1:  { id: 'croquettes_basiques', name: 'Croquettes Basiques', emoji: '🍖', effect: 'hunger+20', description: '+20 faim', quantity: 3 },
  2:  { id: 'gourde_fraiche', name: 'Gourde Fraîche', emoji: '💧', effect: 'thirst+20', description: '+20 soif', quantity: 3 },
  3:  { id: 'balle', name: 'Balle Rebondissante', emoji: '⚽', effect: 'entertainment+20', description: '+20 divertissement', quantity: 2 },
  4:  { id: 'friandise', name: 'Friandise Dorée', emoji: '✨', effect: 'xp+20', description: '+20 XP bonus', quantity: 2 },
  5:  { id: 'croquettes_miam', name: 'Croquettes Miam', emoji: '🍗', effect: 'hunger_24h', description: 'Rassasié 24h', quantity: 1 },
  6:  { id: 'tisane', name: 'Tisane Revigorante', emoji: '🍵', effect: 'thirst+50', description: '+50 soif', quantity: 2 },
  7:  { id: 'jouet_plume', name: 'Jouet Plume', emoji: '🪶', effect: 'entertainment+40', description: '+40 divertissement', quantity: 2 },
  8:  { id: 'capsule_energie', name: 'Capsule Énergie', emoji: '⚡', effect: 'energy+100', description: 'Énergie pleine', quantity: 1 },
  9:  { id: 'savon_magique', name: 'Savon Magique', emoji: '🧼', effect: 'toilet+100', description: 'Toilette instantanée', quantity: 2 },
  10: { id: 'bandana', name: 'Bandana Aventurier', emoji: '🎀', effect: 'cosmetic', description: 'Cosmétique exclusif', quantity: 1 },
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
  if (!dex.find(p => p.id === pokemon.id)) {
    dex.push({ id: pokemon.id, name: pokemon.name })
    localStorage.setItem(DEX_KEY, JSON.stringify(dex))
  }
}

// Apply an item's effect directly to the save in localStorage
// Then caller should dispatch window event 'poketama-stats-update'
export function applyItemEffect(itemId, pokemon) {
  try {
    const rawSave = localStorage.getItem(STORAGE_KEY)
    if (!rawSave) return
    const save = JSON.parse(rawSave)
    if (save.pokemon?.id !== pokemon.id) return
    const item = Object.values(LEVEL_REWARDS).find(r => r.id === itemId)
    if (!item || item.effect === 'cosmetic') return
    const stats = { ...save.stats }
    const eff = item.effect
    if (eff === 'hunger_24h')            { stats.hunger        = 100 }
    else if (eff.startsWith('hunger+'))  { stats.hunger        = Math.min(100, stats.hunger        + parseInt(eff.split('+')[1])) }
    else if (eff.startsWith('thirst+'))  { stats.thirst        = Math.min(100, stats.thirst        + parseInt(eff.split('+')[1])) }
    else if (eff.startsWith('entertainment+')) { stats.entertainment = Math.min(100, stats.entertainment + parseInt(eff.split('+')[1])) }
    else if (eff.startsWith('toilet+'))  { stats.toilet        = Math.min(100, stats.toilet        + parseInt(eff.split('+')[1])) }
    else if (eff.startsWith('energy+'))  { stats.energy        = Math.min(100, stats.energy        + parseInt(eff.split('+')[1])) }
    else if (eff.startsWith('xp+'))      { save.xp             = Math.min(GAME_CONFIG.xp.evolutionThreshold - 1, (save.xp || 0) + parseInt(eff.split('+')[1])) }
    save.stats = stats
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
  } catch {}
}
