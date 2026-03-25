import { useState, useEffect } from 'react'
import s from './BagScreen.module.css'
import {
  LEVEL_REWARDS, WILD_DROPS, EVOLUTION_STONES, EVOLUTIONS, STORAGE_KEY,
  loadInventory, saveInventory, applyItemEffect, loadProgress,
} from '../config/gameConfig'
import { HAT_CATALOG } from '../config/hatCatalog'
import scene1 from '../assets/scenes/scene1.png'
import scene2 from '../assets/scenes/scene2.png'
import scene3 from '../assets/scenes/scene3.png'
import scene4 from '../assets/scenes/scene4.png'

// ── Scene data ─────────────────────────────────────────────────
const SCENES = [
  { id: 0, name: 'Prairie', image: scene1, unlocked: true },
  { id: 1, name: 'Forêt',   image: scene2, unlocked: true },
  { id: 2, name: 'Plage',   image: scene3, unlocked: true },
  { id: 3, name: 'Nuit',    image: scene4, unlocked: true },
  { id: 4, name: 'Volcan',  image: null,   unlocked: false, requiredLevel: 15 },
  { id: 5, name: 'Grotte',  image: null,   unlocked: false, requiredLevel: 25 },
  { id: 6, name: 'Neige',   image: null,   unlocked: false, requiredLevel: 40 },
  { id: 7, name: 'Cité',    image: null,   unlocked: false, requiredLevel: 60 },
]

const HATS = Object.values(HAT_CATALOG)

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" opacity="0.8">
      <rect x="5" y="8" width="8" height="8" rx="2"/>
      <path d="M6 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <rect x="8" y="11" width="2" height="3" rx="1"/>
    </svg>
  )
}

// ── Inventory helpers ──────────────────────────────────────────
const LEGACY_IDS = ['croquettes_basiques', 'gourde_fraiche', 'croquettes_miam', 'tisane']
const STONE_IDS  = new Set(Object.values(EVOLUTION_STONES).map(s => s.id))

function cleanAndLoadInventory() {
  const raw = loadInventory()
  const cleaned = raw.filter(item => !LEGACY_IDS.includes(item.id))
  if (cleaned.length !== raw.length) saveInventory(cleaned)
  return cleaned
}

const ALL_ITEM_DEFS = [
  ...Object.values(LEVEL_REWARDS),
  ...WILD_DROPS.filter(w =>
    !Object.values(LEVEL_REWARDS).some(r => r.id === w.id) && !STONE_IDS.has(w.id)
  ),
]
const STONE_DEFS = Object.values(EVOLUTION_STONES)

function loadLevel(pokemon) {
  try {
    const save = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (save?.pokemon?.id === pokemon.id) return save.level ?? 1
  } catch {}
  return 1
}

function getStoneCompatibles(stoneId) {
  const prog = loadProgress()
  const ownedMap = new Map((prog.allPokemon || []).map(p => [p.id, p.name]))
  return Object.entries(EVOLUTIONS)
    .filter(([, evo]) => evo.method === 'stone' && evo.stone === stoneId)
    .filter(([id]) => ownedMap.has(parseInt(id)))
    .map(([id]) => ({ pokemonId: parseInt(id), currentName: ownedMap.get(parseInt(id)) }))
}

