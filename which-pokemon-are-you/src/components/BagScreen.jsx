import { useState, useEffect } from 'react'
import s from './BagScreen.module.css'
import {
  LEVEL_REWARDS, WILD_DROPS, EVOLUTION_STONES, EVOLUTIONS, STORAGE_KEY,
  loadInventory, saveInventory, applyItemEffect, loadProgress,
} from '../config/gameConfig'

const LEGACY_IDS = ['croquettes_basiques', 'gourde_fraiche', 'croquettes_miam', 'tisane']
const STONE_IDS  = new Set(Object.values(EVOLUTION_STONES).map(s => s.id))

function cleanAndLoadInventory() {
  const raw = loadInventory()
  const cleaned = raw.filter(item => !LEGACY_IDS.includes(item.id))
  if (cleaned.length !== raw.length) saveInventory(cleaned)
  return cleaned
}

// Item metadata — regular items only (no stones)
const ALL_ITEM_DEFS = [
  ...Object.values(LEVEL_REWARDS),
  ...WILD_DROPS.filter(w =>
    !Object.values(LEVEL_REWARDS).some(r => r.id === w.id) && !STONE_IDS.has(w.id)
  ),
]

// Stone metadata from EVOLUTION_STONES
const STONE_DEFS = Object.values(EVOLUTION_STONES)

function loadLevel(pokemon) {
  try {
    const save = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (save?.pokemon?.id === pokemon.id) return save.level ?? 1
  } catch {}
  return 1
}

// Returns list of { pokemonId, currentName } for pokemon in collection that can use this stone
function getStoneCompatibles(stoneId) {
  const prog = loadProgress()
  const ownedMap = new Map((prog.allPokemon || []).map(p => [p.id, p.name]))
  return Object.entries(EVOLUTIONS)
    .filter(([, evo]) => evo.method === 'stone' && evo.stone === stoneId)
    .filter(([id]) => ownedMap.has(parseInt(id)))
    .map(([id]) => ({ pokemonId: parseInt(id), currentName: ownedMap.get(parseInt(id)) }))
}

