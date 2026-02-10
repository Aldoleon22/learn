// Question Generator - Appelle Groq (GRATUIT, ultra rapide) pour générer des questions uniques
// Fallback sur les questions statiques si l'API n'est pas configurée
// Clé gratuite sur: https://console.groq.com/keys

import { addToCache, drawFromCache } from './questionCache.js'

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile' // Gratuit, rapide, bon en JSON

/**
 * Vérifie si l'API Groq est configurée
 */
export function isGeneratorAvailable() {
  return API_KEY.length > 0
}

/**
 * Génère des questions quiz et les stocke dans le cache
 */
export async function generateQuizQuestions(lang, count = 5, options = {}) {
  if (!isGeneratorAvailable()) return []

  const langName = lang === 'python' ? 'Python' : 'JavaScript'
  const diffText = options.difficulty
    ? `de difficulté ${options.difficulty}/3`
    : 'de difficulté variée (1 à 3)'
  const catText = options.categories?.length
    ? `sur les catégories: ${options.categories.join(', ')}`
    : ''

  const prompt = `Génère exactement ${count} questions quiz sur ${langName} ${diffText} ${catText}.

Chaque question doit être en FRANÇAIS et suivre ce format JSON exact:
{
  "question": "La question en français",
  "choices": ["choix A", "choix B", "choix C", "choix D"],
  "correct": 0,
  "explanation": "Explication courte en français",
  "category": "bases|conditions|fonctions|tableaux|objets|async|dom",
  "difficulty": 1
}

Règles:
- 4 choix par question, "correct" est l'index (0-3) de la bonne réponse
- Les questions doivent être pratiques et concrètes sur le code
- Varie les catégories: bases, conditions, fonctions, tableaux/listes, objets/dictionnaires
- difficulty: 1=débutant, 2=intermédiaire, 3=avancé
- Les explications doivent être éducatives et courtes (1-2 phrases)
- Ne répète PAS ces questions: ${JSON.stringify(options.avoid || [])}

Réponds UNIQUEMENT avec un tableau JSON, rien d'autre.`

  const questions = await callGroq(prompt)
  if (questions && questions.length > 0) {
    addToCache('quiz', lang, questions)
  }
  return questions
}

/**
 * Génère des questions "Devine la sortie" et les stocke
 */
export async function generateOutputQuestions(lang, count = 5) {
  if (!isGeneratorAvailable()) return []

  const langName = lang === 'python' ? 'Python' : 'JavaScript'

  const prompt = `Génère exactement ${count} questions "Devine la sortie du code" en ${langName}.

Chaque question doit être en FRANÇAIS et suivre ce format JSON exact:
{
  "code": "le code source (1-3 lignes max)",
  "choices": ["sortie A", "sortie B", "sortie C", "sortie D"],
  "correct": 0,
  "explanation": "Explication en français de pourquoi cette sortie"
}

Règles:
- Le code doit utiliser console.log() (JS) ou print() (Python)
- 4 choix dont 1 correct, "correct" est l'index (0-3)
- Le code doit être court (1-3 lignes) mais avec un résultat non-trivial
- Couvre: coercion de types, opérateurs, méthodes de tableaux/listes, strings, etc.
- Les pièges subtils sont bienvenus (ex: typeof null, 0.1+0.2, etc.)

Réponds UNIQUEMENT avec un tableau JSON, rien d'autre.`

  const questions = await callGroq(prompt)
  if (questions && questions.length > 0) {
    addToCache('output', lang, questions)
  }
  return questions
}

/**
 * Génère des bug snippets et les stocke
 */
export async function generateBugSnippets(lang, count = 3) {
  if (!isGeneratorAvailable()) return []

  const langName = lang === 'python' ? 'Python' : 'JavaScript'

  const prompt = `Génère exactement ${count} exercices "Trouve le bug" en ${langName}.

Chaque exercice doit être en FRANÇAIS et suivre ce format JSON exact:
{
  "title": "Titre court du bug",
  "buggyCode": "le code avec le bug (2-5 lignes, \\n pour les sauts de ligne)",
  "fixedCode": "le code corrigé (même structure, \\n pour les sauts de ligne)",
  "hint": "Un indice en français",
  "explanation": "Explication du bug et de la correction",
  "category": "bases|conditions|fonctions|tableaux|objets|async",
  "difficulty": 1,
  "bugLine": 2
}

Règles:
- buggyCode contient exactement 1 bug subtil mais réel
- fixedCode est la version corrigée
- bugLine est le numéro de ligne (1-indexed) où se trouve le bug
- Les bugs doivent être réalistes: typos, off-by-one, mauvais opérateur, oubli d'await, etc.
- difficulty: 1=débutant, 2=intermédiaire, 3=avancé

Réponds UNIQUEMENT avec un tableau JSON, rien d'autre.`

  const questions = await callGroq(prompt)
  if (questions && questions.length > 0) {
    addToCache('bug', lang, questions)
  }
  return questions
}

/**
 * Génère un batch complet de questions (quiz + output + bug) en arrière-plan
 * Appelé après chaque fin de jeu
 */
export async function generateBatch(lang, options = {}) {
  if (!isGeneratorAvailable()) return { generated: false, reason: 'no_api_key' }

  try {
    // Groq supporte 30 req/min, on peut paralléliser
    const results = await Promise.allSettled([
      generateQuizQuestions(lang, 5, options),
      generateOutputQuestions(lang, 4),
      generateBugSnippets(lang, 3),
    ])

    const counts = {
      quiz: results[0].status === 'fulfilled' ? results[0].value?.length || 0 : 0,
      output: results[1].status === 'fulfilled' ? results[1].value?.length || 0 : 0,
      bug: results[2].status === 'fulfilled' ? results[2].value?.length || 0 : 0,
    }

    return { generated: true, counts }
  } catch (err) {
    console.warn('[QuestionGenerator] Batch generation failed:', err.message)
    return { generated: false, reason: err.message }
  }
}

/**
 * Tire des questions générées du cache (avec fallback)
 */
export function getGeneratedQuestions(type, lang, count) {
  return drawFromCache(type, lang, count)
}

// --- Internal: Groq API (compatible OpenAI) ---

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callGroq(prompt, retries = 1) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Tu es un générateur de questions éducatives pour une app d\'apprentissage de la programmation. Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    // Rate limit : attendre et réessayer
    if (res.status === 429 && retries > 0) {
      console.warn('[QuestionGenerator] Rate limited, retry dans 5s...')
      await delay(5000)
      return callGroq(prompt, retries - 1)
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn(`[QuestionGenerator] Groq error ${res.status}:`, err.error?.message || '')
      return []
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) return []

    // Parser le JSON
    let cleaned = content
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(cleaned)
    // Groq avec json_object peut wrapper dans un objet, extraire le tableau
    if (Array.isArray(parsed)) return parsed
    // Chercher un tableau dans les valeurs de l'objet
    const values = Object.values(parsed)
    const arr = values.find(v => Array.isArray(v))
    return arr || []
  } catch (err) {
    console.warn('[QuestionGenerator] Parse/fetch error:', err.message)
    return []
  }
}
