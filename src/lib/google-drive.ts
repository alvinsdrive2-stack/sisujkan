// Google Drive direct upload helper
// Uses Google Identity Services (GIS) for OAuth + Drive API v3 via fetch
// No gapi.client dependency — lighter load

export interface DriveFileResult {
  fileId: string
  name: string
  webViewLink: string
  mimeType: string
}

interface DriveTokenClient {
  requestAccessToken: (config?: { prompt?: string; hint?: string }) => void
}

// --- State ---
let tokenClient: DriveTokenClient | null = null
let accessToken: string | null = null
let tokenExpiresAt = 0
let initPromise: Promise<void> | null = null

const SCOPE = 'https://www.googleapis.com/auth/drive.file'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

/** Load GIS script dynamically. Idempotent. */
function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    )
    if (existing) { resolve(); return }

    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
}

/** Initialize Drive client. Safe to call multiple times. */
export async function initDriveClient(clientId: string): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    await loadGis()

    // Wait for google.accounts.oauth2 to be available
    while (!(window as any).google?.accounts?.oauth2) {
      await new Promise(r => setTimeout(r, 100))
    }

    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response: any) => {
        if (response.access_token) {
          accessToken = response.access_token
          tokenExpiresAt = Date.now() + (response.expires_in || 3600) * 1000
        }
      },
    })
  })()

  return initPromise
}

/** Get valid access token. Shows popup if needed. */
export async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt - 60_000) {
    return accessToken // Still fresh
  }

  if (!tokenClient) {
    throw new Error('Drive client not initialized. Call initDriveClient() first.')
  }

  return new Promise((resolve, reject) => {
    const originalCallback = (tokenClient as any).callback

    ;(tokenClient as any).callback = (response: any) => {
      originalCallback(response)
      if (response.access_token) {
        resolve(response.access_token)
      } else if (response.error) {
        reject(new Error(response.error))
      } else {
        reject(new Error('User cancelled Google auth'))
      }
    }

    tokenClient!.requestAccessToken()
  })
}

/** Drive API fetch helper — attaches auth, throws on non-2xx. */
async function driveFetch(url: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers as Record<string, string>,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Drive API ${res.status}: ${body}`)
  }

  if (res.status === 204) return null // No content (e.g. permission create)
  return res.json()
}

/** Find folder by name inside optional parent. Returns first match or null. */
export async function findFolder(name: string, parentId?: string): Promise<string | null> {
  let query = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  if (parentId) query += ` and '${parentId}' in parents`

  const params = parentId ? '&supportsAllDrives=true' : ''
  const q = encodeURIComponent(query)
  const data = await driveFetch(`${DRIVE_API}/files?q=${q}&fields=files(id,name)&pageSize=10${params}`)
  return data?.files?.[0]?.id ?? null
}

/** Create folder inside optional parent. Returns folder ID. */
export async function createFolder(name: string, parentId?: string): Promise<string> {
  const body: Record<string, any> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) body.parents = [parentId]

  const params = parentId ? '?supportsAllDrives=true' : ''
  const data = await driveFetch(`${DRIVE_API}/files${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return data.id
}

/** Find folder or create if not exist. Returns folder ID. */
export async function findOrCreateFolder(name: string, parentId?: string): Promise<string> {
  const existing = await findFolder(name, parentId)
  if (existing) return existing
  return createFolder(name, parentId)
}

/** Upload file to Drive folder. Returns file metadata. */
export async function uploadFileToDrive(
  file: File,
  folderId: string,
  onProgress?: (pct: number) => void
): Promise<DriveFileResult> {
  const drivesParam = '?supportsAllDrives=true'

  // Step 1: Create file metadata
  const token = await getAccessToken()
  const metaRes = await fetch(`${DRIVE_API}/files${drivesParam}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: file.name,
      parents: [folderId],
    }),
  })

  if (!metaRes.ok) {
    const body = await metaRes.text().catch(() => '')
    throw new Error(`Drive API create file: ${metaRes.status} — ${body}`)
  }

  const { id: fileId } = await metaRes.json()

  // Step 2: Upload content via XHR (supports progress)
  await uploadContentWithProgress(file, fileId, token, onProgress)

  // Step 3: Set public permission
  await setFilePermission(fileId)

  const meta = await driveFetch(
    `${DRIVE_API}/files/${fileId}?fields=id,name,webViewLink,mimeType&supportsAllDrives=true`
  )

  return {
    fileId: meta.id,
    name: meta.name,
    webViewLink: meta.webViewLink || `https://drive.google.com/file/d/${meta.id}/view`,
    mimeType: meta.mimeType || file.type,
  }
}

function uploadContentWithProgress(
  file: File,
  fileId: string,
  token: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PATCH', `${DRIVE_UPLOAD}/files/${fileId}?uploadType=media&supportsAllDrives=true`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Drive API upload content: ${xhr.status} — ${xhr.responseText}`))
    }

    xhr.onerror = () => reject(new Error('Drive API upload network error'))
    xhr.send(file)
  })
}

/** Set file to "Anyone with link can view". Returns file accessible without Google login. */
async function setFilePermission(fileId: string): Promise<void> {
  await driveFetch(`${DRIVE_API}/files/${fileId}/permissions?supportsAllDrives=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  })
}

/**
 * High-level: init → find/create folder → upload → set permission → return result.
 *
 * `clientId`       — Google OAuth 2.0 Web Client ID
 * `folderName`     — Folder name to find or create (e.g. "SISUJ - Budi - Skema Teknisi")
 * `file`           — File to upload
 * `parentFolderId` — Optional parent folder ID. Subfolder created inside it instead of root.
 * `onProgress`     — Optional progress callback (0-100)
 */
export async function createGoogleDriveFile(
  clientId: string,
  folderName: string,
  file: File,
  parentFolderId?: string,
  onProgress?: (pct: number) => void
): Promise<DriveFileResult> {
  await initDriveClient(clientId)
  const folderId = await findOrCreateFolder(folderName, parentFolderId)
  return uploadFileToDrive(file, folderId, onProgress)
}
