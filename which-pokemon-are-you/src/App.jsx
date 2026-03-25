import { useState, useRef, useEffect } from 'react'
import Landing from './components/Landing'
import EggSelector from './components/EggSelector'
import HatchScreen from './components/HatchScreen'
import PokemonHome from './components/PokemonHome'
import TabBar from './components/TabBar'
import BagScreen from './components/BagScreen'
import DexScreen from './components/DexScreen'
import AccountScreen from './components/AccountScreen'
import { addToDex, STORAGE_KEY, INVENTORY_KEY, DEX_KEY, PROGRESS_KEY, loadProgress, saveProgress } from './config/gameConfig'
import EvolutionOverlay from './components/EvolutionOverlay'
import './App.css'

function PokeballIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 16h30" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
    </svg>
  )
}

function SideHomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <polyline points="9 21 9 12 15 12 15 21"/>
    </svg>
  )
}

function SideBagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

function SideDexIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )
}

function SideAccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

const SIDEBAR_TABS = [
  { id: 'home',    label: 'Accueil', Icon: SideHomeIcon    },
  { id: 'bag',     label: 'Sac',     Icon: SideBagIcon     },
  { id: 'dex',     label: 'Pokédex', Icon: SideDexIcon     },
  { id: 'account', label: 'Profil',  Icon: SideAccountIcon },
]

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>  <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"  x2="5.64"  y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/> <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function SideEggIcon() {
  return (
    <div style={{
      width: 28,
      height: 35,
      background: 'linear-gradient(145deg, #f0ede8, #d4c9b8)',
      borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
      border: '1px solid rgba(0,0,0,0.1)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      flexShrink: 0,
    }}/>
  )
}

function computeHatchesAvailable() {
  try {
    const prog = loadProgress()
    const { allPokemon = [], hatchesDone = 0 } = prog
    const totalLevels = allPokemon.reduce((sum, p) => sum + (p.level || 1), 0)
    const firstPokemonLv10 = allPokemon.some(p => (p.level || 1) >= 10) ? 1 : 0
    const fromLevels = Math.floor(totalLevels / 15)
    return Math.max(0, Math.max(firstPokemonLv10, fromLevels) - hatchesDone)
  } catch { return 0 }
}

