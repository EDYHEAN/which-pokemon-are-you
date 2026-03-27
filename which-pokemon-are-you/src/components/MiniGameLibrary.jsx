import { useState, useEffect } from 'react'
import s from './MiniGameLibrary.module.css'

const SCORES_KEY = (pokemonId) => `poketama_scores_${pokemonId}`

const GAMES = [
  {
    id: 'doodle_jump',
    name: 'Poké Jump',
    description: 'Saute de plateforme en plateforme !',
    color: '#4A90E2',
    icon: '⬆️',
    available: false,
  },
  {
    id: 'runner',
    name: 'Endless Run',
    description: 'Cours et évite les obstacles',
    color: '#E24A4A',
    icon: '🏃',
    available: false,
  },
  {
    id: 'catch',
    name: 'Attrape les baies',
    description: 'Attrape les baies, évite les malus !',
    color: '#4AE27A',
    icon: '🍇',
    available: false,
  },
]

function loadScores(pokemonId) {
  try {
    const raw = localStorage.getItem(SCORES_KEY(pokemonId))
    if (raw) return JSON.parse(raw)
  } catch {}
  return { doodle_jump: 0, runner: 0, catch: 0 }
}

export default function MiniGameLibrary({ pokemon, onClose }) {
  const [closing, setClosing] = useState(false)
  const [scores, setScores] = useState(() => loadScores(pokemon.id))

  useEffect(() => {
    setScores(loadScores(pokemon.id))
  }, [pokemon.id])

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 280)
  }

  return (
    <div className={`${s.overlay} ${closing ? s.closing : ''}`} onClick={handleClose}>
      <div className={s.panel} onClick={e => e.stopPropagation()}>
        <button className={s.closeBtn} onClick={handleClose}>×</button>
        <p className={s.title}>Mini-jeux</p>
        <p className={s.subtitle}>Divertis ton Pokémon · Score sauvegardé</p>

        <div className={s.grid}>
          {GAMES.map(game => (
            <div key={game.id} className={s.card}>
              <div
                className={s.cardIllustration}
                style={{ background: `linear-gradient(135deg, ${game.color}33 0%, ${game.color}66 100%)` }}
              >
                <span className={s.cardIcon}>{game.icon}</span>
              </div>
              <div className={s.cardBody}>
                <p className={s.cardName}>{game.name}</p>
                <p className={s.cardDesc}>{game.description}</p>
                <p className={s.cardScore}>
                  Record : {scores[game.id] > 0 ? scores[game.id] : '--'}
                </p>
                <span className={`${s.badge} ${game.available ? s.badgePlay : s.badgeSoon}`}>
                  {game.available ? 'Jouer' : 'Bientôt'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
