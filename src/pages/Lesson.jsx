import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useStore from '@/store/useStore'
import { getCurriculum } from '@/data/curriculum'
import CodeEditor from '@/components/editor/CodeEditor'
import Modal from '@/components/ui/Modal'

export default function Lesson() {
  const { id: lessonId } = useParams()
  const navigate = useNavigate()
  const lang = useStore(s => s.currentLang)
  const awardXP = useStore(s => s.awardXP)
  const setProgress = useStore(s => s.setProgress)
  const getProgress = useStore(s => s.getProgress)

  const [showComplete, setShowComplete] = useState(false)
  const [xpGained, setXpGained] = useState(0)

  // Reset modal when navigating to a different lesson
  useEffect(() => {
    setShowComplete(false)
    setXpGained(0)
  }, [lessonId])

  const curriculum = getCurriculum(lang)

  const found = useMemo(() => {
    for (const level of curriculum) {
      const idx = level.lessons.findIndex(l => l.id === lessonId)
      if (idx !== -1) return { level, lesson: level.lessons[idx], lessonIndex: idx }
    }
    return null
  }, [curriculum, lessonId])

  const nextLesson = useMemo(() => {
    if (!found) return null
    let foundCurrent = false
    for (const level of curriculum) {
      for (const lesson of level.lessons) {
        if (foundCurrent) return lesson
        if (lesson.id === lessonId) foundCurrent = true
      }
    }
    return null
  }, [curriculum, lessonId, found])

  const handleSuccess = useCallback(() => {
    if (showComplete) return
    const prev = getProgress(lessonId) || {}
    const isFirstCompletion = !prev.completed

    setProgress(lessonId, {
      completed: true,
      bestScore: 100,
      attempts: (prev.attempts || 0) + 1,
      lastAttempt: Date.now(),
    })

    let gained = 0
    if (isFirstCompletion) {
      gained = found?.lesson?.exercise?.xpReward || 50
      awardXP(gained)
    }
    setXpGained(gained)
    setShowComplete(true)
  }, [lessonId, showComplete, found, getProgress, setProgress, awardXP])

  const handleCompleteTheory = () => {
    const prev = getProgress(lessonId) || {}
    const isFirst = !prev.completed
    setProgress(lessonId, { completed: true, bestScore: 100, attempts: (prev.attempts || 0) + 1, lastAttempt: Date.now() })
    let gained = 0
    if (isFirst) {
      gained = found?.lesson?.exercise?.xpReward || 50
      awardXP(gained)
    }
    setXpGained(gained)
    setShowComplete(true)
  }

  if (!lessonId || !found) {
    return (
      <div className="text-center py-20 text-text-muted">
        <p>Lecon introuvable.</p>
        <Link to="/curriculum" className="text-accent-secondary hover:underline mt-2 inline-block">Retour au curriculum</Link>
      </div>
    )
  }

  const { level, lesson } = found
  const exercise = lesson.exercise
  const xp = exercise?.xpReward || 50

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/curriculum')} className="text-text-muted hover:text-text-primary text-lg">✕</button>
          <div>
            <h2 className="font-bold text-lg">{level.icon} {lesson.title}</h2>
            <p className="text-text-muted text-xs">Niveau {level.id} — +{xp} XP</p>
          </div>
        </div>
        <Link to="/curriculum" className="btn-neon btn-small">📚 Curriculum</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-bg-secondary border-b border-white/[0.06] text-sm font-semibold text-text-secondary">
            📖 Theorie
          </div>
          <div
            className="p-5 text-sm leading-relaxed prose-lesson"
            dangerouslySetInnerHTML={{ __html: lesson.theory || '<p class="text-text-muted">Pas de theorie pour cette lecon.</p>' }}
          />
        </div>

        <div className="bg-bg-card border border-white/[0.06] rounded-xl overflow-hidden">
          {exercise ? (
            <>
              <div className="px-4 py-3 bg-bg-secondary border-b border-white/[0.06] text-sm font-semibold text-text-secondary">
                {lang === 'python' ? '🐍' : '⚡'} Exercice
              </div>
              <div className="p-5">
                <CodeEditor key={lessonId} lang={lang} exercise={exercise} onSuccess={handleSuccess} />
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 bg-bg-secondary border-b border-white/[0.06] text-sm font-semibold text-text-secondary">
                📝 Info
              </div>
              <div className="p-5">
                <p className="text-text-muted text-sm mb-4">Cette lecon est purement theorique. Lis la theorie a gauche puis passe a la suivante.</p>
                <button onClick={handleCompleteTheory} className="btn-neon btn-primary">✓ Marquer comme terminee</button>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={showComplete} onClose={() => setShowComplete(false)}>
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">Lecon Terminee !</h2>
          <p className="text-lg text-neon-gold font-bold mb-6">
            {xpGained > 0 ? `+${xpGained} XP !` : 'Deja completee — pas de XP supplementaire'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setShowComplete(false); navigate(0) }} className="btn-neon btn-small">🔄 Refaire</button>
            {nextLesson ? (
              <button onClick={() => navigate(`/lesson/${nextLesson.id}`)} className="btn-neon btn-primary">→ {nextLesson.title}</button>
            ) : (
              <button onClick={() => navigate('/curriculum')} className="btn-neon btn-primary">🎉 Tout termine !</button>
            )}
            <button onClick={() => navigate('/curriculum')} className="btn-neon btn-small">📚 Curriculum</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
