// Question Cache - Stockage localStorage avec anti-répétition
// Gère un réservoir de questions générées par l'IA

const CACHE_KEY = 'codemaster_generated_questions'
const USED_KEY = 'codemaster_used_questions'
const MAX_PER_TYPE = 50 // max questions stockées par type

function getCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

function setCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

function getUsedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(USED_KEY)) || [])
  } catch {
    return new Set()
  }
}

function setUsedSet(used) {
  localStorage.setItem(USED_KEY, JSON.stringify([...used]))
}

/**
 * Génère un hash simple pour une question (pour éviter les doublons)
 */
function hashQuestion(q) {
  const str = JSON.stringify(q)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return 'q_' + Math.abs(hash).toString(36)
}

/**
 * Ajoute des questions générées au cache
 * @param {string} type - 'quiz' | 'bug' | 'output'
 * @param {string} lang - 'js' | 'python'
 * @param {Array} questions - Les questions à stocker
 */
export function addToCache(type, lang, questions) {
  const cache = getCache()
  const key = `${type}_${lang}`
  if (!cache[key]) cache[key] = []

  for (const q of questions) {
    q._hash = hashQuestion(q)
    // Éviter les doublons dans le cache
    if (!cache[key].some(existing => existing._hash === q._hash)) {
      cache[key].push(q)
    }
  }

  // Limiter la taille
  if (cache[key].length > MAX_PER_TYPE) {
    cache[key] = cache[key].slice(-MAX_PER_TYPE)
  }

  setCache(cache)
}

/**
 * Tire N questions du cache sans répétition
 * @param {string} type - 'quiz' | 'bug' | 'output'
 * @param {string} lang - 'js' | 'python'
 * @param {number} count - Nombre de questions voulues
 * @returns {Array} Questions non-utilisées (peut être < count si pas assez en stock)
 */
export function drawFromCache(type, lang, count) {
  const cache = getCache()
  const key = `${type}_${lang}`
  const pool = cache[key] || []
  const used = getUsedSet()

  // Filtrer les questions déjà utilisées
  const available = pool.filter(q => !used.has(q._hash))

  // Si toutes utilisées, reset le set used pour ce type
  if (available.length === 0 && pool.length > 0) {
    const poolHashes = new Set(pool.map(q => q._hash))
    const newUsed = new Set([...used].filter(h => !poolHashes.has(h)))
    setUsedSet(newUsed)
    return drawFromCache(type, lang, count) // Retry après reset
  }

  // Shuffle et prendre count
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  const drawn = shuffled.slice(0, count)

  // Marquer comme utilisées
  for (const q of drawn) {
    used.add(q._hash)
  }
  setUsedSet(used)

  return drawn
}

/**
 * Retourne le nombre de questions disponibles (non-utilisées) par type
 */
export function getCacheStats() {
  const cache = getCache()
  const used = getUsedSet()
  const stats = {}

  for (const [key, questions] of Object.entries(cache)) {
    const available = questions.filter(q => !used.has(q._hash))
    stats[key] = { total: questions.length, available: available.length }
  }

  return stats
}

/**
 * Vide tout le cache
 */
export function clearCache() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(USED_KEY)
}
