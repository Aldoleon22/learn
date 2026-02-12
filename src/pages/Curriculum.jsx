import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
import useContentStore from '@/store/contentStore'
import { getCurriculum } from '@/data/curriculum'
import { getLanguages } from '@/data/contentSource'
import ProgressBar from '@/components/ui/ProgressBar'

export default function Curriculum() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const lang = useStore(s => s.currentLang)
  const progress = useStore(s => s[s.currentLang].progress)

  const curriculum = getCurriculum(lang)
  const langMeta = getLanguages().find(l => l.id === lang)
  const langIcon = langMeta?.icon || (lang === 'python' ? '🐍' : '⚡')
  const langName = langMeta?.name || (lang === 'python' ? 'Python' : 'JavaScript')
  const completedLessons = Object.values(progress).filter(p => p.completed).length
  const totalLessons = curriculum.reduce((sum, lv) => sum + lv.lessons.length, 0)
  const allCompleted = totalLessons > 0 && completedLessons === totalLessons

  const [collapsed, setCollapsed] = useState({})
  const toggleLevel = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))

  // Advanced generation state
  const [genLoading, setGenLoading] = useState(false)
  const [genSteps, setGenSteps] = useState([])
  const [genError, setGenError] = useState(null)
  const [genResult, setGenResult] = useState(null)
  const abortRef = useRef(null)

  const handleGenerateAdvanced = async () => {
    setGenLoading(true)
    setGenError(null)
    setGenResult(null)
    setGenSteps([])

    try {
      const url = `/api/content/generate-advanced/${encodeURIComponent(lang)}`
      const ctrl = new AbortController()
      abortRef.current = ctrl

      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error('Serveur indisponible')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break
        buffer += decoder.decode(chunk, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.step === 'error') throw new Error(data.message)

            if (data.step === 'complete') {
              setGenResult(data.stats)
              setGenSteps(prev => prev.map(s => ({ ...s, done: true, active: false })))
              useContentStore.getState().load({ force: true })
              continue
            }

            if (data.step === 'save') {
              setGenSteps(prev => prev.map(s => ({ ...s, active: false })))
              continue
            }

            if (typeof data.step === 'number') {
              setGenSteps(prev => {
                const exists = prev.find(s => s.id === data.step)
                if (exists) {
                  return prev.map(s => {
                    if (s.id === data.step) return { ...s, label: data.label, done: !!data.done, active: !data.done }
                    return { ...s, active: false }
                  })
                }
                return [
                  ...prev.map(s => ({ ...s, active: false })),
                  { id: data.step, label: data.label, done: !!data.done, active: !data.done },
                ]
              })
            }
          } catch (e) {
            if (e.message && !e.message.includes('JSON')) throw e
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setGenError(err.message || 'Erreur de generation')
      }
    } finally {
      setGenLoading(false)
      abortRef.current = null
    }
  }

  const handleCancelGen = () => {
    abortRef.current?.abort()
    setGenLoading(false)
  }

  const genDoneCount = genSteps.filter(s => s.done).length
  const genPct = genSteps.length > 0 ? Math.round((genDoneCount / genSteps.length) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{langIcon} Curriculum {langName}</h1>
          <p className="text-text-muted text-sm">{completedLessons} / {totalLessons} lecons terminees</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-neon btn-small">← Tableau de bord</button>
      </div>

      <ProgressBar value={completedLessons} max={totalLessons} label={`Progression globale ${langName}`} className="mb-8" />

      <div className="flex flex-col gap-6">
        {curriculum.map(level => {
          const unlocked = user.xp >= level.requiredXP
          const levelCompleted = level.lessons.filter(l => progress[l.id]?.completed).length
          const levelTotal = level.lessons.length
          const allDone = levelCompleted === levelTotal
          const isCollapsed = collapsed[level.id]

          return (
            <div
              key={level.id}
              className="neon-card"
              style={{
                borderColor: allDone ? level.color : undefined,
                opacity: unlocked ? 1 : 0.5,
                boxShadow: allDone ? `0 0 15px ${level.color}22` : undefined,
              }}
            >
              <div className="flex items-center justify-between cursor-pointer mb-4" onClick={() => toggleLevel(level.id)}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{level.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: level.color }}>Niveau {level.id} — {level.title}</h3>
                    <p className="text-text-muted text-sm">
                      {unlocked ? `${levelCompleted}/${levelTotal} lecons` : `🔒 Requis: ${level.requiredXP} XP`}
                    </p>
                  </div>
                </div>
                <span className="text-xl transition-transform" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span>
              </div>

              {!isCollapsed && unlocked && (
                <ProgressBar value={levelCompleted} max={levelTotal} color={level.color} className="mb-4" />
              )}

              {!isCollapsed && (
                unlocked ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {level.lessons.map((lesson, idx) => {
                      const lp = progress[lesson.id]
                      const completed = lp?.completed
                      const prevDone = idx === 0 || progress[level.lessons[idx - 1]?.id]?.completed
                      const available = prevDone

                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-bg-card transition-all"
                          style={{
                            border: `1px solid ${completed ? level.color + '66' : 'rgba(255,255,255,0.06)'}`,
                            cursor: available ? 'pointer' : 'default',
                            opacity: available ? 1 : 0.45,
                          }}
                          onClick={() => available && navigate(`/lesson/${lesson.id}`)}
                        >
                          <span className="text-xl">{completed ? '✅' : available ? '▶️' : '🔒'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{lesson.title}</div>
                            <div className="text-text-muted text-xs flex gap-3">
                              <span>+{lesson.exercise?.xpReward || 50} XP</span>
                              {completed && <span>Score: {lp.bestScore || 0}%</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-text-muted text-center py-4 text-sm">
                    🔒 Gagne {level.requiredXP} XP pour debloquer ce niveau
                  </p>
                )
              )}
            </div>
          )
        })}
      </div>

      {/* Advanced generation banner — shown when all lessons are completed */}
      {allCompleted && (
        <div className="neon-card mt-8" style={{ borderColor: 'var(--accent-secondary)', boxShadow: '0 0 20px rgba(0,204,255,0.1)' }}>
          {!genLoading && !genResult && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="text-xl font-bold mb-2">Curriculum termine !</h3>
              <p className="text-text-muted text-sm mb-4">
                Tu as complete toutes les lecons de {langName}. Genere des niveaux avances pour aller plus loin : design patterns, performance, testing et projets pro.
              </p>
              <button onClick={handleGenerateAdvanced} className="btn-neon btn-primary px-6 py-2">
                Generer des lecons avancees
              </button>
            </div>
          )}

          {/* Generation progress */}
          {genLoading && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Generation en cours...</h3>
                <button onClick={handleCancelGen} className="px-3 py-1 rounded text-xs font-semibold border cursor-pointer" style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)' }}>
                  Annuler
                </button>
              </div>

              {genSteps.length > 0 && (
                <>
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>{genDoneCount}/{genSteps.length} etapes</span>
                    <span>{genPct}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full transition-all duration-500"
                      style={{ width: `${genPct}%` }}
                    />
                  </div>
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                    {genSteps.map(s => (
                      <div key={s.id} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all ${s.active ? 'bg-white/[0.03]' : ''}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300 ${
                          s.done ? 'bg-neon-green/20 text-neon-green' : s.active ? 'bg-accent-secondary/20 text-accent-secondary animate-pulse' : 'bg-white/5 text-text-muted'
                        }`}>
                          {s.done ? '✓' : s.active ? '⋯' : s.id}
                        </div>
                        <span className={`text-xs transition-colors ${s.done ? 'text-neon-green' : s.active ? 'text-text-primary' : 'text-text-muted'}`}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Generation error */}
          {genError && (
            <div className="p-3 rounded-lg bg-neon-red/10 border border-neon-red/20 text-sm text-neon-red mt-3">
              {genError}
            </div>
          )}

          {/* Generation success */}
          {genResult && (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🚀</div>
              <h3 className="text-xl font-bold text-neon-green mb-1">Niveaux avances generes !</h3>
              <p className="text-text-muted text-sm mb-4">
                {genResult.levels} nouveaux niveaux, {genResult.lessons} lecons ajoutees
              </p>
              <button onClick={() => window.location.reload()} className="btn-neon btn-primary px-6 py-2">
                Voir les nouveaux niveaux
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
