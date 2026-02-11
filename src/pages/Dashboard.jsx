import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
import { getCurriculum } from '@/data/curriculum'
import { getAllAchievements } from '@/data/achievements-data'
import { getLanguages } from '@/data/contentSource'
import ProgressBar from '@/components/ui/ProgressBar'
import StreakCounter from '@/components/ui/StreakCounter'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const lang = useStore(s => s.currentLang)
  const progress = useStore(s => s[s.currentLang].progress)
  const achievements = useStore(s => s.achievements)
  const xpProgress = useMemo(() => useStore.getState().getProgressToNextLevel(), [user.xp, user.level])

  const curriculum = getCurriculum(lang)
  const achievementsData = getAllAchievements()
  const completedLessons = Object.values(progress).filter(p => p.completed).length
  const totalLessons = curriculum.reduce((sum, lv) => sum + lv.lessons.length, 0)
  const langMeta = getLanguages().find(l => l.id === lang)
  const langIcon = langMeta?.icon || (lang === 'python' ? '🐍' : '⚡')
  const langName = langMeta?.name || (lang === 'python' ? 'Python' : 'JavaScript')

  let nextLesson = null
  let nextLevel = null
  for (const level of curriculum) {
    if (user.xp < level.requiredXP) break
    for (const lesson of level.lessons) {
      if (!progress[lesson.id]?.completed) {
        nextLesson = lesson
        nextLevel = level
        break
      }
    }
    if (nextLesson) break
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Salut, {user.name} ! {langIcon}</h1>
          <p className="text-text-muted text-sm">Niveau {user.level} - {user.xp} XP | Parcours {langName}</p>
        </div>
        <StreakCounter />
      </div>

      <ProgressBar
        value={xpProgress.current}
        max={xpProgress.needed}
        label={`Niveau ${user.level} → ${user.level + 1}`}
        className="mb-8"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {nextLesson ? (
          <div className="neon-card cursor-pointer" onClick={() => navigate(`/lesson/${nextLesson.id}`)}>
            <span className="text-2xl block mb-2">📖</span>
            <h3 className="font-bold mb-1">Continuer</h3>
            <p className="text-text-muted text-sm">{nextLevel.icon} {nextLesson.title}</p>
          </div>
        ) : (
          <div className="neon-card">
            <span className="text-2xl block mb-2">🎉</span>
            <h3 className="font-bold mb-1">Bravo !</h3>
            <p className="text-text-muted text-sm">Toutes les lecons {langName} sont faites</p>
          </div>
        )}
        <div className="neon-card cursor-pointer" onClick={() => navigate('/games')}>
          <span className="text-2xl block mb-2">🎮</span>
          <h3 className="font-bold mb-1">Mini-Jeux</h3>
          <p className="text-text-muted text-sm">Apprends en jouant</p>
        </div>
        <div className="neon-card cursor-pointer" onClick={() => navigate('/curriculum')}>
          <span className="text-2xl block mb-2">📚</span>
          <h3 className="font-bold mb-1">Curriculum</h3>
          <p className="text-text-muted text-sm">{completedLessons}/{totalLessons} lecons</p>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Statistiques</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard value={user.xp} label="XP Total" color="var(--accent-primary)" />
        <StatCard value={completedLessons} label="Lecons Terminees" color="var(--accent-secondary)" />
        <StatCard value={achievements.length} label="Badges" color="var(--neon-gold)" />
      </div>

      <h2 className="text-lg font-bold mb-4">Progression {langName}</h2>
      <div className="flex gap-2 flex-wrap mb-8">
        {curriculum.map(level => {
          const completed = level.lessons.filter(l => progress[l.id]?.completed).length
          const total = level.lessons.length
          const allDone = completed === total
          const unlocked = user.xp >= level.requiredXP

          return (
            <div
              key={level.id}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-bg-card min-w-[60px] transition-all"
              style={{
                border: `2px solid ${allDone ? level.color : unlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                opacity: unlocked ? 1 : 0.4,
                cursor: unlocked ? 'pointer' : 'default',
                boxShadow: allDone ? `0 0 10px ${level.color}33` : 'none',
              }}
              onClick={() => {
                if (!unlocked) return
                const next = level.lessons.find(l => !progress[l.id]?.completed) || level.lessons[0]
                navigate(`/lesson/${next.id}`)
              }}
              title={`Niveau ${level.id}: ${level.title}`}
            >
              <span className="text-xl">{level.icon}</span>
              <span className="text-[0.7rem] text-text-muted">{completed}/{total}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Badges</h2>
        <button onClick={() => navigate('/profile')} className="text-sm text-accent-secondary hover:underline">
          Voir tout →
        </button>
      </div>
      <div className="flex gap-4 flex-wrap">
        {achievementsData.slice(0, 6).map(badge => (
          <Badge key={badge.id} achievement={badge} unlocked={achievements.includes(badge.id)} />
        ))}
      </div>
    </div>
  )
}
