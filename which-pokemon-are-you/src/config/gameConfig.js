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
