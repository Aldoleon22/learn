import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
import Modal from '@/components/ui/Modal'

const GAME_REGISTRY = {
  'quiz-blitz': () => import('@/games/quiz-blitz'),
  'code-repair': () => import('@/games/code-repair'),
  'memory-match': () => import('@/games/memory-match'),
  'speed-type': () => import('@/games/speed-type'),
  'output-guess': () => import('@/games/output-guess'),
}

const GAME_META = {
  'quiz-blitz': { icon: '⚡', title: 'Quiz Blitz', color: '#f0c040' },
  'code-repair': { icon: '🔧', title: 'Code Repair', color: '#4dabf7' },
  'memory-match': { icon: '🧠', title: 'Memory Match', color: '#69db7c' },
  'speed-type': { icon: '⌨️', title: 'Speed Type', color: '#e599f7' },
  'output-guess': { icon: '🔮', title: 'Output Guess', color: '#ffa94d' },
}

export default function Game() {
  const { type: gameType } = useParams()
  const navigate = useNavigate()
  const lang = useStore(s => s.currentLang)
  const awardXP = useStore(s => s.awardXP)
  const setGameStats = useStore(s => s.setGameStats)
  const games = useStore(s => s[s.currentLang].games)

  const gameAreaRef = useRef(null)
  const gameInstanceRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const meta = GAME_META[gameType]
  const langName = lang === 'python' ? 'Python' : 'JavaScript'

  const handleComplete = useCallback((gameResult) => {
    const { score = 0, total = 0, xp: earnedXP = 0, time = 0 } = gameResult
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    const currentGames = useStore.getState()[useStore.getState().currentLang]?.games || {}
    const existing = currentGames[gameType] || { played: 0, bestScore: 0, totalXP: 0, bestTime: null }
    const newBest = pct > (existing.bestScore || 0)

    setGameStats(gameType, {
      played: (existing.played || 0) + 1,
      bestScore: Math.max(existing.bestScore || 0, pct),
      totalXP: (existing.totalXP || 0) + earnedXP,
      lastPlayed: Date.now(),
      bestTime: existing.bestTime === null ? time : (time > 0 ? Math.min(existing.bestTime, time) : existing.bestTime),
    })

    if (earnedXP > 0) awardXP(earnedXP)

    let resultIcon, resultTitle
    if (pct >= 90) { resultIcon = '🏆'; resultTitle = 'Excellent !' }
    else if (pct >= 70) { resultIcon = '🎉'; resultTitle = 'Bien joue !' }
    else if (pct >= 50) { resultIcon = '👍'; resultTitle = 'Pas mal !' }
    else { resultIcon = '💪'; resultTitle = 'Continue !' }

    setResult({ score, total, pct, earnedXP, time, newBest, resultIcon, resultTitle })
  }, [gameType, setGameStats, awardXP])

  const loadGame = useCallback(() => {
    if (!gameType || !GAME_REGISTRY[gameType] || !gameAreaRef.current) return
    setLoading(true)
    setError(null)
    setResult(null)

    GAME_REGISTRY[gameType]()
      .then(module => {
        const GameClass = module.default || module[Object.keys(module)[0]]
        if (!GameClass) throw new Error('Module de jeu invalide')
        if (gameAreaRef.current) {
          gameAreaRef.current.innerHTML = ''
          const game = new GameClass(gameAreaRef.current, lang)
          gameInstanceRef.current = game
          game.onComplete(handleComplete)
          game.start()
        }
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [gameType, lang, handleComplete])

  useEffect(() => {
    loadGame()
    return () => {
      if (gameInstanceRef.current?.destroy) { gameInstanceRef.current.destroy(); gameInstanceRef.current = null }
    }
  }, [loadGame])

  const handleReplay = () => {
    if (gameInstanceRef.current?.destroy) { gameInstanceRef.current.destroy(); gameInstanceRef.current = null }
    setResult(null)
    loadGame()
  }

  if (!gameType || !GAME_REGISTRY[gameType]) {
    return (
      <div className="text-center py-20 text-text-muted">
        <p>Jeu inconnu: {gameType || 'aucun'}.</p>
        <button onClick={() => navigate('/games')} className="btn-neon btn-small mt-4">← Retour aux jeux</button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/games')} className="text-text-muted hover:text-text-primary text-lg">✕</button>
          <h2 className="font-bold text-lg">{meta.icon} {meta.title}</h2>
          <span className="text-text-muted text-sm">— {langName}</span>
        </div>
      </div>

      <div ref={gameAreaRef} className="min-h-[400px]">
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-3xl mb-4 animate-pulse">{meta.icon}</div>
              <p className="text-text-muted">Chargement du jeu...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">😵</p>
            <p className="text-neon-red mb-4">Erreur: {error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleReplay} className="btn-neon btn-small">Reessayer</button>
              <button onClick={() => navigate('/games')} className="btn-neon btn-small">← Retour</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!result} onClose={() => setResult(null)}>
        {result && (
          <div className="text-center">
            <div className="text-5xl mb-4">{result.resultIcon}</div>
            <h2 className="text-xl font-bold mb-2">{result.resultTitle}</h2>
            <p className="text-text-muted text-lg">{result.score} / {result.total} ({result.pct}%)</p>
            <p className="text-xl text-neon-gold font-bold my-4">+{result.earnedXP} XP</p>
            <div className="flex gap-3 justify-center flex-wrap mb-4">
              <div className="text-center p-2 px-4 rounded-lg bg-bg-card border" style={{ borderColor: `${meta.color}44` }}>
                <div className="font-bold text-lg" style={{ color: meta.color }}>{result.pct}%</div>
                <div className="text-text-muted text-xs">Score</div>
              </div>
              {result.time > 0 && (
                <div className="text-center p-2 px-4 rounded-lg bg-bg-card border border-white/[0.06]">
                  <div className="font-bold text-lg text-accent-primary">{Math.round(result.time / 1000)}s</div>
                  <div className="text-text-muted text-xs">Temps</div>
                </div>
              )}
              {result.newBest && (
                <div className="text-center p-2 px-4 rounded-lg bg-bg-card border border-neon-gold/30">
                  <div className="font-bold text-lg text-neon-gold">🌟</div>
                  <div className="text-text-muted text-xs">Record !</div>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={handleReplay} className="btn-neon btn-primary">🔄 Rejouer</button>
              <button onClick={() => navigate('/games')} className="btn-neon">🎮 Autres jeux</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
