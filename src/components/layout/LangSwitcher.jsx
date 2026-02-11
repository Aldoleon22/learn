import { useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
import { getLanguages } from '@/data/contentSource'

const DEFAULT_LANGS = [
  { id: 'js', name: 'JS', icon: '⚡', color: 'rgba(0,255,136,0.15)', textColor: 'var(--neon-green)' },
  { id: 'python', name: 'PY', icon: '🐍', color: 'rgba(255,212,59,0.15)', textColor: '#ffd43b' },
]

function getDisplayLangs() {
  const stored = getLanguages()
  // Always include JS and Python defaults, then add any extras from DB
  const result = [...DEFAULT_LANGS]
  const knownIds = new Set(result.map(l => l.id))
  for (const lang of stored) {
    if (!knownIds.has(lang.id)) {
      result.push({
        id: lang.id,
        name: lang.name?.slice(0, 6) || lang.id.toUpperCase(),
        icon: lang.icon || '📦',
        color: 'rgba(196,132,252,0.15)',
        textColor: '#c084fc',
      })
    }
  }
  return result
}

export default function LangSwitcher() {
  const currentLang = useStore((s) => s.currentLang)
  const setLang = useStore((s) => s.setLang)
  const navigate = useNavigate()
  const langs = getDisplayLangs()

  return (
    <div className="flex gap-0.5 ml-2 bg-bg-input rounded-md p-0.5 border border-white/[0.06]">
      {langs.map(lang => (
        <button
          key={lang.id}
          onClick={() => setLang(lang.id)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all
            ${currentLang === lang.id
              ? ''
              : 'bg-transparent text-text-muted hover:text-text-primary hover:bg-white/5'
            }`}
          style={currentLang === lang.id ? { backgroundColor: lang.color, color: lang.textColor } : undefined}
        >
          <span>{lang.icon}</span>
          <span className="hidden sm:inline">{lang.name}</span>
        </button>
      ))}
      <button
        onClick={() => navigate('/admin/language')}
        className="flex items-center px-1.5 py-1 rounded text-xs text-text-muted hover:text-accent-secondary hover:bg-white/5 transition-all"
        title="Ajouter un langage"
      >
        +
      </button>
    </div>
  )
}
