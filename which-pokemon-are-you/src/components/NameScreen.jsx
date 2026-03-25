import { useState } from 'react'
import s from './NameScreen.module.css'

export default function NameScreen({ isNight, onContinue }) {
  const [name, setName] = useState(() => localStorage.getItem('poketama_trainer_name') || '')

  function handleContinue() {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem('poketama_trainer_name', trimmed)
    onContinue()
  }

  const mode = isNight ? s.night : s.day

  return (
    <main className={`${s.page} ${mode}`}>

      <img
        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/egg.png"
        alt="Pokémon Egg"
        className={s.egg}
        draggable={false}
      />

      <h1 className={s.title}>
        Comment t'appelle-t-on,<br />Dresseur ?
      </h1>

      <input
        className={s.input}
        type="text"
        placeholder="Ton prénom..."
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleContinue()}
        autoFocus
        maxLength={20}
      />

      <button
        className={s.cta}
        onClick={handleContinue}
        disabled={!name.trim()}
      >
        Continuer →
      </button>

    </main>
  )
}
