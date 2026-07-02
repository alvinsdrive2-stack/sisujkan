import type { Plugin } from 'vite'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

/**
 * Vite plugin: POST /api/kan/extract — JSON { file_base64, file_name, type } → Python extract → JSON.
 * Dev-only. Replace with real backend endpoint in production.
 */
export function extractUploadPlugin(): Plugin {
  return {
    name: 'extract-upload',
    configureServer(server) {
      server.middlewares.use('/api/kan/extract', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          // Read JSON body
          const buffers: Buffer[] = []
          for await (const chunk of req) buffers.push(chunk as Buffer)
          const { file_base64, file_name, type } = JSON.parse(Buffer.concat(buffers).toString('utf-8'))

          if (!file_base64 || !type || !file_name) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing file_base64, type, or file_name' }))
            return
          }

          // Decode base64 → write temp file
          const ext = file_name.endsWith('.docx') ? '.docx' : '.bin'
          const tmpDir = join(tmpdir(), 'kan-extract')
          if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
          const tmpFile = join(tmpDir, `${randomUUID()}${ext}`)
          writeFileSync(tmpFile, Buffer.from(file_base64, 'base64'))

          try {
            const scriptPath = join(process.cwd(), 'extract_api.py')
            const output = execSync(
              `python "${scriptPath}" "${tmpFile}" ${type}`,
              { encoding: 'utf-8', timeout: 30000 }
            )
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(output)
          } finally {
            try { unlinkSync(tmpFile) } catch {}
          }
        } catch (err: any) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message || 'Internal server error' }))
        }
      })
    }
  }
}
