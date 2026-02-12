import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: process.env.DOTENV_PATH || '.env.server' })

const {
  DATABASE_URL,
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'code_master',
  PORT = '3001',
  CORS_ORIGIN,
  GROQ_API_KEY,
} = process.env

const pool = DATABASE_URL
  ? mysql.createPool({ uri: DATABASE_URL, waitForConnections: true, connectionLimit: 10, ssl: { rejectUnauthorized: true } })
  : mysql.createPool({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    })

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      device_id VARCHAR(64) PRIMARY KEY,
      data JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(64) NOT NULL,
      lang VARCHAR(32) NULL,
      content_key VARCHAR(64) NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_content (type, lang, content_key)
    )
  `)
}

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(cors(CORS_ORIGIN ? { origin: CORS_ORIGIN } : undefined))

// Serve frontend build in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// ── Health ───────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, error: 'db_unreachable' })
  }
})

// ── Profile CRUD ─────────────────────────────────────────────────────
app.get('/api/profile/:deviceId', async (req, res) => {
  const { deviceId } = req.params
  if (!deviceId) return res.status(400).json({ error: 'device_id_required' })

  try {
    const [rows] = await pool.query(
      'SELECT data, updated_at FROM user_profiles WHERE device_id = ? LIMIT 1',
      [deviceId]
    )
    if (!rows.length) return res.status(404).json({ data: null })

    const row = rows[0]
    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    res.json({ data, updatedAt: row.updated_at })
  } catch (error) {
    console.error('Load profile failed:', error)
    res.status(500).json({ error: 'load_failed' })
  }
})

app.put('/api/profile/:deviceId', async (req, res) => {
  const { deviceId } = req.params
  const data = req.body?.data
  if (!deviceId) return res.status(400).json({ error: 'device_id_required' })
  if (!data) return res.status(400).json({ error: 'data_required' })

  try {
    const payload = JSON.stringify(data)
    await pool.query(
      `INSERT INTO user_profiles (device_id, data)
       VALUES (?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
      [deviceId, payload]
    )
    res.json({ ok: true })
  } catch (error) {
    console.error('Save profile failed:', error)
    res.status(500).json({ error: 'save_failed' })
  }
})

// ── Content CRUD ─────────────────────────────────────────────────────
app.get('/api/content', async (req, res) => {
  const { type, lang, key } = req.query
  if (!type) return res.status(400).json({ error: 'type_required' })

  try {
    const [rows] = await pool.query(
      `SELECT data FROM content_items
       WHERE type = ? AND (lang <=> ?) AND (content_key <=> ?)
       LIMIT 1`,
      [type, lang || null, key || 'default']
    )
    if (!rows.length) return res.status(404).json({ data: null })
    const row = rows[0]
    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    res.json({ data })
  } catch (error) {
    console.error('Load content failed:', error)
    res.status(500).json({ error: 'content_load_failed' })
  }
})

// ── Languages list ──────────────────────────────────────────────────
app.get('/api/languages', async (_req, res) => {
  try {
    // Get the registered languages list
    const [rows] = await pool.query(
      'SELECT data FROM content_items WHERE type = ? AND lang IS NULL AND content_key = ? LIMIT 1',
      ['languages', 'default']
    )
    let languages = []
    if (rows.length) {
      const row = rows[0]
      languages = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }
    languages = ensureDefaultLanguages(languages)

    // Detect orphan languages that have content but aren't in the list
    const [orphans] = await pool.query(
      'SELECT DISTINCT lang FROM content_items WHERE lang IS NOT NULL'
    )
    const knownIds = new Set(languages.map(l => l.id))
    for (const { lang } of orphans) {
      if (!knownIds.has(lang)) {
        languages.push({ id: lang, name: lang.charAt(0).toUpperCase() + lang.slice(1), icon: '📦' })
        knownIds.add(lang)
      }
    }

    res.json({ data: languages })
  } catch (error) {
    console.error('Load languages failed:', error)
    res.status(500).json({ error: 'languages_load_failed' })
  }
})

app.get('/api/content/all', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT type, lang, content_key, data FROM content_items'
    )
    const payload = {}
    for (const row of rows) {
      const type = row.type
      const lang = row.lang
      const key = row.content_key || 'default'
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data

      if (!payload[type]) payload[type] = {}
      if (lang) {
        if (!payload[type][lang]) payload[type][lang] = {}
        payload[type][lang][key] = data
      } else {
        payload[type][key] = data
      }
    }

    res.json({ data: payload })
  } catch (error) {
    console.error('Load all content failed:', error)
    res.status(500).json({ error: 'content_load_failed' })
  }
})

