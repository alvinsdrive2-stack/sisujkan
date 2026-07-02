import type { Plugin } from 'vite'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

/**
 * Vite plugin: /api/kan/extract — DOCX upload → Python extract → JSON response.
 * Dev-only. Replace with real backend endpoint in production.
 */
export function extractUploadPlugin(): Plugin {
  return {
    name: 'extract-upload',
    configureServer(server) {
      server.middlewares.use('/api/kan/extract', async (req, res) => {
        // Only accept POST
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          // Parse multipart form
          const buffers: Buffer[] = []
          for await (const chunk of req) {
            buffers.push(chunk as Buffer)
          }
          const body = Buffer.concat(buffers)

          // Parse boundary
          const contentType = req.headers['content-type'] || ''
          const boundary = contentType.split('boundary=')[1]
          if (!boundary) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'No boundary in content-type' }))
            return
          }

          // Extract file and type from multipart
          const parts = body.toString('latin1').split(`--${boundary}`)
          let fileBuffer: Buffer | null = null
          let fileName = ''
          let extractType = ''

          for (const part of parts) {
            if (part.includes('Content-Disposition')) {
              const headerMatch = part.match(/name="([^"]+)"\s*(?:filename="([^"]*)")?/)
              const name = headerMatch?.[1] || ''
              const filename = headerMatch?.[2] || ''

              // Extract content after headers (after double newline)
              const contentStart = part.indexOf('\r\n\r\n') + 4
              const content = part.slice(contentStart).trimEnd().replace(/\r\n--$/, '')

              if (name === 'type') {
                extractType = content.trim()
              } else if (filename) {
                fileName = filename
                // Get raw bytes for the file part
                const rawPart = body.toString('latin1').split(`--${boundary}`)
                for (const rp of rawPart) {
                  if (rp.includes(`filename="${filename}"`)) {
                    const rs = rp.indexOf('\r\n\r\n') + 4
                    let re = rp.lastIndexOf('\r\n--')
                    if (re === -1) re = rp.length
                    const latinContent = rp.slice(rs, re)
                    fileBuffer = Buffer.from(latinContent, 'latin1')
                    break
                  }
                }
              }
            }
          }

          if (!fileBuffer) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'No file uploaded' }))
            return
          }

          if (!extractType) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing extract type' }))
            return
          }

          // Save to temp
          const tmpDir = join(tmpdir(), 'kan-extract')
          if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
          const tmpFile = join(tmpDir, `${randomUUID()}_${fileName}`)
          writeFileSync(tmpFile, fileBuffer)

          try {
            // Run Python extract
            const scriptPath = join(process.cwd(), 'extract_api.py')
            const output = execSync(
              `python "${scriptPath}" "${tmpFile}" ${extractType}`,
              { encoding: 'utf-8', timeout: 30000 }
            )

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(output)
          } finally {
            // Cleanup temp file
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
