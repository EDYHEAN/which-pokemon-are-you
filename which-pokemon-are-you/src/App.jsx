import { useState, useRef } from 'react'
import Landing from './components/Landing'
import EggSelector from './components/EggSelector'
import HatchScreen from './components/HatchScreen'
import PokemonHome from './components/PokemonHome'
import TabBar from './components/TabBar'
import BagScreen from './components/BagScreen'
import DexScreen from './components/DexScreen'
import AccountScreen from './components/AccountScreen'
import { addToDex, STORAGE_KEY, INVENTORY_KEY, DEX_KEY } from './config/gameConfig'
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

export default function App() {
  const [screen, setScreen]     = useState('landing')
  const [phase,  setPhase]      = useState('idle')   // 'idle' | 'exit' | 'enter'
  const [isNight, setIsNight]   = useState(true)
  const [hatchData, setHatchData] = useState(null)   // { egg, pokemon }
  const [activeTab, setActiveTab] = useState('home')

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

  const goTo = (target) => {
    setPhase('exit')
    setTimeout(() => {
      setScreen(target)
      setPhase('enter')
    }, 350)
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(INVENTORY_KEY)
    localStorage.removeItem(DEX_KEY)
    setHatchData(null)
    setActiveTab('home')
    goTo('landing')
  }

  const mode = isNight ? 'is-night' : 'is-day'

  const screenCls = [
    'screen-wrapper',
    phase === 'exit'  ? 'screen-exit'  : '',
    phase === 'enter' ? 'screen-enter' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={`app-root ${mode}`}>

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

      {/* Desktop sidebar */}
      <aside className={`app-sidebar ${mode}`}>
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
              onClick={() => screen === 'home' && setActiveTab(id)}
              title={label}
            >
              <Icon/>
            </button>
          ))}
        </nav>
        <button
          className="sidebar-toggle"
          onClick={() => setIsNight(n => !n)}
          aria-label={isNight ? 'Switch to day' : 'Switch to night'}
        >
          {isNight ? <MoonIcon/> : <SunIcon/>}
        </button>
      </aside>

      {/* Game area — centered on desktop, full-screen on mobile */}
      <div className="app-center">
        <div className={`game-frame ${mode}`}>

          {/* Screen content — crossfades on navigation */}
          <div className={screenCls}>
            {screen === 'home' ? (
              <>
                {activeTab === 'home'    && <PokemonHome pokemon={hatchData.pokemon} isNight={isNight}/>}
                {activeTab === 'bag'     && <BagScreen pokemon={hatchData.pokemon} isNight={isNight}/>}
                {activeTab === 'dex'     && <DexScreen isNight={isNight}/>}
                {activeTab === 'account' && <AccountScreen pokemon={hatchData.pokemon} isNight={isNight} onReset={handleReset}/>}
                <TabBar activeTab={activeTab} setActiveTab={setActiveTab} isNight={isNight}/>
              </>
            ) : screen === 'hatching' ? (
              <HatchScreen
                egg={hatchData.egg}
                pokemon={hatchData.pokemon}
                isNight={isNight}
                onRestart={() => { setHatchData(null); goTo('landing') }}
                onConfirm={(customName) => {
                  const updatedPokemon = { ...hatchData.pokemon, name: customName }
                  setHatchData(d => ({ ...d, pokemon: updatedPokemon }))
                  addToDex(updatedPokemon)
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

    </div>
  )
}