// ── Helpers ──────────────────────────────────────────────────────────
function slugify(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function ensureDefaultLanguages(list) {
  const defaults = [
    { id: 'js', name: 'JavaScript', icon: '⚡' },
    { id: 'python', name: 'Python', icon: '🐍' },
  ]
  const result = Array.isArray(list) ? [...list] : []
  const ids = new Set(result.map(l => l.id))
  for (const d of defaults) {
    if (!ids.has(d.id)) {
      result.push(d)
      ids.add(d.id)
    }
  }
  return result
}

async function upsertContent(type, lang, key, data) {
  const payload = JSON.stringify(data)
  const k = key || 'default'
  if (lang == null) {
    // NULL breaks UNIQUE constraint (NULL != NULL), so DELETE + INSERT
    await pool.query(
      'DELETE FROM content_items WHERE type = ? AND lang IS NULL AND content_key = ?',
      [type, k]
    )
    await pool.query(
      'INSERT INTO content_items (type, lang, content_key, data) VALUES (?, NULL, ?, CAST(? AS JSON))',
      [type, k, payload]
    )
  } else {
    await pool.query(
      `INSERT INTO content_items (type, lang, content_key, data)
       VALUES (?, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
      [type, lang, k, payload]
    )
  }
}

function cleanJson(raw) {
  let s = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  // Extract outermost { } or [ ]
  const firstCurly = s.indexOf('{')
  const firstBracket = s.indexOf('[')
  let start, end, open, close
  if (firstBracket >= 0 && (firstCurly < 0 || firstBracket < firstCurly)) {
    open = '['; close = ']'
    start = firstBracket
    end = s.lastIndexOf(']')
  } else if (firstCurly >= 0) {
    open = '{'; close = '}'
    start = firstCurly
    end = s.lastIndexOf(close)
  } else {
    return s
  }

  if (start >= 0 && end > start) {
    s = s.slice(start, end + 1)
  }

  // Fix trailing commas before } or ]
  s = s.replace(/,\s*([\]}])/g, '$1')
  // Fix unescaped newlines inside strings (common LLM mistake)
  s = s.replace(/(?<=": "(?:[^"\\]|\\.)*)(?:\r?\n)(?=[^"]*")/g, '\\n')

  return s
}

async function callGroq(systemPrompt, userPrompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      if (attempt < retries) { await new Promise(r => setTimeout(r, 1000)); continue }
      throw new Error(`Groq API error: ${errText.slice(0, 300)}`)
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content || ''
    const cleaned = cleanJson(content)

    try {
      return JSON.parse(cleaned)
    } catch (parseErr) {
      console.error(`JSON parse failed (attempt ${attempt + 1}):`, parseErr.message)
      if (attempt < retries) continue
      throw new Error(`Invalid JSON from Groq after ${retries + 1} attempts`)
    }
  }
}

// ── Language Generation (SSE streaming) ──────────────────────────────
const SYSTEM = 'Tu es un expert pédagogue en programmation. Tu réponds UNIQUEMENT en JSON valide, sans texte avant ni après. Pas de commentaires dans le JSON.'

// 8 levels matching the built-in JS/Python curricula
const LEVEL_PLAN = [
  { id: 1, slug: 'les-bases',    title: 'Les Bases',               topic: 'syntaxe de base, affichage, variables, types de données',     icon: '🟢', color: '#00ff88', requiredXP: 0,    lessons: 5 },
  { id: 2, slug: 'conditions',   title: 'Conditions',              topic: 'opérateurs de comparaison, if/else, opérateurs logiques',     icon: '🔀', color: '#00ccff', requiredXP: 300,  lessons: 4 },
  { id: 3, slug: 'boucles',      title: 'Boucles',                 topic: 'boucles for, while, itération, break/continue',               icon: '🔄', color: '#ff6b9d', requiredXP: 700,  lessons: 4 },
  { id: 4, slug: 'fonctions',    title: 'Fonctions',               topic: 'déclaration, paramètres, retour, portée des variables',       icon: '⚙️', color: '#ffd93d', requiredXP: 1200, lessons: 5 },
  { id: 5, slug: 'structures',   title: 'Structures de données',   topic: 'tableaux/listes, dictionnaires/objets, manipulation',         icon: '📋', color: '#c084fc', requiredXP: 1800, lessons: 5 },
  { id: 6, slug: 'avance',       title: 'Concepts avancés',        topic: 'gestion erreurs, modules, concepts avancés du langage',       icon: '🚀', color: '#ff8c42', requiredXP: 2500, lessons: 4 },
  { id: 7, slug: 'poo',          title: 'POO & Patterns',          topic: 'classes, objets, héritage, méthodes spéciales',               icon: '🏗️', color: '#06d6a0', requiredXP: 3300, lessons: 4 },
  { id: 8, slug: 'projets',      title: 'Projets Pratiques',       topic: 'mini-projets combinant toutes les notions apprises',          icon: '🎯', color: '#ffd166', requiredXP: 4200, lessons: 3 },
]

function levelPrompt(language, langId, level) {
  return `Génère le **niveau ${level.id}** du curriculum pour apprendre **${language}**.
Thème du niveau : "${level.title}" — ${level.topic}

Retourne un JSON avec cette structure exacte :
{
  "lessons": [
    {
      "id": "${langId}-l${level.id}-01",
      "title": "Titre de la leçon",
      "theory": "<h2>Titre</h2><p>Explication détaillée avec des exemples concrets, des analogies et au moins 3-4 paragraphes bien structurés.</p><h3>Sous-titre</h3><p>Autre explication.</p><pre><code>exemple de code en ${language}</code></pre><div class='tip'><strong>💡 Astuce :</strong> conseil pratique.</div>",
      "exercise": {
        "instruction": "Consigne claire en HTML avec <strong>mots clés</strong>",
        "starterCode": "code de départ en ${language}\\n",
        "validation": { "type": "output", "expected": "résultat attendu exact" },
        "hints": ["indice 1", "indice 2"],
        "xpReward": 50
      }
    }
  ]
}

Contraintes STRICTES :
- Exactement ${level.lessons} leçons
- IDs : ${langId}-l${level.id}-01, ${langId}-l${level.id}-02, etc.
- Les theories doivent être DÉTAILLÉES avec : h2, h3, p, pre>code, ul/li, div.tip
- Chaque theory doit faire au moins 150 mots avec des explications claires en français
- Les exercices utilisent la syntaxe correcte de ${language}
- validation.type est toujours "output" et expected est le résultat exact affiché
- Le starterCode doit contenir des commentaires guidant l'élève
- La dernière leçon du niveau doit être un récapitulatif (xpReward: 75)
- Les exercices doivent progresser en difficulté au sein du niveau`
}

function langInfoPrompt(language, langId) {
  return `Retourne UNIQUEMENT un JSON avec les informations de ce langage :
{ "id": "${langId}", "name": "${language}", "icon": "<un seul emoji pertinent pour ${language}>" }
Exemples: Rust → 🦀, Go → 🐹, C++ → ⚡, Java → ☕, PHP → 🐘, Ruby → 💎, Swift → 🍎, Kotlin → 🟣, TypeScript → 🔷, SQL → 🗄️`
}

function quizPrompt(language, langId) {
  return `Génère du contenu de quiz et de jeux pour apprendre **${language}**.
Retourne un JSON avec cette structure exacte :
{
  "quiz_questions": [
    { "id": "q-${langId}-01", "category": "bases", "difficulty": 1, "question": "Question sur ${language} ?", "choices": ["a", "b", "c", "d"], "correct": 0, "explanation": "Explication" }
  ],
  "typing_words": {
    "keywords": ["mot1", "mot2"],
    "expressions": ["expression1", "expression2"],
    "statements": ["statement1"]
  },
  "memory_pairs": [
    { "id": "mp-${langId}-01", "category": "bases", "difficulty": 1, "pairs": [{ "term": "concept", "match": "définition" }, { "term": "concept2", "match": "définition2" }] }
  ]
}

Contraintes :
- 20 quiz_questions (difficulty 1 à 3, catégories variées : bases, conditions, boucles, fonctions, structures, avance)
- typing_words : 25 keywords, 20 expressions, 10 statements — tous en syntaxe ${language}
- 6 memory_pairs avec 6 paires chacun
- Les questions doivent être spécifiques à ${language}, pas génériques`
}

function snippetsPrompt(language, langId) {
  return `Génère des exercices de débogage et complétion pour **${language}**.
Retourne un JSON avec cette structure exacte :
{
  "bug_snippets": [
    { "id": "bug-${langId}-01", "difficulty": 1, "category": "bases", "title": "Titre du bug", "buggyCode": "code avec bug", "fixedCode": "code corrigé", "hint": "Indice", "bugLine": 1, "explanation": "Explication du bug" }
  ],
  "completion_challenges": [
    { "id": "cc-${langId}-01", "difficulty": 1, "category": "bases", "title": "Titre", "description": "Description", "template": "code avec ___BLANK___ blancs", "blanks": ["mot1", "mot2"], "hints": ["indice"], "xpReward": 20 }
  ]
}

Contraintes :
- 10 bug_snippets (difficulty 1 à 3) — vrais bugs réalistes en ${language}
- 10 completion_challenges (difficulty 1 à 3) — compléter du code ${language}
- Les codes doivent être syntaxiquement corrects pour ${language}`
}

app.get('/api/content/generate-language', async (req, res) => {
  const language = req.query.language
  if (!language) return res.status(400).end('language_required')
  if (!GROQ_API_KEY) return res.status(500).end('groq_key_missing')

  const langId = slugify(language)
  if (!langId) return res.status(400).end('invalid_language')

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)
  const totalSteps = LEVEL_PLAN.length + 2 // levels + quiz + snippets

  try {
    // Step 0: Get language info (icon)
    send({ step: 0, total: totalSteps, label: `Préparation de ${language}...` })
    const langInfo = await callGroq(SYSTEM, langInfoPrompt(language, langId))
    const languageEntry = { id: langId, name: language, icon: langInfo?.icon || '📦' }
    send({ step: 0, total: totalSteps, label: `${languageEntry.icon} ${language}`, done: true })

    // Steps 1-8: Generate each curriculum level
    const curriculum = []
    for (const level of LEVEL_PLAN) {
      send({ step: level.id, total: totalSteps, label: `Niveau ${level.id}: ${level.title} (${level.lessons} leçons)...` })
      const data = await callGroq(SYSTEM, levelPrompt(language, langId, level))
      const lessons = data?.lessons || []
      curriculum.push({
        id: level.id,
        slug: level.slug,
        title: level.title,
        subtitle: level.topic,
        icon: level.icon,
        color: level.color,
        requiredXP: level.requiredXP,
        lessons,
      })
      send({ step: level.id, total: totalSteps, label: `Niveau ${level.id}: ${level.title} — ${lessons.length} leçons ✓`, done: true })
    }

    // Step 9: Quiz + Typing + Memory
    const quizStep = LEVEL_PLAN.length + 1
    send({ step: quizStep, total: totalSteps, label: 'Quiz, typing et memory...' })
    const quizData = await callGroq(SYSTEM, quizPrompt(language, langId))
    send({ step: quizStep, total: totalSteps, label: 'Quiz et jeux générés ✓', done: true })

    // Step 10: Bug snippets + Completion
    const snippetStep = LEVEL_PLAN.length + 2
    send({ step: snippetStep, total: totalSteps, label: 'Exercices de débogage...' })
    const snippetsData = await callGroq(SYSTEM, snippetsPrompt(language, langId))
    send({ step: snippetStep, total: totalSteps, label: 'Exercices générés ✓', done: true })

    // Save everything to DB
    send({ step: 'save', label: 'Sauvegarde en base de données...' })

    const [currentLangs] = await pool.query(
      'SELECT data FROM content_items WHERE type = ? AND lang IS NULL AND content_key = ? LIMIT 1',
      ['languages', 'default']
    )
    let languages = []
    if (currentLangs.length) {
      const row = currentLangs[0]
      languages = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }
    languages = ensureDefaultLanguages(languages)
    if (!languages.find(l => l.id === languageEntry.id)) languages.push(languageEntry)

    const totalLessons = curriculum.reduce((sum, lvl) => sum + lvl.lessons.length, 0)

    await upsertContent('languages', null, 'default', languages)
    await upsertContent('curriculum', langId, 'default', curriculum)
    await upsertContent('quiz_questions', langId, 'default', quizData.quiz_questions || [])
    await upsertContent('typing_words', langId, 'default', quizData.typing_words || { keywords: [], expressions: [], statements: [] })
    await upsertContent('memory_pairs', langId, 'default', quizData.memory_pairs || [])
    await upsertContent('bug_snippets', langId, 'default', snippetsData.bug_snippets || [])
    await upsertContent('completion_challenges', langId, 'default', snippetsData.completion_challenges || [])

    send({ step: 'complete', language: languageEntry, stats: { levels: curriculum.length, lessons: totalLessons } })
    res.end()
  } catch (error) {
    console.error('Generate language failed:', error)
    send({ step: 'error', message: error.message || 'generation_failed' })
    res.end()
  }
})

// ── Export a language ─────────────────────────────────────────────────
app.get('/api/content/export/:langId', async (req, res) => {
  const { langId } = req.params
  if (!langId) return res.status(400).json({ error: 'lang_id_required' })

  try {
    const [rows] = await pool.query(
      'SELECT type, data FROM content_items WHERE lang = ?',
      [langId]
    )
    if (!rows.length) return res.status(404).json({ error: 'language_not_found' })

    // Find language info from the languages list
    const [langRows] = await pool.query(
      'SELECT data FROM content_items WHERE type = ? AND lang IS NULL AND content_key = ? LIMIT 1',
      ['languages', 'default']
    )
    let langInfo = { id: langId, name: langId, icon: '📦' }
    if (langRows.length) {
      const list = typeof langRows[0].data === 'string' ? JSON.parse(langRows[0].data) : langRows[0].data
      const found = (Array.isArray(list) ? list : []).find(l => l.id === langId)
      if (found) langInfo = found
    }

    const content = {}
    for (const row of rows) {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      content[row.type] = data
    }

    const exportData = { version: 1, language: langInfo, content }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="codemaster-${langId}.json"`)
    res.json(exportData)
  } catch (error) {
    console.error('Export language failed:', error)
    res.status(500).json({ error: 'export_failed' })
  }
})

