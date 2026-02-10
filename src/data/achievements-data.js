// Achievements Data - Cross-language achievement definitions and checking logic

const ACHIEVEMENTS = [
    // ===== PROGRESSION ACHIEVEMENTS =====
    {
        id: 'first-steps',
        icon: '🐣',
        title: 'Premiers Pas',
        description: 'Termine ta première leçon dans n\'importe quel langage.',
        category: 'progression',
        rarity: 'common',
        xpReward: 50,
        check: (state) => {
            const jsProgress = Object.values(state.js?.progress || {});
            const pyProgress = Object.values(state.python?.progress || {});
            return jsProgress.some(p => p.completed) || pyProgress.some(p => p.completed);
        }
    },
    {
        id: 'js-beginner',
        icon: '🟡',
        title: 'Apprenti JavaScript',
        description: 'Termine 5 leçons en JavaScript.',
        category: 'progression',
        rarity: 'common',
        xpReward: 100,
        check: (state) => {
            const completed = Object.values(state.js?.progress || {}).filter(p => p.completed);
            return completed.length >= 5;
        }
    },
    {
        id: 'py-beginner',
        icon: '🐍',
        title: 'Apprenti Python',
        description: 'Termine 5 leçons en Python.',
        category: 'progression',
        rarity: 'common',
        xpReward: 100,
        check: (state) => {
            const completed = Object.values(state.python?.progress || {}).filter(p => p.completed);
            return completed.length >= 5;
        }
    },
    {
        id: 'js-intermediate',
        icon: '⚡',
        title: 'Développeur JS',
        description: 'Termine 15 leçons en JavaScript.',
        category: 'progression',
        rarity: 'uncommon',
        xpReward: 250,
        check: (state) => {
            const completed = Object.values(state.js?.progress || {}).filter(p => p.completed);
            return completed.length >= 15;
        }
    },
    {
        id: 'py-intermediate',
        icon: '🔮',
        title: 'Développeur Python',
        description: 'Termine 15 leçons en Python.',
        category: 'progression',
        rarity: 'uncommon',
        xpReward: 250,
        check: (state) => {
            const completed = Object.values(state.python?.progress || {}).filter(p => p.completed);
            return completed.length >= 15;
        }
    },
    {
        id: 'bilingual',
        icon: '🌍',
        title: 'Bilingue',
        description: 'Termine au moins 5 leçons dans les DEUX langages.',
        category: 'progression',
        rarity: 'rare',
        xpReward: 500,
        check: (state) => {
            const jsCount = Object.values(state.js?.progress || {}).filter(p => p.completed).length;
            const pyCount = Object.values(state.python?.progress || {}).filter(p => p.completed).length;
            return jsCount >= 5 && pyCount >= 5;
        }
    },
    {
        id: 'polyglot',
        icon: '👑',
        title: 'Polyglotte',
        description: 'Termine au moins 15 leçons dans les DEUX langages.',
        category: 'progression',
        rarity: 'legendary',
        xpReward: 1000,
        check: (state) => {
            const jsCount = Object.values(state.js?.progress || {}).filter(p => p.completed).length;
            const pyCount = Object.values(state.python?.progress || {}).filter(p => p.completed).length;
            return jsCount >= 15 && pyCount >= 15;
        }
    },

    // ===== GAME ACHIEVEMENTS =====
    {
        id: 'quiz-first',
        icon: '❓',
        title: 'Quizzeur',
        description: 'Termine ton premier quiz.',
        category: 'games',
        rarity: 'common',
        xpReward: 50,
        check: (state) => {
            const jsGames = state.js?.games?.quiz;
            const pyGames = state.python?.games?.quiz;
            return (jsGames?.gamesPlayed > 0) || (pyGames?.gamesPlayed > 0);
        }
    },
    {
        id: 'quiz-perfect',
        icon: '💯',
        title: 'Score Parfait',
        description: 'Obtiens 100% à un quiz.',
        category: 'games',
        rarity: 'uncommon',
        xpReward: 200,
        check: (state) => {
            const jsQuiz = state.js?.games?.quiz;
            const pyQuiz = state.python?.games?.quiz;
            return (jsQuiz?.bestScore === 100) || (pyQuiz?.bestScore === 100);
        }
    },
    {
        id: 'bug-hunter',
        icon: '🐛',
        title: 'Chasseur de Bugs',
        description: 'Trouve 10 bugs au total.',
        category: 'games',
        rarity: 'uncommon',
        xpReward: 200,
        check: (state) => {
            const jsFixed = state.js?.games?.bugfix?.bugsFixed || 0;
            const pyFixed = state.python?.games?.bugfix?.bugsFixed || 0;
            return (jsFixed + pyFixed) >= 10;
        }
    },
    {
        id: 'speed-demon',
        icon: '⌨️',
        title: 'Doigts de Feu',
        description: 'Atteins 40 mots par minute au jeu de frappe.',
        category: 'games',
        rarity: 'uncommon',
        xpReward: 200,
        check: (state) => {
            const jsWpm = state.js?.games?.typing?.bestWpm || 0;
            const pyWpm = state.python?.games?.typing?.bestWpm || 0;
            return Math.max(jsWpm, pyWpm) >= 40;
        }
    },
    {
        id: 'speed-master',
        icon: '🚀',
        title: 'Vitesse Lumière',
        description: 'Atteins 70 mots par minute au jeu de frappe.',
        category: 'games',
        rarity: 'rare',
        xpReward: 400,
        check: (state) => {
            const jsWpm = state.js?.games?.typing?.bestWpm || 0;
            const pyWpm = state.python?.games?.typing?.bestWpm || 0;
            return Math.max(jsWpm, pyWpm) >= 70;
        }
    },
    {
        id: 'memory-master',
        icon: '🧠',
        title: 'Mémoire d\'Éléphant',
        description: 'Termine 5 parties de Memory.',
        category: 'games',
        rarity: 'uncommon',
        xpReward: 200,
        check: (state) => {
            const jsPlayed = state.js?.games?.memory?.gamesPlayed || 0;
            const pyPlayed = state.python?.games?.memory?.gamesPlayed || 0;
            return (jsPlayed + pyPlayed) >= 5;
        }
    },
    {
        id: 'completion-ace',
        icon: '✏️',
        title: 'Compléteur',
        description: 'Réussis 10 défis de complétion de code.',
        category: 'games',
        rarity: 'uncommon',
        xpReward: 200,
        check: (state) => {
            const jsCompleted = state.js?.games?.completion?.completed || 0;
            const pyCompleted = state.python?.games?.completion?.completed || 0;
            return (jsCompleted + pyCompleted) >= 10;
        }
    },
    {
        id: 'all-rounder',
        icon: '🎯',
        title: 'Touche-à-Tout',
        description: 'Joue à tous les mini-jeux au moins une fois.',
        category: 'games',
        rarity: 'rare',
        xpReward: 300,
        check: (state) => {
            const gameTypes = ['quiz', 'bugfix', 'typing', 'memory', 'completion'];
            return gameTypes.every(type => {
                const jsPlayed = state.js?.games?.[type]?.gamesPlayed || 0;
                const pyPlayed = state.python?.games?.[type]?.gamesPlayed || 0;
                return (jsPlayed + pyPlayed) > 0;
            });
        }
    },

    // ===== XP & LEVEL ACHIEVEMENTS =====
    {
        id: 'xp-100',
        icon: '⭐',
        title: 'Première Étoile',
        description: 'Accumule 100 XP.',
        category: 'xp',
        rarity: 'common',
        xpReward: 25,
        check: (state) => (state.user?.xp || 0) >= 100
    },
    {
        id: 'xp-500',
        icon: '🌟',
        title: 'Étoile Montante',
        description: 'Accumule 500 XP.',
        category: 'xp',
        rarity: 'uncommon',
        xpReward: 50,
        check: (state) => (state.user?.xp || 0) >= 500
    },
    {
        id: 'xp-2000',
        icon: '💎',
        title: 'Diamant',
        description: 'Accumule 2000 XP.',
        category: 'xp',
        rarity: 'rare',
        xpReward: 100,
        check: (state) => (state.user?.xp || 0) >= 2000
    },
    {
        id: 'xp-5000',
        icon: '🏆',
        title: 'Légende',
        description: 'Accumule 5000 XP.',
        category: 'xp',
        rarity: 'legendary',
        xpReward: 250,
        check: (state) => (state.user?.xp || 0) >= 5000
    },
    {
        id: 'level-5',
        icon: '📈',
        title: 'Niveau 5',
        description: 'Atteins le niveau 5.',
        category: 'xp',
        rarity: 'common',
        xpReward: 50,
        check: (state) => (state.user?.level || 1) >= 5
    },
    {
        id: 'level-10',
        icon: '🔥',
        title: 'Niveau 10',
        description: 'Atteins le niveau 10.',
        category: 'xp',
        rarity: 'uncommon',
        xpReward: 100,
        check: (state) => (state.user?.level || 1) >= 10
    },

    // ===== STREAK & DEDICATION ACHIEVEMENTS =====
    {
        id: 'streak-3',
        icon: '🔥',
        title: 'Régulier',
        description: '3 jours de suite d\'apprentissage.',
        category: 'dedication',
        rarity: 'common',
        xpReward: 75,
        check: (state) => (state.user?.streak || 0) >= 3
    },
    {
        id: 'streak-7',
        icon: '🔥🔥',
        title: 'Semaine Parfaite',
        description: '7 jours de suite d\'apprentissage.',
        category: 'dedication',
        rarity: 'uncommon',
        xpReward: 200,
        check: (state) => (state.user?.streak || 0) >= 7
    },
    {
        id: 'streak-30',
        icon: '🔥🔥🔥',
        title: 'Mois de Feu',
        description: '30 jours de suite d\'apprentissage.',
        category: 'dedication',
        rarity: 'legendary',
        xpReward: 1000,
        check: (state) => (state.user?.streak || 0) >= 30
    },
    {
        id: 'night-owl',
        icon: '🦉',
        title: 'Oiseau de Nuit',
        description: 'Code après minuit.',
        category: 'dedication',
        rarity: 'uncommon',
        xpReward: 50,
        check: () => {
            const hour = new Date().getHours();
            return hour >= 0 && hour < 5;
        }
    },
    {
        id: 'early-bird',
        icon: '🐦',
        title: 'Lève-Tôt',
        description: 'Code avant 7h du matin.',
        category: 'dedication',
        rarity: 'uncommon',
        xpReward: 50,
        check: () => {
            const hour = new Date().getHours();
            return hour >= 5 && hour < 7;
        }
    }
];

