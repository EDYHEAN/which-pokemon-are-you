import { useState, useEffect } from 'react'
import s from './LevelUpOverlay.module.css'

const PARTICLE_COUNT = 20
const COLORS = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#FF8C00','#FFF44F','#96CEB4']
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  color: COLORS[i % COLORS.length],
  tx: `${(Math.random() - 0.5) * 300}px`,
  ty: `${(Math.random() - 0.5) * 300}px`,
  rot: `${(Math.random() - 0.5) * 720}deg`,
  delay: `${Math.random() * 0.4}s`,
  size: 6 + Math.random() * 8,
}))

export default function LevelUpOverlay({ level, reward, onClose }) {
  const [phase, setPhase] = useState(1) // 1 = level up, 2 = reward
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 1500)
    const t2 = setTimeout(() => handleClose(), 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 300)
  }

  return (
    <div className={`${s.overlay} ${closing ? s.closing : ''}`}>
      {/* Confetti particles */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className={s.particle}
          style={{
            background: p.color,
            width: p.size,
            height: p.size,
            '--tx': p.tx,
            '--ty': p.ty,
            '--rot': p.rot,
            animationDelay: p.delay,
          }}
        />
      ))}

      <div className={`${s.content} ${phase === 2 ? s.phaseTwo : ''}`}>

        {/* Phase 1 — Level up text */}
        <div className={`${s.levelUpText} ${phase === 2 ? s.slideUp : ''}`}>
          <p className={s.levelUpLabel}>LEVEL UP !</p>
          <p className={s.levelNumber} style={{ color: '#FFD700' }}>Niveau {level}</p>
        </div>

        {/* Phase 2 — Reward */}
        {phase === 2 && reward && (
          <div className={s.rewardCard}>
            <p className={s.rewardUnlocked}>Récompense débloquée !</p>
            <div className={s.rewardInner}>
              <span className={s.rewardEmoji}>{reward.emoji}</span>
              <p className={s.rewardName}>{reward.name}</p>
              <p className={s.rewardDesc}>{reward.description}</p>
              <div className={s.rewardBadge}>+{reward.quantity} ajouté à votre Bag</div>
            </div>
          </div>
        )}

        {phase === 2 && !reward && (
          <div className={s.rewardCard}>
            <p className={s.rewardUnlocked}>Continuez comme ça !</p>
          </div>
        )}

        <button className={s.closeBtn} onClick={handleClose}>Super !</button>

      </div>
    </div>
  )
}
