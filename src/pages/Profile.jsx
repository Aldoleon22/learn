import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '@/store/useStore'
import { getCurriculum } from '@/data/curriculum'
import { getAllAchievements, getRarityLabel, getRarityColor } from '@/data/achievements-data'
import { getLanguages } from '@/data/contentSource'
import ProgressBar from '@/components/ui/ProgressBar'
import StatCard from '@/components/ui/StatCard'
import { useToast } from '@/components/ui/ToastProvider'

export default function Profile() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const user = useStore(s => s.user)
  const currentLang = useStore(s => s.currentLang)
  const achievements = useStore(s => s.achievements)
  const setUserName = useStore(s => s.setUserName)
  const setLang = useStore(s => s.setLang)
  const reset = useStore(s => s.reset)
  const xpProgress = useMemo(() => useStore.getState().getProgressToNextLevel(), [user.xp, user.level])
  const achievementsData = getAllAchievements()

  const [nameInput, setNameInput] = useState(user.name)
  const [showReset, setShowReset] = useState(false)

  const langStats = {}
  const availableLangs = getLanguages().map(l => l.id)
  for (const lang of availableLangs) {
    const state = useStore.getState()
    const progressData = state[lang]?.progress || {}
    const gamesData = state[lang]?.games || {}
    const curriculum = getCurriculum(lang)
    const completedLessons = Object.values(progressData).filter(p => p.completed).length
    const totalLessons = curriculum.reduce((sum, lv) => sum + lv.lessons.length, 0)
    let totalGamesPlayed = 0, bestGameScore = 0
    Object.values(gamesData).forEach(g => { totalGamesPlayed += g.played || 0; bestGameScore = Math.max(bestGameScore, g.bestScore || 0) })
    langStats[lang] = { completedLessons, totalLessons, pct: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0, totalGamesPlayed, bestGameScore }
  }

  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Inconnu'
  const totalLessonsAll = Object.values(langStats).reduce((sum, s) => sum + (s?.completedLessons || 0), 0)
  const totalGames = Object.values(langStats).reduce((sum, s) => sum + (s?.totalGamesPlayed || 0), 0)

  const handleSaveName = () => {
    const name = nameInput.trim()
    if (name && name.length <= 30) { setUserName(name); addToast('Nom mis a jour !', { type: 'success' }) }
    else addToast('Nom invalide (1-30 caracteres)', { type: 'error' })
  }

  const handleSwitchLang = (lang) => {
    if (lang !== currentLang) { setLang(lang); addToast(`Parcours ${lang === 'python' ? 'Python' : 'JavaScript'} active !`, { type: 'success' }) }
  }

  const handleReset = () => { reset(); addToast('Toutes les donnees ont ete supprimees.', { type: 'success' }); setTimeout(() => navigate('/dashboard'), 1000) }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">👤 Profil</h1>
          <p className="text-text-muted text-sm">Gere ton compte et consulte tes stats</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-neon btn-small">← Tableau de bord</button>
      </div>

      <div className="neon-card mb-8">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-3xl flex-shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-text-muted text-sm mb-2">Niveau {user.level} — {user.xp} XP | Membre depuis {joinDate}</p>
            <ProgressBar value={xpProgress.current} max={xpProgress.needed} label={`Niveau ${user.level} → ${user.level + 1}`} />
          </div>
          <div className="text-center p-3 bg-bg-secondary rounded-lg">
            <div className="text-3xl">🔥</div>
            <div className="text-xl font-bold">{user.streak || 0}</div>
            <div className="text-text-muted text-xs">jours</div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Progression par langage</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {getLanguages().map(langItem => {
          const lang = langItem.id
          const s = langStats[lang]
          if (!s) return null
          const icon = langItem.icon || (lang === 'python' ? '🐍' : '⚡')
          const name = langItem.name || (lang === 'python' ? 'Python' : 'JavaScript')
          const isActive = lang === currentLang
          return (
            <div key={lang} className="neon-card" style={{ borderColor: isActive ? 'var(--accent-primary)' : undefined, boxShadow: isActive ? '0 0 15px rgba(0,255,136,0.13)' : undefined }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">{icon} {name}</h3>
                {isActive && <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/30">Actif</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-center p-2 bg-bg-secondary rounded-lg"><div className="font-bold">{s.completedLessons}/{s.totalLessons}</div><div className="text-text-muted text-[0.7rem]">Lecons</div></div>
                <div className="text-center p-2 bg-bg-secondary rounded-lg"><div className="font-bold">{s.pct}%</div><div className="text-text-muted text-[0.7rem]">Complete</div></div>
                <div className="text-center p-2 bg-bg-secondary rounded-lg"><div className="font-bold">{s.totalGamesPlayed}</div><div className="text-text-muted text-[0.7rem]">Parties</div></div>
                <div className="text-center p-2 bg-bg-secondary rounded-lg"><div className="font-bold">{s.bestGameScore}%</div><div className="text-text-muted text-[0.7rem]">Meilleur jeu</div></div>
              </div>
              <ProgressBar value={s.completedLessons} max={s.totalLessons} color={lang === 'python' ? '#3572A5' : '#f0db4f'} />
            </div>
          )
        })}
      </div>

      <h2 className="text-lg font-bold mb-4">Statistiques globales</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard value={user.xp} label="XP Total" color="var(--accent-primary)" />
        <StatCard value={user.level} label="Niveau" color="var(--accent-secondary)" />
        <StatCard value={totalLessonsAll} label="Lecons (total)" color="var(--neon-gold)" />
        <StatCard value={totalGames} label="Parties jouees" color="#e599f7" />
      </div>

      <h2 className="text-lg font-bold mb-4">Badges ({achievements.length}/{achievementsData.length})</h2>
      <ProgressBar value={achievements.length} max={achievementsData.length} label={`${achievements.length} / ${achievementsData.length} badges debloques`} className="mb-4" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4 mb-8">
        {achievementsData.map(badge => {
          const unlocked = achievements.includes(badge.id)
          return (
            <div key={badge.id} className="flex flex-col items-center gap-1 p-4 rounded-xl bg-bg-card text-center transition-all"
              style={{ border: `1px solid ${unlocked ? 'rgba(255,209,102,0.27)' : 'rgba(255,255,255,0.06)'}`, opacity: unlocked ? 1 : 0.5, boxShadow: unlocked ? '0 0 10px rgba(255,209,102,0.13)' : undefined }}
              title={badge.description}>
              <div className="text-3xl">{unlocked ? badge.icon : '🔒'}</div>
              <div className="text-xs font-semibold">{badge.title}</div>
              <div className="text-text-muted text-[0.7rem]">{badge.description}</div>
              {unlocked && badge.rarity && (
                <div className="text-[0.65rem] px-1.5 py-0.5 rounded-full mt-1" style={{ background: `${getRarityColor(badge.rarity)}22`, color: getRarityColor(badge.rarity) }}>{getRarityLabel(badge.rarity)}</div>
              )}
            </div>
          )
        })}
      </div>

      <h2 className="text-lg font-bold mb-4">Parametres</h2>
      <div className="neon-card">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div><strong>Administration</strong><p className="text-text-muted text-xs">Ajouter un nouveau langage</p></div>
            <button onClick={() => navigate('/admin/language')} className="btn-neon btn-small">➕ Ajouter</button>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div><strong>Nom d'affichage</strong><p className="text-text-muted text-xs">Actuellement: {user.name}</p></div>
            <div className="flex gap-2">
              <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} className="px-3 py-1.5 bg-bg-input border border-white/[0.06] rounded text-sm text-text-primary max-w-[180px] outline-none focus:border-accent-secondary" placeholder="Nouveau nom" />
              <button onClick={handleSaveName} className="btn-neon btn-small">Sauver</button>
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div><strong>Langage actif</strong><p className="text-text-muted text-xs">Change de parcours</p></div>
            <div className="flex gap-2">
              {getLanguages().map(langItem => (
                <button
                  key={langItem.id}
                  onClick={() => handleSwitchLang(langItem.id)}
                  className={`btn-neon btn-small ${currentLang === langItem.id ? 'btn-primary' : ''}`}
                >
                  {langItem.icon || '📘'} {langItem.name || langItem.id}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div><strong className="text-neon-red">Zone dangereuse</strong><p className="text-text-muted text-xs">Reinitialise toutes les donnees (irreversible)</p></div>
              <button onClick={() => setShowReset(true)} className="px-3 py-1.5 rounded text-sm font-semibold bg-neon-red text-white border-none cursor-pointer">🗑️ Tout reinitialiser</button>
            </div>
            {showReset && (
              <div className="mt-3 p-3 rounded-lg bg-neon-red/10 border border-neon-red/30">
                <p className="text-sm mb-3">⚠️ Es-tu sur ? Cette action supprimera TOUTE ta progression (JS + Python), tes badges et tes stats de jeux.</p>
                <div className="flex gap-2">
                  <button onClick={handleReset} className="px-3 py-1.5 rounded text-sm font-semibold bg-neon-red text-white border-none cursor-pointer">Oui, tout supprimer</button>
                  <button onClick={() => setShowReset(false)} className="btn-neon btn-small">Annuler</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
