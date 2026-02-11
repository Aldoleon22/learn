import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
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

  const [collapsed, setCollapsed] = useState({})
  const toggleLevel = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))

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
    </div>
  )
}