// ── Import a language ────────────────────────────────────────────────
app.post('/api/content/import', async (req, res) => {
  const data = req.body
  if (!data || !data.language || !data.content) {
    return res.status(400).json({ error: 'invalid_format' })
  }

  const langId = slugify(data.language.id || data.language.name)
  if (!langId) return res.status(400).json({ error: 'invalid_language_id' })

  const langEntry = {
    id: langId,
    name: data.language.name || langId,
    icon: data.language.icon || '📦',
  }

  const contentTypes = ['curriculum', 'quiz_questions', 'typing_words', 'memory_pairs', 'bug_snippets', 'completion_challenges']

  try {
    for (const type of contentTypes) {
      if (data.content[type]) {
        await upsertContent(type, langId, 'default', data.content[type])
      }
    }

    // Add to languages list
    const [currentLangs] = await pool.query(
      'SELECT data FROM content_items WHERE type = ? AND lang IS NULL AND content_key = ? LIMIT 1',
      ['languages', 'default']
    )
    let languages = []
    if (currentLangs.length) {
      const row = currentLangs[0]
      languages = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }
    languages = ensureDefaultLanguages(languages)
    const existingIdx = languages.findIndex(l => l.id === langEntry.id)
    if (existingIdx >= 0) {
      languages[existingIdx] = langEntry
    } else {
      languages.push(langEntry)
    }
    await upsertContent('languages', null, 'default', languages)

    res.json({ ok: true, language: langEntry })
  } catch (error) {
    console.error('Import language failed:', error)
    res.status(500).json({ error: 'import_failed' })
  }
})

