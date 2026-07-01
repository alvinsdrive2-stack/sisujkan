import CryptoJS from 'crypto-js'

// Secret key for encryption - should be stored in env vars in production
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'sisuj-secret-key-2024'

export interface CaptureData {
  token: string
  type: string
  auth: string
  jadwalId: string
}

/**
 * Encrypt capture data to base64 string
 */
export function encryptCaptureData(data: CaptureData): string {
  const jsonString = JSON.stringify(data)
  const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString()
  // Encode to base64 to make it URL-safe
  return btoa(encrypted)
}

/**
 * Decrypt capture data from base64 string
 */
export function decryptCaptureData(encryptedData: string): CaptureData | null {
  try {
    const decoded = atob(encryptedData)
    const decrypted = CryptoJS.AES.decrypt(decoded, SECRET_KEY)
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8)
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Failed to decrypt capture data:', error)
    return null
  }
}
