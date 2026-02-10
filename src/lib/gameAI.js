// Game AI - Algorithme intelligent de recommandation de jeux
// Analyse les performances du joueur et génère le prochain défi adapté

const GAME_PROFILES = {
  'quiz-blitz':   { difficulty: 1, skills: ['knowledge', 'speed'],    icon: '⚡', title: 'Quiz Blitz' },
  'memory-match':  { difficulty: 1, skills: ['memory', 'knowledge'],   icon: '🧠', title: 'Memory Match' },
  'code-repair':   { difficulty: 2, skills: ['debugging', 'reading'],  icon: '🔧', title: 'Code Repair' },
  'output-guess':  { difficulty: 2, skills: ['reading', 'logic'],      icon: '🔮', title: 'Output Guess' },
  'speed-type':    { difficulty: 3, skills: ['typing', 'syntax'],      icon: '⌨️', title: 'Speed Type' },
  'ai-challenge':  { difficulty: 2, skills: ['knowledge', 'debugging', 'logic'], icon: '🤖', title: 'Defi IA' },
}

const DIFFICULTY_LABELS = { 1: 'Facile', 2: 'Moyen', 3: 'Difficile' }

/**
 * Analyse les stats de tous les jeux et génère une recommandation intelligente
 * @param {string} currentGame - Le jeu qui vient de se terminer
 * @param {object} currentResult - Le résultat du jeu { score, total, pct, earnedXP, time }
 * @param {object} allGameStats - Stats de tous les jeux depuis le store
 * @param {number} userLevel - Niveau du joueur
 * @returns {object} Recommandation { gameType, reason, challenge, difficulty, icon, title }
 */
export function getNextGameRecommendation(currentGame, currentResult, allGameStats, userLevel) {
  const scores = buildScoreMap(allGameStats)
  const currentPct = currentResult.pct

  // Calculer un score pour chaque jeu candidat
  const candidates = Object.keys(GAME_PROFILES)
    .filter(g => g !== currentGame)
    .map(gameType => {
      const profile = GAME_PROFILES[gameType]
      const stats = allGameStats[gameType]
      let score = 0

      // 1. Favoriser les jeux pas encore joués (exploration)
      if (!stats || stats.played === 0) {
        score += 40
      }

      // 2. Favoriser les jeux où le joueur est faible (amélioration)
      if (stats && stats.bestScore > 0 && stats.bestScore < 60) {
        score += 30
      } else if (stats && stats.bestScore >= 60 && stats.bestScore < 80) {
        score += 15
      }

      // 3. Adapter la difficulté selon la performance actuelle
      if (currentPct >= 90) {
        // Excellent : proposer plus dur
        if (profile.difficulty > GAME_PROFILES[currentGame].difficulty) score += 25
        if (profile.difficulty === GAME_PROFILES[currentGame].difficulty) score += 10
      } else if (currentPct >= 60) {
        // Correct : proposer même niveau ou légèrement différent
        if (profile.difficulty === GAME_PROFILES[currentGame].difficulty) score += 20
        if (Math.abs(profile.difficulty - GAME_PROFILES[currentGame].difficulty) === 1) score += 15
      } else {
        // Faible : proposer plus facile ou même niveau
        if (profile.difficulty < GAME_PROFILES[currentGame].difficulty) score += 25
        if (profile.difficulty === GAME_PROFILES[currentGame].difficulty) score += 15
      }

      // 4. Varier les compétences travaillées
      const currentSkills = GAME_PROFILES[currentGame].skills
      const sharedSkills = profile.skills.filter(s => currentSkills.includes(s))
      if (sharedSkills.length === 0) {
        score += 15 // compétences totalement différentes = bonne variété
      } else if (sharedSkills.length < profile.skills.length) {
        score += 8  // quelques compétences en commun
      }

      // 5. Pénaliser les jeux joués très récemment
      if (stats && stats.lastPlayed) {
        const minutesSince = (Date.now() - stats.lastPlayed) / 60000
        if (minutesSince < 5) score -= 20
        else if (minutesSince < 15) score -= 10
      }

      // 6. Adapter au niveau du joueur
      if (userLevel <= 3 && profile.difficulty >= 3) score -= 15
      if (userLevel >= 7 && profile.difficulty === 1 && (!stats || stats.bestScore >= 80)) score -= 10

      // Petite variation aléatoire pour éviter la monotonie
      score += Math.random() * 8

      return { gameType, score, profile, stats }
    })
    .sort((a, b) => b.score - a.score)

  const best = candidates[0]
  const reason = generateReason(best, currentGame, currentPct, allGameStats)
  const challenge = generateChallenge(best, currentPct, allGameStats)

  return {
    gameType: best.gameType,
    reason,
    challenge,
    difficulty: DIFFICULTY_LABELS[best.profile.difficulty],
    icon: best.profile.icon,
    title: best.profile.title,
  }
}