// ── Main component ─────────────────────────────────────────────
export default function BagScreen({ pokemon, isNight, onClose, embedded, godMode = false }) {
  const [tab,    setTab]    = useState('items')
  const [items,  setItems]  = useState([])
  const [level,  setLevel]  = useState(1)
  const [toast,  setToast]  = useState(null)
  const [activeScene, setActiveScene] = useState(() => {
    const v = parseInt(localStorage.getItem('poketama_scene'), 10)
    return isNaN(v) ? 0 : v
  })
  const [activeHat, setActiveHat] = useState(() => localStorage.getItem('poketama_hat') || null)

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
      try {
        const rawSave = localStorage.getItem(STORAGE_KEY)
        if (rawSave) {
          const save = JSON.parse(rawSave)
          save.pokemon = { id: evo.evolvesTo, name: evo.name, isShiny: pokemon.isShiny ?? false }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
        }
      } catch {}
      const newItems = items
        .map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0)
      setItems(newItems)
      saveInventory(newItems)
      window.dispatchEvent(new CustomEvent('poketama-evolve', {
        detail: { oldId: pokemon.id, oldName: pokemon.name, newId: evo.evolvesTo, newName: evo.name, isShiny: pokemon.isShiny ?? false },
      }))
    } else {
      showToast(`Cette pierre n'a aucun effet sur ${pokemon.name}…`)
    }
  }

  function handleSceneSelect(sceneId) {
    setActiveScene(sceneId)
    localStorage.setItem('poketama_scene', String(sceneId))
    window.dispatchEvent(new CustomEvent('poketama-scene-change', { detail: { sceneId } }))
  }

  function handleHatSelect(hatId) {
    const next = activeHat === hatId ? null : hatId
    setActiveHat(next)
    if (next) localStorage.setItem('poketama_hat', next)
    else localStorage.removeItem('poketama_hat')
    window.dispatchEvent(new CustomEvent('poketama-hat-change', { detail: { hatId: next } }))
  }

  // Split inventory
  const regularAvailable = items.filter(i => i.quantity > 0 && !STONE_IDS.has(i.id))
  const stonesAvailable  = items.filter(i => i.quantity > 0 &&  STONE_IDS.has(i.id))
  const locked = godMode ? [] : Object.entries(LEVEL_REWARDS)
    .filter(([lvl]) => parseInt(lvl) > level)
    .map(([lvl, def]) => ({ ...def, requiredLevel: parseInt(lvl) }))

  const mode = isNight ? s.night : s.day

  return (
    <div className={`${s.page} ${mode} ${embedded ? s.embedded : ''}`}>
      <div className={s.header}>
        <p className={s.title}>Bag</p>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)', fontSize: '22px', lineHeight: 1, padding: '4px 8px',
          }}>×</button>
        )}
      </div>

      {/* ── Internal tabs ── */}
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'items'  ? s.tabActive : ''}`} onClick={() => setTab('items')}>🎒 Objets</button>
        <button className={`${s.tab} ${tab === 'scenes' ? s.tabActive : ''}`} onClick={() => setTab('scenes')}>🌿 Décors</button>
        <button className={`${s.tab} ${tab === 'skins'  ? s.tabActive : ''}`} onClick={() => setTab('skins')}>👒 Skins</button>
      </div>

      <div className={s.content}>

        {/* ══ TAB OBJETS ══ */}
        {tab === 'items' && <>

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
                      <button className={s.useBtn} onClick={() => handleUse(item)}>Utiliser</button>
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
                    <span className={s.emoji} style={{ filter: 'grayscale(1) brightness(0.5)' }}>{def.emoji}</span>
                    <p className={s.itemName}>{def.name}</p>
                    <p className={s.itemDesc}>{def.description}</p>
                    <div className={s.lockBadge}>Niveau {def.requiredLevel} requis</div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </>}

        {/* ══ TAB DÉCORS ══ */}
        {tab === 'scenes' && (
          <section>
            <p className={s.sectionLabel}>Décors disponibles</p>
            <div className={s.sceneGrid}>
              {SCENES.map(scene => {
                const isActive  = activeScene === scene.id
                const unlocked  = godMode || scene.unlocked || (scene.requiredLevel && level >= scene.requiredLevel)
                return (
                  <button
                    key={scene.id}
                    className={[s.sceneCard, isActive ? s.sceneActive : '', !unlocked ? s.sceneLocked : ''].filter(Boolean).join(' ')}
                    onClick={unlocked ? () => handleSceneSelect(scene.id) : undefined}
                    disabled={!unlocked}
                  >
                    <div className={s.sceneThumbnailWrap}>
                      {scene.image
                        ? <img src={scene.image} alt={scene.name} className={s.sceneThumbnail} draggable={false}/>
                        : <div className={s.scenePlaceholder}/>
                      }
                      {isActive && (
                        <div className={s.sceneCheck}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="8" fill="rgba(255,255,255,0.9)"/>
                            <path d="M4 8l3 3 5-5" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                      {!unlocked && (
                        <div className={s.sceneLockOverlay}>
                          <LockIcon/>
                          <span className={s.sceneLockLabel}>Niv. {scene.requiredLevel}</span>
                        </div>
                      )}
                    </div>
                    <span className={s.sceneName}>{scene.name}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ══ TAB SKINS ══ */}
        {tab === 'skins' && (
          <section>
            <p className={s.sectionLabel}>Chapeaux</p>
            {activeHat && (
              <button
                className={s.repositionBtn}
                onClick={() => window.dispatchEvent(new CustomEvent('poketama-hat-reposition'))}
              >
                ↺ Repositionner le chapeau
              </button>
            )}
            <div className={s.hatGrid}>
              {HATS.map(hat => {
                const isActive  = activeHat === hat.id
                const unlocked  = godMode || level >= hat.requiredLevel
                return (
                  <button
                    key={hat.id}
                    className={[s.hatCard, isActive ? s.hatActive : '', !unlocked ? s.hatLocked : ''].filter(Boolean).join(' ')}
                    onClick={unlocked ? () => handleHatSelect(hat.id) : undefined}
                    disabled={!unlocked}
                  >
                    <div className={s.hatIconWrap}>
                      <img
                        src={hat.image}
                        alt={hat.name}
                        draggable={false}
                        style={{
                          width: 64, height: 64, objectFit: 'contain',
                          filter: unlocked ? 'none' : 'grayscale(1) brightness(0.5)',
                        }}
                      />
                      {!unlocked && (
                        <div className={s.hatLockOverlay}>
                          <LockIcon/>
                        </div>
                      )}
                    </div>
                    <span className={s.hatName}>{hat.name}</span>
                    {!unlocked && (
                      <span className={s.hatLockLabel}>Niv. {hat.requiredLevel}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

      </div>

      {toast && <div className={s.toast}>{toast}</div>}
    </div>
  )
}