// ── Generate advanced levels for a completed language ─────────────────
const ADVANCED_LEVEL_PLAN = [
  { slug: 'design-patterns',  title: 'Design Patterns & Architecture',  topic: 'patterns de conception (singleton, factory, observer, strategy, MVC), principes SOLID, architecture logicielle', icon: '🏛️', color: '#8b5cf6', lessons: 4 },
  { slug: 'performance',      title: 'Performance & Optimisation',      topic: 'profiling, complexité algorithmique, optimisation mémoire, caching, lazy loading, bonnes pratiques de performance', icon: '⚡', color: '#f59e0b', lessons: 4 },
  { slug: 'testing',          title: 'Tests & Qualité de code',         topic: 'tests unitaires, tests d\'intégration, TDD, mocking, couverture de code, linting, documentation', icon: '🧪', color: '#10b981', lessons: 4 },
  { slug: 'projet-pro',       title: 'Projet Professionnel',            topic: 'projet complet combinant patterns, performance et tests — niveau production, gestion d\'erreurs avancée, API, déploiement', icon: '💼', color: '#ec4899', lessons: 3 },
]

app.get('/api/content/generate-advanced/:langId', async (req, res) => {
  const { langId } = req.params
  if (!langId) return res.status(400).end('lang_id_required')
  if (!GROQ_API_KEY) return res.status(500).end('groq_key_missing')

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    // Load existing curriculum
    const [currRows] = await pool.query(
      'SELECT data FROM content_items WHERE type = ? AND lang = ? AND content_key = ? LIMIT 1',
      ['curriculum', langId, 'default']
    )
    let existingCurriculum = []
    if (currRows.length) {
      existingCurriculum = typeof currRows[0].data === 'string' ? JSON.parse(currRows[0].data) : currRows[0].data
    }
    const lastLevelId = existingCurriculum.reduce((max, lv) => Math.max(max, lv.id || 0), 0)
    const lastXP = existingCurriculum.reduce((max, lv) => Math.max(max, lv.requiredXP || 0), 0)

    // Find language name
    const [langRows] = await pool.query(
      'SELECT data FROM content_items WHERE type = ? AND lang IS NULL AND content_key = ? LIMIT 1',
      ['languages', 'default']
    )
    let languageName = langId
    if (langRows.length) {
      const list = typeof langRows[0].data === 'string' ? JSON.parse(langRows[0].data) : langRows[0].data
      const found = (Array.isArray(list) ? list : []).find(l => l.id === langId)
      if (found) languageName = found.name
    }

    const totalSteps = ADVANCED_LEVEL_PLAN.length + 1
    const newLevels = []

    // Generate each advanced level
    for (let i = 0; i < ADVANCED_LEVEL_PLAN.length; i++) {
      const plan = ADVANCED_LEVEL_PLAN[i]
      const levelId = lastLevelId + i + 1
      const xp = lastXP + (i + 1) * 1000
      const level = { ...plan, id: levelId, requiredXP: xp, lessons: plan.lessons }

      send({ step: i + 1, total: totalSteps, label: `Niveau ${levelId}: ${plan.title} (${plan.lessons} lecons)...` })
      const data = await callGroq(SYSTEM, levelPrompt(languageName, langId, level))
      const lessons = data?.lessons || []
      newLevels.push({
        id: levelId,
        slug: plan.slug,
        title: plan.title,
        subtitle: plan.topic,
        icon: plan.icon,
        color: plan.color,
        requiredXP: xp,
        lessons,
      })
      send({ step: i + 1, total: totalSteps, label: `Niveau ${levelId}: ${plan.title} — ${lessons.length} lecons ✓`, done: true })
    }

    // Generate advanced quiz questions
    const quizStep = ADVANCED_LEVEL_PLAN.length + 1
    send({ step: quizStep, total: totalSteps, label: 'Quiz avancés...' })
    const quizData = await callGroq(SYSTEM, `Génère 15 questions de quiz AVANCÉES pour ${languageName} sur les thèmes: design patterns, performance, testing, architecture professionnelle.
Retourne un JSON: { "quiz_questions": [{ "id": "q-${langId}-adv-01", "category": "avance", "difficulty": 3, "question": "...", "choices": ["a","b","c","d"], "correct": 0, "explanation": "..." }] }
Contraintes: 15 questions, difficulty 2 à 3, spécifiques à ${languageName}.`)
    send({ step: quizStep, total: totalSteps, label: 'Quiz avancés ✓', done: true })

    // Save: append new levels to existing curriculum
    send({ step: 'save', label: 'Sauvegarde...' })
    const fullCurriculum = [...existingCurriculum, ...newLevels]
    await upsertContent('curriculum', langId, 'default', fullCurriculum)

    // Append advanced quiz questions to existing ones
    const [existingQuiz] = await pool.query(
      'SELECT data FROM content_items WHERE type = ? AND lang = ? AND content_key = ? LIMIT 1',
      ['quiz_questions', langId, 'default']
    )
    let allQuiz = []
    if (existingQuiz.length) {
      allQuiz = typeof existingQuiz[0].data === 'string' ? JSON.parse(existingQuiz[0].data) : existingQuiz[0].data
    }
    allQuiz = [...(Array.isArray(allQuiz) ? allQuiz : []), ...(quizData?.quiz_questions || [])]
    await upsertContent('quiz_questions', langId, 'default', allQuiz)

    const totalLessons = newLevels.reduce((sum, lv) => sum + lv.lessons.length, 0)
    send({ step: 'complete', stats: { levels: newLevels.length, lessons: totalLessons } })
    res.end()
  } catch (error) {
    console.error('Generate advanced failed:', error)
    send({ step: 'error', message: error.message || 'generation_failed' })
    res.end()
  }
})

