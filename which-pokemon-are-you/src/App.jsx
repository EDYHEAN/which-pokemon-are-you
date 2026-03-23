import { useState, useRef } from 'react'
import Landing from './components/Landing'
import EggSelector from './components/EggSelector'
import HatchScreen from './components/HatchScreen'
import PokemonHome from './components/PokemonHome'
import './App.css'

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
  const [screen, setScreen] = useState('landing')
  const [phase,  setPhase]  = useState('idle')   // 'idle' | 'exit' | 'enter'
  const [isNight, setIsNight] = useState(true)
  const [hatchData, setHatchData] = useState(null) // { egg, pokemon }

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

      {/* Day/night toggle — always on top */}
      <button
        className={`app-toggle ${mode}`}
        onClick={() => setIsNight(n => !n)}
        aria-label={isNight ? 'Switch to day' : 'Switch to night'}
      >
        {isNight ? <MoonIcon/> : <SunIcon/>}
      </button>

      {/* Screen content — crossfades on navigation */}
      <div className={screenCls}>
        {screen === 'home' ? (
          <PokemonHome pokemon={hatchData.pokemon}/>
        ) : screen === 'hatching' ? (
          <HatchScreen
            egg={hatchData.egg}
            pokemon={hatchData.pokemon}
            isNight={isNight}
            onRestart={() => { setHatchData(null); goTo('landing') }}
            onConfirm={() => goTo('home')}
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
  )
}
