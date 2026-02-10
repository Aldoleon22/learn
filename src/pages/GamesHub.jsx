import { useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
import StatCard from '@/components/ui/StatCard'

const GAME_DEFINITIONS = [
  { type: 'ai-challenge', icon: '🤖', title: 'Defi IA', description: 'Un defi unique genere par l\'IA qui cible tes faiblesses', color: '#7c3aed', difficulty: 'Adaptatif', featured: true },
  { type: 'quiz-blitz', icon: '⚡', title: 'Quiz Blitz', description: 'Reponds a un max de questions en 60 secondes', color: '#f0c040', difficulty: 'Facile' },
  { type: 'code-repair', icon: '🔧', title: 'Code Repair', description: 'Trouve et corrige les bugs dans le code', color: '#4dabf7', difficulty: 'Moyen' },
  { type: 'memory-match', icon: '🧠', title: 'Memory Match', description: 'Associe les concepts a leurs definitions', color: '#69db7c', difficulty: 'Facile' },
  { type: 'speed-type', icon: '⌨️', title: 'Speed Type', description: 'Tape le code le plus vite possible sans erreur', color: '#e599f7', difficulty: 'Difficile' },
  { type: 'output-guess', icon: '🔮', title: 'Output Guess', description: 'Devine la sortie du code avant de l\'executer', color: '#ffa94d', difficulty: 'Moyen' },
]

export default function GamesHub() {
  const navigate = useNavigate()
  const lang = useStore(s => s.currentLang)
  const gameStats = useStore(s => s[s.currentLang].games)
  const langIcon = lang === 'python' ? '🐍' : '⚡'
  const langName = lang === 'python' ? 'Python' : 'JavaScript'

  let totalPlayed = 0, totalBestScore = 0, gameCount = 0
  GAME_DEFINITIONS.forEach(g => {
    const stats = gameStats[g.type]
    if (stats) { totalPlayed += stats.played || 0; totalBestScore += stats.bestScore || 0; gameCount++ }
  })
  const avgBest = gameCount > 0 ? Math.round(totalBestScore / gameCount) : 0

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">🎮 Mini-Jeux {langIcon}</h1>
          <p className="text-text-muted text-sm">Apprends {langName} en jouant — gagne de l'XP !</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-neon btn-small">← Tableau de bord</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard value={totalPlayed} label="Parties jouees" color="var(--accent-primary)" />
        <StatCard value={`${avgBest}%`} label="Score moyen" color="var(--accent-secondary)" />
        <StatCard value={GAME_DEFINITIONS.length} label="Jeux disponibles" color="var(--neon-gold)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GAME_DEFINITIONS.map(game => {
          const stats = gameStats[game.type] || { played: 0, bestScore: 0, totalXP: 0 }
          return (
            <div
              key={game.type}
              className="neon-card cursor-pointer"
              style={{ borderColor: `${game.color}33` }}
              onClick={() => navigate(`/game/${game.type}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${game.color}88`; e.currentTarget.style.boxShadow = `0 0 20px ${game.color}22` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${game.color}33`; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl leading-none">{game.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">{game.title}</h3>
                    <span className="text-[0.7rem] px-2 py-0.5 rounded-full" style={{ background: `${game.color}22`, color: game.color, border: `1px solid ${game.color}44` }}>{game.difficulty}</span>
                  </div>
                  <p className="text-text-muted text-sm mt-1">{game.description}</p>
                  <div className="flex gap-4 text-xs text-text-muted mt-2">
                    <span>🏆 Meilleur: {stats.bestScore}%</span>
                    <span>🎯 Joue {stats.played}x</span>
                    <span>⭐ {stats.totalXP || 0} XP</span>
                  </div>
                  {stats.played > 0 && (
                    <div className="mt-2 h-1 rounded bg-bg-input overflow-hidden">
                      <div className="h-full rounded transition-all duration-300" style={{ width: `${stats.bestScore}%`, background: game.color }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
