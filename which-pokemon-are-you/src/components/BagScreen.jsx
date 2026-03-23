import { useState, useEffect } from 'react'
import s from './BagScreen.module.css'
import {
  LEVEL_REWARDS, STORAGE_KEY,
  loadInventory, saveInventory, applyItemEffect,
} from '../config/gameConfig'

function loadLevel(pokemon) {
  try {
    const save = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (save?.pokemon?.id === pokemon.id) return save.level ?? 1
  } catch {}
  return 1
}

export default function BagScreen({ pokemon, isNight }) {
  const [items,  setItems]  = useState([])
  const [level,  setLevel]  = useState(1)
  const [toast,  setToast]  = useState(null)

  useEffect(() => {
    setItems(loadInventory())
    setLevel(loadLevel(pokemon))

    const handler = () => {
      setItems(loadInventory())
      setLevel(loadLevel(pokemon))
    }
    window.addEventListener('poketama-stats-update', handler)
    return () => window.removeEventListener('poketama-stats-update', handler)
  }, [pokemon])

  function handleUse(item) {
    applyItemEffect(item.id, pokemon)
    const newItems = items
      .map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
      .filter(i => i.quantity > 0)
    setItems(newItems)
    saveInventory(newItems)
    window.dispatchEvent(new CustomEvent('poketama-stats-update'))

    const def = Object.values(LEVEL_REWARDS).find(r => r.id === item.id)
    setToast(`${def?.emoji || ''} ${def?.description || 'Utilisé !'}`)
    setTimeout(() => setToast(null), 2000)
  }

  // Available: items in inventory
  const available = items.filter(i => i.quantity > 0)

  // Locked: LEVEL_REWARDS for levels higher than current
  const locked = Object.entries(LEVEL_REWARDS)
    .filter(([lvl]) => parseInt(lvl) > level)
    .map(([lvl, def]) => ({ ...def, requiredLevel: parseInt(lvl) }))

  return (
    <div className={`${s.page} ${isNight ? s.night : s.day}`}>
      <div className={s.header}>
        <p className={s.title}>Bag</p>
        <p className={s.subtitle}>{available.length} objet{available.length !== 1 ? 's' : ''} disponible{available.length !== 1 ? 's' : ''}</p>
      </div>

      <div className={s.content}>

        {available.length > 0 && (
          <section>
            <p className={s.sectionLabel}>Disponibles</p>
            <div className={s.grid}>
              {available.map(item => {
                const def = Object.values(LEVEL_REWARDS).find(r => r.id === item.id)
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

        {available.length === 0 && (
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
