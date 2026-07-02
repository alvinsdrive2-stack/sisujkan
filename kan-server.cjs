const express = require('express')
const { execSync } = require('child_process')
const { writeFileSync, mkdirSync, existsSync, unlinkSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')

const app = express()
const PORT = process.env.PORT || 3000
const DIST = join(__dirname, 'dist')

// JSON body parser (raw for base64)
app.use(express.json({ limit: '50mb' }))

// Extract endpoint
app.post('/api/kan/extract', (req, res) => {
  const { file_base64, file_name, type } = req.body

  if (!file_base64 || !type || !file_name) {
    return res.status(400).json({ error: 'Missing file_base64, type, or file_name' })
  }

  const ext = file_name.endsWith('.docx') ? '.docx' : '.bin'
  const tmpDir = join(tmpdir(), 'kan-extract')
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
  const tmpFile = join(tmpDir, `${randomUUID()}${ext}`)

  try {
    writeFileSync(tmpFile, Buffer.from(file_base64, 'base64'))

    const scriptPath = join(__dirname, 'extract_api.py')
    const output = execSync(
      `python "${scriptPath}" "${tmpFile}" ${type}`,
      { encoding: 'utf-8', timeout: 30000 }
    )

    res.setHeader('Content-Type', 'application/json')
    res.send(output)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Extraction failed' })
  } finally {
    try { unlinkSync(tmpFile) } catch {}
  }
})

// Serve static files from dist/
app.use(express.static(DIST))

// SPA fallback — catch-all for non-static, non-API routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
  res.sendFile(join(DIST, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`KAN Server running on http://localhost:${PORT}`)
  console.log(`Serving static from: ${DIST}`)
})
