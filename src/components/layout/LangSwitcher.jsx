import useStore from '@/store/useStore'

export default function LangSwitcher() {
  const currentLang = useStore((s) => s.currentLang)
  const setLang = useStore((s) => s.setLang)

  return (
    <div className="flex gap-0.5 ml-2 bg-bg-input rounded-md p-0.5 border border-white/[0.06]">
      <button
        onClick={() => setLang('js')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all
          ${currentLang === 'js'
            ? 'bg-[rgba(0,255,136,0.15)] text-neon-green'
            : 'bg-transparent text-text-muted hover:text-text-primary hover:bg-white/5'
          }`}
      >
        <span>⚡</span>
        <span>JS</span>
      </button>
      <button
        onClick={() => setLang('python')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all
          ${currentLang === 'python'
            ? 'bg-[rgba(255,212,59,0.15)] text-[#ffd43b]'
            : 'bg-transparent text-text-muted hover:text-text-primary hover:bg-white/5'
          }`}
      >
        <span>🐍</span>
        <span>PY</span>
      </button>
    </div>
  )
}
