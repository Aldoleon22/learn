import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config({ path: process.env.DOTENV_PATH || '.env.server' })

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'code_master',
  PORT = '3001',
  CORS_ORIGIN,
} = process.env

const pool = mysql.createPool({
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
}

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(cors(CORS_ORIGIN ? { origin: CORS_ORIGIN } : undefined))

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, error: 'db_unreachable' })
  }
})

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