/**
 * Si le joueur veut rejouer le même jeu, génère un défi adapté
 */
export function getReplayChallenge(gameType, currentResult, allGameStats) {
  const stats = allGameStats[gameType]
  const pct = currentResult.pct
  const bestScore = stats?.bestScore || 0

  if (pct >= 90) {
    if (currentResult.time > 0) {
      const targetTime = Math.round(currentResult.time / 1000 * 0.85)
      return `Defi : termine en moins de ${targetTime}s cette fois !`
    }
    return 'Defi : fais un sans-faute parfait !'
  }
  if (pct >= 70) {
    const target = Math.min(100, pct + 15)
    return `Defi : depasse les ${target}% cette fois !`
  }
  if (pct >= 50) {
    return `Defi : ameliore ton score de ${pct}% a ${Math.min(100, pct + 20)}% !`
  }
  return 'Defi : concentre-toi et depasse les 50% !'
}

// --- Fonctions internes ---

function buildScoreMap(allGameStats) {
  const map = {}
  for (const [type, stats] of Object.entries(allGameStats)) {
    map[type] = stats?.bestScore || 0
  }
  return map
}

function generateReason(best, currentGame, currentPct, allGameStats) {
  const { gameType, profile, stats } = best
  const currentProfile = GAME_PROFILES[currentGame]

  // Jeu jamais joué
  if (!stats || stats.played === 0) {
    return `Tu n'as pas encore essaye ${profile.icon} ${best.profile.title} ! Decouvre-le.`
  }

  // Faible score sur ce jeu
  if (stats.bestScore < 50) {
    return `Ton record sur ${profile.icon} ${best.profile.title} est ${stats.bestScore}%. Entraine-toi pour progresser !`
  }

  // Joueur a bien joué -> proposer plus dur
  if (currentPct >= 85 && profile.difficulty > currentProfile.difficulty) {
    return `Bravo pour ${currentPct}% ! Passe a un defi plus difficile.`
  }

  // Compétences différentes
  const currentSkills = currentProfile.skills
  const newSkills = profile.skills.filter(s => !currentSkills.includes(s))
  if (newSkills.length > 0) {
    return `Change de style et travaille d'autres competences !`
  }

  // Défaut
  if (stats.bestScore < 80) {
    return `Tu peux encore progresser sur ${profile.icon} ${best.profile.title} (record: ${stats.bestScore}%).`
  }

  return `Continue ton entrainement avec ${profile.icon} ${best.profile.title} !`
}

function generateChallenge(best, currentPct, allGameStats) {
  const { gameType, stats } = best

  if (!stats || stats.played === 0) {
    return 'Objectif : fais au moins 50% pour ton premier essai !'
  }

  const bestScore = stats.bestScore || 0

  if (bestScore >= 90) {
    return `Defi : bats ton record de ${bestScore}% !`
  }

  if (bestScore >= 60) {
    const target = Math.min(100, bestScore + 15)
    return `Defi : depasse les ${target}% (record actuel: ${bestScore}%).`
  }

  return `Defi : atteins les ${Math.min(70, bestScore + 25)}% !`
}
