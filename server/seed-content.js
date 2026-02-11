import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { jsCurriculum, pythonCurriculum } from '../src/data/curriculum.js'
import { getQuizQuestions } from '../src/data/quiz-questions.js'
import { getTypingWords } from '../src/data/typing-words.js'
import { getMemoryPairs } from '../src/data/memory-pairs.js'
import { getBugSnippets } from '../src/data/bug-snippets.js'
import { getCompletionChallenges } from '../src/data/completion-challenges.js'
import { getAllAchievements } from '../src/data/achievements-data.js'

dotenv.config({ path: process.env.DOTENV_PATH || '.env.server' })

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'code_master',
} = process.env

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
})

async function ensureSchema() {
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

function stripAchievementChecks(items) {
  return items.map(({ check, ...rest }) => rest)
}

async function upsertContent({ type, lang = null, key = 'default', data }) {
  const payload = JSON.stringify(data)
  await pool.query(
    `INSERT INTO content_items (type, lang, content_key, data)
     VALUES (?, ?, ?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
    [type, lang, key, payload]
  )
}

async function run() {
  await ensureSchema()

  const items = [
    { type: 'languages', lang: null, key: 'default', data: [
      { id: 'js', name: 'JavaScript', icon: '⚡' },
      { id: 'python', name: 'Python', icon: '🐍' },
    ] },
    { type: 'curriculum', lang: 'js', data: jsCurriculum },
    { type: 'curriculum', lang: 'python', data: pythonCurriculum },
    { type: 'quiz_questions', lang: 'js', data: getQuizQuestions('js') },
    { type: 'quiz_questions', lang: 'python', data: getQuizQuestions('python') },
    { type: 'typing_words', lang: 'js', data: getTypingWords('js') },
    { type: 'typing_words', lang: 'python', data: getTypingWords('python') },
    { type: 'memory_pairs', lang: 'js', data: getMemoryPairs('js') },
    { type: 'memory_pairs', lang: 'python', data: getMemoryPairs('python') },
    { type: 'bug_snippets', lang: 'js', data: getBugSnippets('js') },
    { type: 'bug_snippets', lang: 'python', data: getBugSnippets('python') },
    { type: 'completion_challenges', lang: 'js', data: getCompletionChallenges('js') },
    { type: 'completion_challenges', lang: 'python', data: getCompletionChallenges('python') },
    { type: 'achievements', lang: null, data: stripAchievementChecks(getAllAchievements()) },
  ]

  for (const item of items) {
    await upsertContent(item)
  }

  console.log(`Seeded ${items.length} content types.`)
  await pool.end()
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
