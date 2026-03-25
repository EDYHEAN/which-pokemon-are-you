import { useState, useEffect } from 'react'
import s from './LevelUpOverlay.module.css'

const PARTICLE_COUNT = 24
const COLORS = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#FF8C00','#FFF44F','#96CEB4','#FF69B4']
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  color: COLORS[i % COLORS.length],
  tx: `${(Math.random() - 0.5) * 340}px`,
  ty: `${(Math.random() - 0.5) * 340}px`,
  rot: `${(Math.random() - 0.5) * 720}deg`,
  delay: `${Math.random() * 0.3}s`,
  size: 6 + Math.random() * 8,
}))

export default function LevelUpOverlay({ level, reward, onClose }) {
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => handleClose(), 6000)
    return () => clearTimeout(t)
  }, [])

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 300)
  }

  return (
    <div className={`${s.overlay} ${closing ? s.closing : ''}`}>
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

      <div className={s.content}>
        <p className={s.levelUpLabel}>LEVEL UP !</p>
        <p className={s.levelNumber}>NIVEAU {level}</p>

        {reward ? (<>
          <div className={s.divider}/>
          <p className={s.rewardLabel}>Récompense :</p>
          <span className={s.rewardEmoji}>{reward.emoji}</span>
          <p className={s.rewardName}>{reward.name}</p>
          <p className={s.rewardDesc}>{reward.description}</p>
          <div className={s.rewardBadge}>+{reward.quantity} ajouté à votre Bag</div>
        </>) : (
          <p className={s.noReward}>Continuez comme ça !</p>
        )}

        <button className={s.closeBtn} onClick={handleClose}>Super !</button>
      </div>
    </div>
  )
}
