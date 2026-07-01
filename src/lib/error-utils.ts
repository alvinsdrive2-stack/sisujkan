/**
 * Extract user-readable error message from any error shape.
 * Handles: Error instances, API JSON responses, network errors, string errors.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback

  // Error instance with message
  if (error instanceof Error) {
    const msg = error.message.trim()
    if (msg && msg !== '{}' && msg !== '[]') return msg
    return fallback
  }

  // Object with message field (API error responses)
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>
    if (typeof obj.message === 'string') {
      const msg = obj.message.trim()
      if (msg && msg !== '{}' && msg !== '[]') return msg
    }
    // Handle Laravel-style error bag
    if (typeof obj.error === 'string') {
      const msg = obj.error.trim()
      if (msg) return msg
    }
  }

  // String error
  if (typeof error === 'string') {
    const msg = error.trim()
    if (msg && msg !== '{}' && msg !== '[]') return msg
  }

  return fallback
}

/**
 * Extract error message from a non-ok fetch Response.
 */
export async function extractApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json()
    const msg = extractErrorMessage(body, '')
    if (msg) return msg
  } catch {
    // JSON parse failed, try text
    try {
      const text = await response.text()
      if (text && text.trim()) return text.trim()
    } catch {
      // ignore
    }
  }
  return `${fallback} (HTTP ${response.status})`
}
