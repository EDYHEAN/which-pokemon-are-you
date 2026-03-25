import s from './TabBar.module.css'

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <polyline points="9 21 9 12 15 12 15 21"/>
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

function DexIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )
}

function AccountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function EggTabIcon() {
  return (
    <div style={{
      width: 20,
      height: 26,
      background: 'linear-gradient(145deg, #f0ede8, #d4c9b8)',
      borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
      border: '1px solid rgba(0,0,0,0.12)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      flexShrink: 0,
    }}/>
  )
}

const TABS_LEFT  = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'dex',  label: 'Dex',  Icon: DexIcon  },
]

const TABS_RIGHT = [
  { id: 'account', label: 'Moi', Icon: AccountIcon },
]

export default function TabBar({ activeTab, setActiveTab, isNight, hatchesAvailable = 0, onEggClick }) {
  const canHatch = hatchesAvailable > 0

  function renderTab({ id, label, Icon }) {
    const active = activeTab === id
    return (
      <button
        key={id}
        className={`${s.tab} ${active ? s.active : ''}`}
        onClick={() => setActiveTab(id)}
      >
        <div className={s.iconWrap}><Icon/></div>
        <span className={s.label}>{label}</span>
        {active && <span className={s.dot}/>}
      </button>
    )
  }

  return (
    <div className={`${s.bar} ${isNight ? s.night : s.day}`}>
      {TABS_LEFT.map(renderTab)}

      {/* Egg tab */}
      <button
        className={`${s.tab} ${!canHatch ? s.eggDisabled : s.eggActive}`}
        onClick={() => canHatch && onEggClick?.()}
      >
        <div className={s.eggIconWrap}>
          <EggTabIcon/>
          {canHatch && (
            <span className={s.badge}>{hatchesAvailable}</span>
          )}
        </div>
        <span className={s.label}>Oeuf</span>
      </button>

      {TABS_RIGHT.map(renderTab)}
    </div>
  )
}