// Rarity color mapping
const RARITY_COLORS = {
    common: '#9e9e9e',
    uncommon: '#4caf50',
    rare: '#2196f3',
    legendary: '#ff9800'
};

const RARITY_LABELS = {
    common: 'Commun',
    uncommon: 'Peu commun',
    rare: 'Rare',
    legendary: 'Légendaire'
};

export const achievementsData = ACHIEVEMENTS;

export function getAllAchievements() {
    return ACHIEVEMENTS;
}

export function getAchievementsByCategory(category) {
    return ACHIEVEMENTS.filter(a => a.category === category);
}

export function getAchievementById(id) {
    return ACHIEVEMENTS.find(a => a.id === id);
}

export function getRarityColor(rarity) {
    return RARITY_COLORS[rarity] || RARITY_COLORS.common;
}

export function getRarityLabel(rarity) {
    return RARITY_LABELS[rarity] || 'Commun';
}

export function checkAchievements(state) {
    const unlocked = state.achievements || [];
    const newlyUnlocked = [];

    for (const achievement of ACHIEVEMENTS) {
        if (unlocked.includes(achievement.id)) continue;
        try {
            if (achievement.check(state)) {
                newlyUnlocked.push(achievement);
            }
        } catch (e) {
            // Silently skip achievements that fail to check
        }
    }

    return newlyUnlocked;
}

export function getUnlockedAchievements(unlockedIds) {
    return ACHIEVEMENTS.filter(a => (unlockedIds || []).includes(a.id));
}

export function getLockedAchievements(unlockedIds) {
    return ACHIEVEMENTS.filter(a => !(unlockedIds || []).includes(a.id));
}

export function getAchievementProgress(unlockedIds) {
    const total = ACHIEVEMENTS.length;
    const unlocked = (unlockedIds || []).length;
    return {
        unlocked,
        total,
        percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0
    };
}
