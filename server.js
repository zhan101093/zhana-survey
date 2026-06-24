import express from 'express'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
})

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id TEXT PRIMARY KEY,
      timestamp BIGINT NOT NULL,
      answers JSONB NOT NULL
    )
  `)
  console.log('DB ready')
}

app.post('/api/responses', async (req, res) => {
  try {
    const { id, timestamp, answers } = req.body
    await pool.query(
      `INSERT INTO survey_responses (id, timestamp, answers)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [id, timestamp, JSON.stringify(answers)]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('save error:', err)
    res.status(500).json({ error: 'Failed to save' })
  }
})

app.get('/api/responses', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, timestamp, answers FROM survey_responses ORDER BY timestamp ASC'
    )
    res.json(result.rows.map(r => ({
      id: r.id,
      timestamp: Number(r.timestamp),
      answers: r.answers,
    })))
  } catch (err) {
    console.error('fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch' })
  }
})

app.delete('/api/responses', async (_req, res) => {
  try {
    await pool.query('DELETE FROM survey_responses')
    res.json({ ok: true })
  } catch (err) {
    console.error('delete error:', err)
    res.status(500).json({ error: 'Failed to clear' })
  }
})

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

initDb()
  .then(() => app.listen(PORT, () => console.log(`Server on port ${PORT}`)))
  .catch(err => { console.error(err); process.exit(1) })
