import { useState, useEffect, useRef } from 'react'
import s from './EvolutionOverlay.module.css'

const P_COLORS = ['#FFD700','#FF6B6B','#4ECDC4','#FF8C00','#FFF44F','#FF44CC','#7CFC00','#45B7D1']
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  color: P_COLORS[i % P_COLORS.length],
  tx: `${(Math.random() - 0.5) * 380}px`,
  ty: `${(Math.random() - 0.5) * 380}px`,
  rot: `${(Math.random() - 0.5) * 720}deg`,
  delay: `${Math.random() * 0.5}s`,
  size: 6 + Math.random() * 10,
}))

export default function EvolutionOverlay({ oldName, newId, newName, isShiny, onClose }) {
  const [phase, setPhase] = useState(1)   // 1 flash | 2 white | 3 emerge | 4 result
  const [flashSpeed, setFlashSpeed] = useState(0.8)
  const [closing, setClosing] = useState(false)

  const spriteNew = isShiny
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${newId}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${newId}.png`

  // Accelerate the flash during phase 1
  const speedTimers = useRef([])
  useEffect(() => {
    speedTimers.current.push(setTimeout(() => setFlashSpeed(0.4), 350))
    speedTimers.current.push(setTimeout(() => setFlashSpeed(0.15), 700))
    speedTimers.current.push(setTimeout(() => setPhase(2), 1000))
    speedTimers.current.push(setTimeout(() => setPhase(3), 1500))
    speedTimers.current.push(setTimeout(() => setPhase(4), 2600))
    return () => speedTimers.current.forEach(clearTimeout)
  }, [])

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 350)
  }

  return (
    <div className={`${s.overlay} ${closing ? s.closing : ''}`}>

      {/* Phase 1 — Accelerating flash of the NEW sprite (already known at this point) */}
      {phase === 1 && (
        <div className={s.phaseOne}>
          <img
            src={spriteNew}
            alt=""
            className={s.flashSprite}
            style={{ animationDuration: `${flashSpeed}s` }}
            draggable={false}
          />
        </div>
      )}

      {/* Phase 2 — Total white screen */}
      {phase === 2 && <div className={s.whiteFlash}/>}

      {/* Phase 3 — New sprite emerges */}
      {phase === 3 && (
        <div className={s.phaseThree}>
          <img
            src={spriteNew}
            alt={newName}
            className={s.emergeSprite}
            draggable={false}
          />
        </div>
      )}

      {/* Phase 4 — Result */}
      {phase === 4 && (
        <>
          {PARTICLES.map(p => (
            <div
              key={p.id}
              className={s.particle}
              style={{
                background: p.color,
                width: p.size, height: p.size,
                '--tx': p.tx, '--ty': p.ty, '--rot': p.rot,
                animationDelay: p.delay,
              }}
            />
          ))}
          <div className={s.resultContent}>
            <img
              src={spriteNew}
              alt={newName}
              className={s.resultSprite}
              style={isShiny ? { filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.8))' } : {}}
              draggable={false}
            />
            {isShiny && <p className={s.shinyLabel}>✨ Shiny</p>}
            <p className={s.evolveText}>
              <span className={s.oldName}>{oldName}</span>
              {' évolue en '}
              <span className={s.newName}>{newName}</span>
              {' !'}
            </p>
            <button className={s.closeBtn} onClick={handleClose}>Incroyable !</button>
          </div>
        </>
      )}

    </div>
  )
}
