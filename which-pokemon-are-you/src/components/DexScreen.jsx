import { useState, useEffect } from 'react'
import s from './DexScreen.module.css'
import { loadDex, loadInventory, LEVEL_REWARDS } from '../config/gameConfig'

// Curated pool of 20 Pokémon shown in the dex
const POKEMON_POOL = [
  { id: 1, name: 'Bulbasaur' },  { id: 4, name: 'Charmander' },
  { id: 7, name: 'Squirtle' },   { id: 25, name: 'Pikachu' },
  { id: 39, name: 'Jigglypuff' },{ id: 52, name: 'Meowth' },
  { id: 133, name: 'Eevee' },    { id: 152, name: 'Chikorita' },
  { id: 155, name: 'Cyndaquil' },{ id: 158, name: 'Totodile' },
  { id: 175, name: 'Togepi' },   { id: 252, name: 'Treecko' },
  { id: 255, name: 'Torchic' },  { id: 258, name: 'Mudkip' },
  { id: 300, name: 'Skitty' },   { id: 468, name: 'Togekiss' },
  { id: 470, name: 'Leafeon' },  { id: 471, name: 'Glaceon' },
  { id: 700, name: 'Sylveon' },  { id: 718, name: 'Zygarde' },
]

const ALL_ITEMS = Object.values(LEVEL_REWARDS)

export default function DexScreen({ isNight }) {
  const [tab,      setTab]      = useState('pokemon') // 'pokemon' | 'items'
  const [dex,      setDex]      = useState([])
  const [items,    setItems]    = useState([])
  const [selected, setSelected] = useState(null) // { id, name } for modal

  useEffect(() => {
    setDex(loadDex())
    setItems(loadInventory())
  }, [])

  const dexMap = new Map(dex.map(p => [p.id, p]))
  const discoveredIds = new Set(dex.map(p => p.id))
  const discoveredItemIds = new Set(items.map(i => i.id))

  // Ensure user's hatched pokemon appear even if not in pool
  const poolIds = new Set(POKEMON_POOL.map(p => p.id))
  const extraDiscovered = dex.filter(p => !poolIds.has(p.id))
  const fullPool = [...extraDiscovered, ...POKEMON_POOL]

  const spriteUrl = (id, isShiny = false) => isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

  return (
    <div className={`${s.page} ${isNight ? s.night : s.day}`}>
      <div className={s.header}>
        <p className={s.title}>Collection</p>
        <p className={s.subtitle}>{dex.length} Pokémon découvert{dex.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Internal tabs */}
      <div className={s.tabs}>
        <button
          className={`${s.tabBtn} ${tab === 'pokemon' ? s.tabActive : ''}`}
          onClick={() => setTab('pokemon')}
        >Pokémon</button>
        <button
          className={`${s.tabBtn} ${tab === 'items' ? s.tabActive : ''}`}
          onClick={() => setTab('items')}
        >Objets</button>
      </div>

      <div className={s.content}>
        {tab === 'pokemon' && (
          <div className={s.grid3}>
            {fullPool.map(p => {
              const known = discoveredIds.has(p.id)
              const dexEntry = dexMap.get(p.id)
              const isShiny = dexEntry?.isShiny ?? false
              return (
                <div
                  key={p.id}
                  className={`${s.pokeCard} ${known ? s.known : s.unknown}`}
                  onClick={() => known && setSelected({ id: p.id, name: dexEntry?.name ?? p.name, isShiny })}
                >
                  <img
                    src={spriteUrl(p.id, known && isShiny)}
                    alt={known ? p.name : '???'}
                    className={s.pokeSprite}
                    style={known ? {} : { filter:'grayscale(1) brightness(0.3)' }}
                    draggable={false}
                  />
                  <p className={s.pokeName}>{known ? (dexEntry?.name ?? p.name) : '???'}</p>
                  <p className={s.pokeNum}>#{String(p.id).padStart(3, '0')}</p>
                  {known && isShiny && (
                    <span style={{
                      position: 'absolute', top: 4, right: 4,
                      fontSize: 9, fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 700, color: '#FFD700',
                      background: 'rgba(0,0,0,0.55)', borderRadius: 6,
                      padding: '2px 5px', lineHeight: 1.4,
                      letterSpacing: '0.03em', pointerEvents: 'none',
                    }}>✨ Shiny</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'items' && (
          <div className={s.grid3}>
            {ALL_ITEMS.map(item => {
              const found = discoveredItemIds.has(item.id)
              return (
                <div key={item.id} className={`${s.itemCard} ${found ? s.known : s.unknown}`}>
                  <span className={s.itemEmoji} style={found ? {} : { filter:'grayscale(1) brightness(0.4)' }}>
                    {item.emoji}
                  </span>
                  <p className={s.itemCardName}>{found ? item.name : '???'}</p>
                  <p className={s.itemCardDesc}>{found ? item.description : `Niveau ${Object.entries(LEVEL_REWARDS).find(([,v]) => v.id === item.id)?.[0]}`}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pokemon detail modal */}
      {selected && (
        <div className={s.modalOverlay} onClick={() => setSelected(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <button className={s.modalClose} onClick={() => setSelected(null)}>×</button>
            <img
              src={spriteUrl(selected.id, selected.isShiny)}
              alt={selected.name}
              className={s.modalSprite}
              style={selected.isShiny ? { filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.6))' } : {}}
              draggable={false}
            />
            {selected.isShiny && (
              <p style={{ fontSize: 12, color: '#FFD700', fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.04em' }}>
                ✨ Shiny
              </p>
            )}
            <p className={s.modalName}>{selected.name}</p>
            <p className={s.modalNum}>#{String(selected.id).padStart(3, '0')}</p>
            <button className={s.modalDone} onClick={() => setSelected(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
