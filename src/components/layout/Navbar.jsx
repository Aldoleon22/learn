import { NavLink } from 'react-router-dom'
import LangSwitcher from './LangSwitcher'

const links = [
  { to: '/dashboard', icon: '🏠', label: 'Accueil' },
  { to: '/curriculum', icon: '📚', label: 'Cours' },
  { to: '/games', icon: '🎮', label: 'Jeux' },
  { to: '/profile', icon: '👤', label: 'Profil' },
]

export default function Navbar() {
  return (
    <nav className="bg-bg-secondary border-b border-white/[0.06] px-4 py-2 sticky top-0 z-50 flex items-center justify-between
                     max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:top-auto max-md:border-b-0 max-md:border-t max-md:border-white/[0.06]">
      {/* Brand - hidden on mobile */}
      <div className="flex items-center gap-2 max-md:hidden">
        <span className="text-2xl">🚀</span>
        <span className="nav-title text-lg font-bold text-accent-secondary transition-colors">Code Master</span>
        <LangSwitcher />
      </div>

      {/* Nav links */}
      <div className="flex gap-1 max-md:flex-1 max-md:justify-around">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center px-2 py-1 rounded-md text-xs transition-all no-underline
               md:flex-row md:gap-1 md:text-sm
               ${isActive
                 ? 'text-accent-secondary bg-[rgba(0,204,255,0.15)]'
                 : 'text-text-secondary hover:text-accent-secondary hover:bg-[rgba(0,204,255,0.1)]'
               }`
            }
          >
            <span className="text-xl md:text-base">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
