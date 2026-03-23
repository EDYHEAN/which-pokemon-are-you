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

const TABS = [
  { id: 'home',    label: 'Home',  Icon: HomeIcon    },
  { id: 'bag',     label: 'Bag',   Icon: BagIcon     },
  { id: 'dex',     label: 'Dex',   Icon: DexIcon     },
  { id: 'account', label: 'Moi',   Icon: AccountIcon },
]

export default function TabBar({ activeTab, setActiveTab, isNight }) {
  return (
    <div className={`${s.bar} ${isNight ? s.night : s.day}`}>
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            className={`${s.tab} ${active ? s.active : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon/>
            <span className={s.label}>{label}</span>
            {active && <span className={s.dot}/>}
          </button>
        )
      })}
    </div>
  )
}
