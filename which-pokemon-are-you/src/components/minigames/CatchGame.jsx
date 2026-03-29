import { useState, useEffect, useRef, useCallback } from 'react'
import berryBg   from '../../assets/minigames/berrybg.png'
import berryBlue  from '../../assets/minigames/blue.png'
import berryRed   from '../../assets/minigames/red.png'
import berryBlack from '../../assets/minigames/black.png'

// ── Berry definitions ─────────────────────────────────────────
const BERRIES = [
  { type: 'blue',  image: berryBlue,  points: +1, good: true  },
  { type: 'red',   image: berryRed,   points: +2, good: true  },
  { type: 'black', image: berryBlack, points: -2, good: false },
]

function pickBerry() {
  const r = Math.random()
  if (r < 0.4) return BERRIES[0]   // 40 % blue
  if (r < 0.8) return BERRIES[1]   // 40 % red
  return BERRIES[2]                  // 20 % black
}

const GAME_DURATION = 30
const lerp = (a, b, t) => a + (b - a) * t

// ── Component ─────────────────────────────────────────────────
export default function CatchGame({ pokemon, onClose }) {
  const [gameState,    setGameState]    = useState('countdown')
  const [countdownVal, setCountdownVal] = useState(3)
  const [score,        setScore]        = useState(0)
  const [timeLeft,     setTimeLeft]     = useState(GAME_DURATION)
  const [berries,      setBerries]      = useState([])
  const [popups,       setPopups]       = useState([])
  const [redFlash,     setRedFlash]     = useState(false)

  // Refs — all performance-sensitive state lives here
  const scoreRef      = useRef(0)
  const berriesRef    = useRef([])
  const gameStateRef  = useRef('countdown')
  const containerRef  = useRef(null)
  const pokemonRef    = useRef(null)       // direct DOM ref for the sprite
  const rafRef        = useRef(null)       // game loop RAF
  const animFrameRef  = useRef(null)       // player lerp RAF
  const targetXRef    = useRef(50)         // where the pointer is
  const currentXRef   = useRef(50)         // lerped position
  const popupIdRef    = useRef(0)
  const speedBoostRef = useRef(0)

  // Best score loaded once on mount
  const [best] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(`poketama_scores_${pokemon.id}`) || '{}')
      return s.catch || 0
    } catch { return 0 }
  })

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`

  // ── Player lerp loop (always running) ────────────────────────
  useEffect(() => {
    function animatePlayer() {
      currentXRef.current = lerp(currentXRef.current, targetXRef.current, 0.35)
      if (pokemonRef.current) {
        pokemonRef.current.style.left = currentXRef.current + '%'
      }
      animFrameRef.current = requestAnimationFrame(animatePlayer)
    }
    animFrameRef.current = requestAnimationFrame(animatePlayer)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  // ── Pointer events via ref (avoids React synthetic event overhead) ──
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function onMouseMove(e) {
      if (gameStateRef.current !== 'playing') return
      const rect = container.getBoundingClientRect()
      targetXRef.current = Math.min(92, Math.max(8, (e.clientX - rect.left) / rect.width * 100))
    }

    function onTouchMove(e) {
      if (gameStateRef.current !== 'playing') return
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      const touch = e.touches[0]
      targetXRef.current = Math.min(92, Math.max(8, (touch.clientX - rect.left) / rect.width * 100))
    }

    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  // ── Countdown ───────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'countdown') return
    setCountdownVal(3)
    let n = 3
    const id = setInterval(() => {
      n--
      if (n === 0) {
        clearInterval(id)
        setCountdownVal('Go !')
        setTimeout(() => {
          gameStateRef.current = 'playing'
          setGameState('playing')
        }, 800)
      } else {
        setCountdownVal(n)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [gameState])

  // ── Game loop ────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') return

    // Spawn a berry every 800 ms
    const spawnId = setInterval(() => {
      const b = pickBerry()
      berriesRef.current = [...berriesRef.current, {
        id:     Date.now() + Math.random(),
        type:   b.type,
        image:  b.image,
        points: b.points,
        good:   b.good,
        x:      5 + Math.random() * 90,
        y:      -5,
        speed:  0.4 + Math.random() * 0.2 + speedBoostRef.current,
      }]
    }, 800)

    // Speed ramp every 10 s (capped at +1.5)
    const speedId = setInterval(() => {
      speedBoostRef.current = Math.min(speedBoostRef.current + 0.1, 1.5)
    }, 10000)

    // Game timer
    let t = GAME_DURATION
    const timerId = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) {
        clearInterval(timerId)
        gameStateRef.current = 'gameover'
        setGameState('gameover')
      }
    }, 1000)

    // RAF loop — moves berries, checks collisions
    function loop() {
      if (gameStateRef.current !== 'playing') return
      const px = currentXRef.current  // use the lerped position for collision

      const moved = berriesRef.current.map(b => ({ ...b, y: b.y + b.speed }))

      const remaining = []
      const caught    = []
      for (const b of moved) {
        if (b.y > 105) continue
        if (b.y > 70 && b.y < 82 && Math.abs(b.x - px) < 8) {
          caught.push(b)
        } else {
          remaining.push(b)
        }
      }

      if (caught.length > 0) {
        let delta = 0
        for (const b of caught) {
          delta += b.points
          const pid = ++popupIdRef.current
          setPopups(prev => [...prev, {
            id: pid, text: b.points > 0 ? `+${b.points}` : `${b.points}`,
            good: b.good, x: b.x, y: b.y,
          }])
          setTimeout(() => setPopups(prev => prev.filter(p => p.id !== pid)), 700)
          if (!b.good) {
            setRedFlash(true)
            setTimeout(() => setRedFlash(false), 200)
          }
        }
        scoreRef.current = Math.max(0, scoreRef.current + delta)
        setScore(scoreRef.current)
      }

      berriesRef.current = remaining
      setBerries([...remaining])
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      clearInterval(spawnId)
      clearInterval(speedId)
      clearInterval(timerId)
      cancelAnimationFrame(rafRef.current)
    }
  }, [gameState])

  // ── Quit (save stats + score) ────────────────────────────────
  function handleQuit() {
    try {
      const raw = localStorage.getItem('poketama_save')
      if (raw) {
        const save = JSON.parse(raw)
        save.stats.entertainment = Math.min(100, (save.stats.entertainment || 0) + 40)
        save.stats.energy        = Math.max(0,   (save.stats.energy        || 0) - 8)
        save.xp                  = (save.xp || 0) + 10
        save.lastSaved           = Date.now()
        localStorage.setItem('poketama_save', JSON.stringify(save))
      }
    } catch {}
    try {
      const scores = JSON.parse(localStorage.getItem(`poketama_scores_${pokemon.id}`) || '{}')
      if (!scores.catch || scoreRef.current > scores.catch) scores.catch = scoreRef.current
      localStorage.setItem(`poketama_scores_${pokemon.id}`, JSON.stringify(scores))
    } catch {}
    window.dispatchEvent(new CustomEvent('poketama-stats-update'))
    onClose()
  }

  // ── Replay ───────────────────────────────────────────────────
  function handleReplay() {
    cancelAnimationFrame(rafRef.current)
    scoreRef.current      = 0
    berriesRef.current    = []
    speedBoostRef.current = 0
    targetXRef.current    = 50
    currentXRef.current   = 50
    if (pokemonRef.current) pokemonRef.current.style.left = '50%'
    setScore(0)
    setBerries([])
    setPopups([])
    setTimeLeft(GAME_DURATION)
    gameStateRef.current = 'countdown'
    setGameState('countdown')
  }

  const isNewRecord = scoreRef.current > best && scoreRef.current > 0

  const pillStyle = {
    position: 'absolute', zIndex: 10,
    top: 20,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 100,
    padding: '8px 16px',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 13,
    color: '#fff',
    lineHeight: 1,
    userSelect: 'none',
    pointerEvents: 'none',
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        display: 'flex', justifyContent: 'center',
        background: '#000',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* ── Game area ── */}
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 390, height: '100vh',
        overflow: 'hidden',
        backgroundImage: `url(${berryBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>

        {/* Red flash on bad berry */}
        {redFlash && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            background: 'rgba(255,0,0,0.25)',
            pointerEvents: 'none',
          }}/>
        )}

        {/* Timer pill */}
        <div style={{
          ...pillStyle,
          left: 20,
          color: timeLeft <= 10 ? '#FF3B30' : '#fff',
          animation: timeLeft <= 10 ? 'timerPulse 0.5s ease infinite alternate' : 'none',
        }}>
          ⏱ {timeLeft}s
        </div>

        {/* Score pill */}
        <div style={{ ...pillStyle, right: 20 }}>
          ⭐ {score}
        </div>

        {/* Falling berries */}
        {berries.map(b => (
          <img
            key={b.id}
            src={b.image}
            alt={b.type}
            draggable={false}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top:  `${b.y}%`,
              width: 36, height: 36,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
              zIndex: 5,
            }}
          />
        ))}

        {/* Score popups */}
        {popups.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top:  `${p.y}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 18, fontWeight: 700,
              color: p.good ? '#4AE27A' : '#FF4444',
              pointerEvents: 'none',
              animation: 'catchPopup 0.7s ease forwards',
              zIndex: 15,
              textShadow: '0 1px 6px rgba(0,0,0,0.7)',
              whiteSpace: 'nowrap',
            }}
          >
            {p.text}
          </div>
        ))}

        {/* Player Pokémon — position driven directly via ref */}
        <img
          ref={pokemonRef}
          src={spriteUrl}
          alt={pokemon.name}
          draggable={false}
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '50%',                            // initial value; lerp loop takes over
            width: 80, height: 80,
            transform: 'translateX(-50%)',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
            pointerEvents: 'none',
            zIndex: 8,
          }}
        />

        {/* Countdown overlay */}
        {gameState === 'countdown' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
          }}>
            <span
              key={countdownVal}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 72, color: '#fff', fontWeight: 600,
                textShadow: '0 4px 24px rgba(0,0,0,0.5)',
                animation: 'countdownPop 0.4s ease both',
              }}
            >
              {countdownVal}
            </span>
          </div>
        )}

        {/* Game over overlay */}
        {gameState === 'gameover' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 40,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 14,
            background: 'rgba(0,0,0,0.85)',
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 28, color: '#fff', margin: 0, fontWeight: 500,
            }}>
              Temps écoulé !
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 32, fontWeight: 700, color: '#fff', margin: 0,
            }}>
              {score} pts
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0,
            }}>
              Record : {Math.max(best, score)} pts
            </p>
            {isNewRecord && (
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 18, fontWeight: 700, color: '#FFD700', margin: 0,
                animation: 'recordPulse 0.6s ease infinite alternate',
              }}>
                🎉 Nouveau Record !
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={handleReplay}
                style={{
                  padding: '12px 28px', borderRadius: 999,
                  background: '#fff', color: '#1a1a1a',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                }}
              >
                Rejouer
              </button>
              <button
                onClick={handleQuit}
                style={{
                  padding: '12px 28px', borderRadius: 999,
                  background: 'transparent', color: '#fff',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
                  border: '2px solid rgba(255,255,255,0.45)', cursor: 'pointer',
                }}
              >
                Quitter
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes catchPopup {
          0%   { opacity: 1; transform: translate(-50%, -50%); }
          100% { opacity: 0; transform: translate(-50%, -220%); }
        }
        @keyframes countdownPop {
          0%   { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes recordPulse {
          from { transform: scale(1); }
          to   { transform: scale(1.07); }
        }
        @keyframes timerPulse {
          from { opacity: 1; }
          to   { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