// ── Delete a language and all its content ─────────────────────────────
app.delete('/api/content/language/:langId', async (req, res) => {
  const { langId } = req.params
  if (!langId) return res.status(400).json({ error: 'lang_id_required' })

  // Prevent deleting built-in languages
  const builtIn = ['js', 'python']
  if (builtIn.includes(langId)) {
    return res.status(403).json({ error: 'cannot_delete_builtin' })
  }

  try {
    // Remove all content for this language
    await pool.query('DELETE FROM content_items WHERE lang = ?', [langId])

    // Remove from languages list
    const [currentLangs] = await pool.query(
      'SELECT data FROM content_items WHERE type = ? AND lang IS NULL AND content_key = ? LIMIT 1',
      ['languages', 'default']
    )
    if (currentLangs.length) {
      const row = currentLangs[0]
      let languages = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      languages = (Array.isArray(languages) ? languages : []).filter(l => l.id !== langId)
      languages = ensureDefaultLanguages(languages)
      await upsertContent('languages', null, 'default', languages)
    }

    res.json({ ok: true })
  } catch (error) {
    console.error('Delete language failed:', error)
    res.status(500).json({ error: 'delete_failed' })
  }
})

// Keep the POST endpoint as a simple fallback
app.post('/api/content/generate-language', async (req, res) => {
  const { language } = req.body || {}
  if (!language) return res.status(400).json({ error: 'language_required' })
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'groq_key_missing' })

  const langId = slugify(language)
  if (!langId) return res.status(400).json({ error: 'invalid_language' })

  try {
    const langInfo = await callGroq(SYSTEM, langInfoPrompt(language, langId))
    const languageEntry = { id: langId, name: language, icon: langInfo?.icon || '📦' }

    const curriculum = []
    for (const level of LEVEL_PLAN) {
      const data = await callGroq(SYSTEM, levelPrompt(language, langId, level))
      curriculum.push({
        id: level.id, slug: level.slug, title: level.title, subtitle: level.topic,
        icon: level.icon, color: level.color, requiredXP: level.requiredXP,
        lessons: data?.lessons || [],
      })
    }

    const quizData = await callGroq(SYSTEM, quizPrompt(language, langId))
    const snippetsData = await callGroq(SYSTEM, snippetsPrompt(language, langId))

    const [currentLangs] = await pool.query(
      'SELECT data FROM content_items WHERE type = ? AND lang IS NULL AND content_key = ? LIMIT 1',
      ['languages', 'default']
    )
    let languages = []
    if (currentLangs.length) {
      const row = currentLangs[0]
      languages = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }
    languages = ensureDefaultLanguages(languages)
    if (!languages.find(l => l.id === languageEntry.id)) languages.push(languageEntry)

    await upsertContent('languages', null, 'default', languages)
    await upsertContent('curriculum', langId, 'default', curriculum)
    await upsertContent('quiz_questions', langId, 'default', quizData.quiz_questions || [])
    await upsertContent('typing_words', langId, 'default', quizData.typing_words || { keywords: [], expressions: [], statements: [] })
    await upsertContent('memory_pairs', langId, 'default', quizData.memory_pairs || [])
    await upsertContent('bug_snippets', langId, 'default', snippetsData.bug_snippets || [])
    await upsertContent('completion_challenges', langId, 'default', snippetsData.completion_challenges || [])

    res.json({ ok: true, language: languageEntry })
  } catch (error) {
    console.error('Generate language failed:', error)
    res.status(500).json({ error: 'generate_failed', details: error.message })
  }
})

// SPA fallback — must be AFTER all /api routes
app.get('{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const port = Number(PORT)
ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Profile API listening on ${port}`)
    })
  })
  .catch((error) => {
    console.error('Schema init failed:', error)
    process.exit(1)
  })