export default function BagScreen({ pokemon, isNight }) {
  const [items,  setItems]  = useState([])
  const [level,  setLevel]  = useState(1)
  const [toast,  setToast]  = useState(null)

  useEffect(() => {
    setItems(cleanAndLoadInventory())
    setLevel(loadLevel(pokemon))

    const handler = () => {
      setItems(cleanAndLoadInventory())
      setLevel(loadLevel(pokemon))
    }
    window.addEventListener('poketama-stats-update', handler)
    return () => window.removeEventListener('poketama-stats-update', handler)
  }, [pokemon])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleUse(item) {
    applyItemEffect(item.id, pokemon)
    const newItems = items
      .map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0)
    setItems(newItems)
    saveInventory(newItems)
    window.dispatchEvent(new CustomEvent('poketama-stats-update'))

    const def = ALL_ITEM_DEFS.find(r => r.id === item.id)
    showToast(`${def?.emoji || ''} ${def?.description || 'Utilisé !'}`)
  }

  function handleStoneUse(item) {
    const evo = EVOLUTIONS[pokemon.id]
    if (evo && evo.method === 'stone' && evo.stone === item.id) {
      // Write evolved pokemon to STORAGE_KEY (keep stats/xp/level)
      try {
        const rawSave = localStorage.getItem(STORAGE_KEY)
        if (rawSave) {
          const save = JSON.parse(rawSave)
          save.pokemon = { id: evo.evolvesTo, name: evo.name, isShiny: pokemon.isShiny ?? false }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
        }
      } catch {}
      // Consume stone
      const newItems = items
        .map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0)
      setItems(newItems)
      saveInventory(newItems)
      // Trigger evolution animation
      window.dispatchEvent(new CustomEvent('poketama-evolve', {
        detail: { oldId: pokemon.id, oldName: pokemon.name, newId: evo.evolvesTo, newName: evo.name, isShiny: pokemon.isShiny ?? false },
      }))
    } else {
      showToast(`Cette pierre n'a aucun effet sur ${pokemon.name}…`)
    }
  }

  // Split inventory
  const regularAvailable = items.filter(i => i.quantity > 0 && !STONE_IDS.has(i.id))
  const stonesAvailable  = items.filter(i => i.quantity > 0 &&  STONE_IDS.has(i.id))

  // Locked: LEVEL_REWARDS for levels higher than current
  const locked = Object.entries(LEVEL_REWARDS)
    .filter(([lvl]) => parseInt(lvl) > level)
    .map(([lvl, def]) => ({ ...def, requiredLevel: parseInt(lvl) }))

  return (
    <div className={`${s.page} ${isNight ? s.night : s.day}`}>
      <div className={s.header}>
        <p className={s.title}>Bag</p>
        <p className={s.subtitle}>{regularAvailable.length + stonesAvailable.length} objet{regularAvailable.length + stonesAvailable.length !== 1 ? 's' : ''} disponible{regularAvailable.length + stonesAvailable.length !== 1 ? 's' : ''}</p>
      </div>

      <div className={s.content}>

        {regularAvailable.length > 0 && (
          <section>
            <p className={s.sectionLabel}>Disponibles</p>
            <div className={s.grid}>
              {regularAvailable.map(item => {
                const def = ALL_ITEM_DEFS.find(r => r.id === item.id)
                if (!def) return null
                return (
                  <div key={item.id} className={s.card}>
                    <div className={s.badge}>x{item.quantity}</div>
                    <span className={s.emoji}>{def.emoji}</span>
                    <p className={s.itemName}>{def.name}</p>
                    <p className={s.itemDesc}>{def.description}</p>
                    <button className={s.useBtn} onClick={() => handleUse(item)}>
                      Utiliser
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {stonesAvailable.length > 0 && (
          <section>
            <p className={s.sectionLabel}>Pierres d'évolution</p>
            <div className={s.stoneList}>
              {stonesAvailable.map(item => {
                const def = STONE_DEFS.find(d => d.id === item.id)
                if (!def) return null
                const compatibles = getStoneCompatibles(item.id)
                const canUse = EVOLUTIONS[pokemon.id]?.method === 'stone' && EVOLUTIONS[pokemon.id]?.stone === item.id
                return (
                  <div key={item.id} className={`${s.stoneCard} ${!canUse ? s.stoneInactive : ''}`}>
                    <div className={s.badge}>x{item.quantity}</div>
                    <span className={s.stoneEmoji}>{def.emoji}</span>
                    <div className={s.stoneInfo}>
                      <p className={s.itemName}>{def.name}</p>
                      {compatibles.length > 0 ? (
                        <p className={s.stoneHint}>
                          Utilisable sur : {compatibles.map((c, i) => (
                            <span key={c.pokemonId}>
                              {i > 0 && ', '}
                              {c.pokemonId === pokemon.id
                                ? <strong>{c.currentName}</strong>
                                : <span style={{ opacity: 0.7 }}>{c.currentName}</span>
                              }
                            </span>
                          ))}
                        </p>
                      ) : (
                        <p className={s.stoneHintNone}>Aucun Pokémon compatible</p>
                      )}
                    </div>
                    <button
                      className={`${s.stoneBtn} ${!canUse ? s.stoneBtnDisabled : ''}`}
                      onClick={() => handleStoneUse(item)}
                    >
                      {canUse ? 'Utiliser' : 'Incompatible'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {regularAvailable.length === 0 && stonesAvailable.length === 0 && (
          <div className={s.empty}>
            <p className={s.emptyText}>Votre bag est vide.</p>
            <p className={s.emptyHint}>Montez en niveau pour débloquer des objets !</p>
          </div>
        )}

        {locked.length > 0 && (
          <section>
            <p className={s.sectionLabel}>Verrouillés</p>
            <div className={s.grid}>
              {locked.map(def => (
                <div key={def.id} className={`${s.card} ${s.lockedCard}`}>
                  <span className={s.emoji} style={{ filter:'grayscale(1) brightness(0.5)' }}>{def.emoji}</span>
                  <p className={s.itemName}>{def.name}</p>
                  <p className={s.itemDesc}>{def.description}</p>
                  <div className={s.lockBadge}>Niveau {def.requiredLevel} requis</div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {toast && <div className={s.toast}>{toast}</div>}
    </div>
  )
}
