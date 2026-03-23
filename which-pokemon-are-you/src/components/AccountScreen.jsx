import { useState, useEffect } from 'react'
import s from './AccountScreen.module.css'
import { STORAGE_KEY, INVENTORY_KEY, DEX_KEY } from '../config/gameConfig'

export default function AccountScreen({ pokemon, isNight, onReset }) {
  const [level, setLevel]     = useState(1)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    try {
      const save = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (save?.pokemon?.id === pokemon?.id) setLevel(save.level ?? 1)
    } catch {}
  }, [pokemon])

  const spriteUrl = pokemon
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`
    : null

  function handleReset() {
    if (!confirm) { setConfirm(true); return }
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(INVENTORY_KEY)
    localStorage.removeItem(DEX_KEY)
    onReset()
  }

  return (
    <div className={`${s.page} ${isNight ? s.night : s.day}`}>
      <div className={s.header}>
        <p className={s.title}>Mon compte</p>
      </div>

      <div className={s.content}>

        {/* Save locale */}
        <div className={s.card}>
          <p className={s.cardLabel}>Save locale</p>
          <p className={s.cardSub}>Votre progression est sauvegardée localement</p>

          {pokemon && (
            <div className={s.currentPokemon}>
              {spriteUrl && <img src={spriteUrl} alt={pokemon.name} className={s.pokemonSprite} draggable={false}/>}
              <div>
                <p className={s.pokemonName}>{pokemon.name}</p>
                <p className={s.pokemonLevel}>Niveau {level}</p>
              </div>
            </div>
          )}

          {!confirm ? (
            <button className={s.resetBtn} onClick={handleReset}>
              Réinitialiser
            </button>
          ) : (
            <div className={s.confirmRow}>
              <p className={s.confirmText}>Êtes-vous sûr ? Cette action est irréversible.</p>
              <div className={s.confirmBtns}>
                <button className={s.cancelBtn} onClick={() => setConfirm(false)}>Annuler</button>
                <button className={s.confirmResetBtn} onClick={handleReset}>Confirmer</button>
              </div>
            </div>
          )}
        </div>

        {/* Cloud sync placeholder */}
        <div className={`${s.card} ${s.disabledCard}`}>
          <div className={s.cardLabelRow}>
            <p className={s.cardLabel}>Sync Cloud</p>
            <span className={s.soonBadge}>Bientôt disponible</span>
          </div>
          <p className={s.cardSub}>Synchronisez votre save sur tous vos appareils</p>

          <div className={s.formGroup}>
            <input className={s.input} type="email" placeholder="Email" disabled/>
            <input className={s.input} type="password" placeholder="Mot de passe" disabled/>
          </div>

          <button className={s.connectBtn} disabled>Se connecter</button>
        </div>

      </div>
    </div>
  )
}
