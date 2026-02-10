import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
import Modal from '@/components/ui/Modal'
import { getNextGameRecommendation, getReplayChallenge } from '@/lib/gameAI'
import { generateBatch, isGeneratorAvailable } from '@/lib/questionGenerator'

const GAME_REGISTRY = {
  'quiz-blitz': () => import('@/games/quiz-blitz'),
  'code-repair': () => import('@/games/code-repair'),
  'memory-match': () => import('@/games/memory-match'),
  'speed-type': () => import('@/games/speed-type'),
  'output-guess': () => import('@/games/output-guess'),
  'ai-challenge': () => import('@/games/ai-challenge'),
}

const GAME_META = {
  'quiz-blitz': { icon: '⚡', title: 'Quiz Blitz', color: '#f0c040' },
  'code-repair': { icon: '🔧', title: 'Code Repair', color: '#4dabf7' },
  'memory-match': { icon: '🧠', title: 'Memory Match', color: '#69db7c' },
  'speed-type': { icon: '⌨️', title: 'Speed Type', color: '#e599f7' },
  'output-guess': { icon: '🔮', title: 'Output Guess', color: '#ffa94d' },
  'ai-challenge': { icon: '🤖', title: 'Defi IA', color: '#7c3aed' },
}

export default function Game() {
  const { type: gameType } = useParams()
  const navigate = useNavigate()
  const lang = useStore(s => s.currentLang)
  const awardXP = useStore(s => s.awardXP)
  const setGameStats = useStore(s => s.setGameStats)

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

    // AI: Générer la recommandation pour le prochain jeu
    const currentLangGames = useStore.getState()[useStore.getState().currentLang]?.games || {}
    const userLevel = useStore.getState().user.level
    const recommendation = getNextGameRecommendation(gameType, { score, total, pct, earnedXP, time }, currentLangGames, userLevel)
    const replayChallenge = getReplayChallenge(gameType, { score, total, pct, earnedXP, time }, currentLangGames)

    setResult({ score, total, pct, earnedXP, time, newBest, resultIcon, resultTitle, recommendation, replayChallenge })

    // Génération en arrière-plan : OpenAI crée de nouvelles questions pour le prochain jeu
    if (isGeneratorAvailable()) {
      const currentLang = useStore.getState().currentLang
      generateBatch(currentLang).then(res => {
        if (res.generated) {
          console.log('[GameAI] Nouvelles questions generees:', res.counts)
        }
      })
    }
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
          // Pass config to AI Challenge so it can adapt to player stats
          const config = gameType === 'ai-challenge' ? {
            gameStats: useStore.getState()[useStore.getState().currentLang]?.games || {},
            userLevel: useStore.getState().user.level,
          } : undefined
          const game = new GameClass(gameAreaRef.current, lang, config)
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

      <div className="min-h-[400px] relative">
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
        <div ref={gameAreaRef} className="min-h-[400px]" />
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

            {/* AI Recommendation */}
            {result.recommendation && (
              <div className="mt-4 mb-4 p-4 rounded-xl border border-accent-primary/30 bg-accent-primary/[0.05] text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <span className="font-bold text-sm text-accent-primary">IA Coach recommande</span>
                </div>
                <p className="text-text-muted text-sm mb-2">{result.recommendation.reason}</p>
                <p className="text-xs text-neon-gold italic">{result.recommendation.challenge}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={handleReplay} className="btn-neon btn-primary" title={result.replayChallenge}>
                🔄 Rejouer
              </button>
              {gameType !== 'ai-challenge' && (
                <button
                  onClick={() => navigate('/game/ai-challenge')}
                  className="btn-neon"
                  style={{ borderColor: '#7c3aed88', color: '#7c3aed', background: 'rgba(124,58,237,0.08)' }}
                >
                  🤖 Defi IA
                </button>
              )}
              {result.recommendation && (
                <button
                  onClick={() => navigate(`/game/${result.recommendation.gameType}`)}
                  className="btn-neon"
                  style={{ borderColor: `${meta.color}66`, color: meta.color }}
                >
                  {result.recommendation.icon} {result.recommendation.title}
                </button>
              )}
              <button onClick={() => navigate('/games')} className="btn-neon">🎮 Tous les jeux</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