export default function App() {
  const [screen, setScreen]     = useState('landing')
  const [phase,  setPhase]      = useState('idle')   // 'idle' | 'exit' | 'enter'
  const [isNight, setIsNight]   = useState(true)
  const [hatchData, setHatchData] = useState(null)   // { egg, pokemon }
  const [activeTab, setActiveTab] = useState('home')
  const [hatchesAvailable, setHatchesAvailable] = useState(() => computeHatchesAvailable())
  const [pokemonSwitchKey, setPokemonSwitchKey] = useState(0)
  const [evolutionData, setEvolutionData] = useState(null) // { oldId, oldName, newId, newName, isShiny }
  const [newItemUnlocked, setNewItemUnlocked] = useState(false)

  const rehatchRef = useRef(false)

  // Stable stars — generated once
  const stars = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      top:      `${Math.random() * 92}%`,
      left:     `${Math.random() * 100}%`,
      size:     1 + Math.random() * 1.5,
      duration: `${2 + Math.random() * 3}s`,
      delay:    `${Math.random() * 4}s`,
    }))
  ).current

  // Recompute when returning to home (catches level-ups that happened while app open)
  useEffect(() => {
    if (screen === 'home') setHatchesAvailable(computeHatchesAvailable())
  }, [screen])

  // Listen for level-up events dispatched by PokemonHome
  useEffect(() => {
    const handler = () => {
      setHatchesAvailable(computeHatchesAvailable())
      setNewItemUnlocked(true)
    }
    window.addEventListener('poketama-level-up', handler)
    return () => window.removeEventListener('poketama-level-up', handler)
  }, [])

  // Listen for evolution events
  useEffect(() => {
    const handler = (e) => setEvolutionData(e.detail)
    window.addEventListener('poketama-evolve', handler)
    return () => window.removeEventListener('poketama-evolve', handler)
  }, [])

  const goTo = (target) => {
    setPhase('exit')
    setTimeout(() => {
      setScreen(target)
      setPhase('enter')
    }, 350)
  }

  function handleEvolutionClose() {
    const { oldId, newId, newName, isShiny } = evolutionData
    const newPokemon = { id: newId, name: newName, isShiny: isShiny ?? false }
    // Update progress: replace old pokemon entry with evolved one
    const prog = loadProgress()
    const pi = prog.allPokemon.findIndex(p => p.id === oldId)
    if (pi >= 0) prog.allPokemon[pi] = { ...prog.allPokemon[pi], id: newId, name: newName }
    saveProgress(prog)
    // Add to dex
    addToDex(newPokemon)
    setEvolutionData(null)
    setHatchData(d => ({ ...d, pokemon: newPokemon }))
    setPokemonSwitchKey(k => k + 1)
    setActiveTab('home')
  }

  function handleSwitchPokemon(newPokemon) {
    setHatchData(d => ({ ...d, pokemon: newPokemon }))
    setPokemonSwitchKey(k => k + 1)
    setActiveTab('home')
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(INVENTORY_KEY)
    localStorage.removeItem(DEX_KEY)
    localStorage.removeItem(PROGRESS_KEY)
    setHatchData(null)
    setActiveTab('home')
    setHatchesAvailable(0)
    goTo('landing')
  }

  function handleEggButton() {
    if (hatchesAvailable <= 0) return
    rehatchRef.current = true
    goTo('selector')
  }

  const mode = isNight ? 'is-night' : 'is-day'

  const screenCls = [
    'screen-wrapper',
    phase === 'exit'  ? 'screen-exit'  : '',
    phase === 'enter' ? 'screen-enter' : '',
  ].filter(Boolean).join(' ')

  const showNav = screen === 'home'

  return (
    <div className={`app-root ${mode}${showNav ? ' has-sidebar' : ''}`}>

      {/* Fixed background — always visible, never affected by screen transitions */}
      <div className={`bg-layer ${mode}`}>
        <div className="bg-day"/>
        <div className="bg-night"/>
        <div className="sun"/>
        <div className="cloud cloud1"/>
        <div className="cloud cloud2"/>
        <div className="cloud cloud3"/>
        {isNight && stars.map(star => (
          <span
            key={star.id}
            className="star"
            style={{
              top:               star.top,
              left:              star.left,
              width:             `${star.size}px`,
              height:            `${star.size}px`,
              animationDuration: star.duration,
              animationDelay:    star.delay,
            }}
          />
        ))}
      </div>

      {/* Mobile day/night toggle */}
      <button
        className={`app-toggle ${mode}`}
        onClick={() => setIsNight(n => !n)}
        aria-label={isNight ? 'Switch to day' : 'Switch to night'}
      >
        {isNight ? <MoonIcon/> : <SunIcon/>}
      </button>

      {/* Desktop sidebar — only on home screen */}
      {showNav && <aside className={`app-sidebar ${mode}`}>
        <div className="sidebar-logo">
          <PokeballIcon/>
        </div>
        <nav className="sidebar-nav">
          {SIDEBAR_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={[
                'sidebar-tab',
                activeTab === id && screen === 'home' ? 'active' : '',
                screen !== 'home' ? 'sidebar-tab-disabled' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => {
                if (screen !== 'home') return
                setActiveTab(id)
                if (id === 'bag') setNewItemUnlocked(false)
              }}
              title={label}
              style={{ position: 'relative' }}
            >
              <Icon/>
              {id === 'bag' && newItemUnlocked && (
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  background: '#FF3B30',
                  borderRadius: '50%',
                  border: `1.5px solid ${isNight ? '#1a1a2e' : '#F7F4EF'}`,
                  pointerEvents: 'none',
                }}/>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-egg-wrap">
            <button
              className={`sidebar-egg ${hatchesAvailable > 0 ? 'sidebar-egg-active' : 'sidebar-egg-inactive'}`}
              onClick={() => hatchesAvailable > 0 && handleEggButton()}
              title="Faire éclore un œuf"
            >
              <SideEggIcon/>
              {hatchesAvailable > 0 && (
                <span className="sidebar-egg-badge">{hatchesAvailable}</span>
              )}
            </button>
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setIsNight(n => !n)}
          aria-label={isNight ? 'Switch to day' : 'Switch to night'}
        >
          {isNight ? <MoonIcon/> : <SunIcon/>}
        </button>
      </aside>}

      {/* Game area — centered on desktop, full-screen on mobile */}
      <div className="app-center">
        <div className={`game-frame ${mode}`}>

          {/* Screen content — crossfades on navigation */}
          <div className={screenCls}>
            {screen === 'home' ? (
              <>
                {activeTab === 'home'    && <PokemonHome key={pokemonSwitchKey} pokemon={hatchData.pokemon} isNight={isNight} onSwitchPokemon={handleSwitchPokemon}/>}
                {activeTab === 'bag'     && <BagScreen pokemon={hatchData.pokemon} isNight={isNight}/>}
                {activeTab === 'dex'     && <DexScreen isNight={isNight}/>}
                {activeTab === 'account' && <AccountScreen pokemon={hatchData.pokemon} isNight={isNight} onReset={handleReset}/>}
                <TabBar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isNight={isNight}
                  hatchesAvailable={hatchesAvailable}
                  onEggClick={handleEggButton}
                  newItemUnlocked={newItemUnlocked}
                  onBagOpen={() => setNewItemUnlocked(false)}
                />
              </>
            ) : screen === 'hatching' ? (
              <HatchScreen
                egg={hatchData.egg}
                pokemon={hatchData.pokemon}
                isNight={isNight}
                onRestart={() => { setHatchData(null); goTo('landing') }}
                onConfirm={(customName, isShiny = false) => {
                  const updatedPokemon = { ...hatchData.pokemon, name: customName, isShiny }
                  setHatchData(d => ({ ...d, pokemon: updatedPokemon }))
                  addToDex(updatedPokemon)

                  if (rehatchRef.current) {
                    // Egg button re-hatch: increment hatchesDone
                    const prog = loadProgress()
                    prog.hatchesDone = (prog.hatchesDone || 0) + 1
                    if (!prog.allPokemon.find(p => p.id === updatedPokemon.id)) {
                      prog.allPokemon.push({ id: updatedPokemon.id, name: updatedPokemon.name, level: 1 })
                    }
                    saveProgress(prog)
                    rehatchRef.current = false
                  } else {
                    // First hatch: seed progress with this pokemon
                    const prog = loadProgress()
                    if (!prog.allPokemon.find(p => p.id === updatedPokemon.id)) {
                      prog.allPokemon.push({ id: updatedPokemon.id, name: updatedPokemon.name, level: 1 })
                      saveProgress(prog)
                    }
                  }

                  setHatchesAvailable(computeHatchesAvailable())
                  setActiveTab('home')
                  goTo('home')
                }}
              />
            ) : screen === 'selector' ? (
              <EggSelector
                isNight={isNight}
                onBack={() => goTo('landing')}
                onChoose={(egg, pokemon) => {
                  setHatchData({ egg, pokemon })
                  goTo('hatching')
                }}
              />
            ) : (
              <Landing
                isNight={isNight}
                onChoose={() => goTo('selector')}
              />
            )}
          </div>

        </div>
      </div>

      {evolutionData && (
        <EvolutionOverlay
          oldName={evolutionData.oldName}
          newId={evolutionData.newId}
          newName={evolutionData.newName}
          isShiny={evolutionData.isShiny}
          onClose={handleEvolutionClose}
        />
      )}

    </div>
  )
}
