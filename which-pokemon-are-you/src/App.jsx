import { useState } from 'react'
import Landing from './components/Landing'
import PokemonSelector from './components/PokemonSelector'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [phase, setPhase] = useState('idle') // 'idle' | 'exit' | 'enter'
  const [isNight, setIsNight] = useState(true)

  const goTo = (target) => {
    setPhase('exit')
    setTimeout(() => {
      setScreen(target)
      setPhase('enter')
    }, 400)
  }

  const cls = [
    'screen-wrapper',
    phase === 'exit'  ? 'screen-exit'  : '',
    phase === 'enter' ? 'screen-enter' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cls}>
      {screen === 'selector' ? (
        <PokemonSelector
          isNight={isNight}
          setIsNight={setIsNight}
          onBack={() => goTo('landing')}
        />
      ) : (
        <Landing
          isNight={isNight}
          setIsNight={setIsNight}
          onChoose={() => goTo('selector')}
        />
      )}
    </div>
  )
}
