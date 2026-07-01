import { API_BASE_URL } from "@/config/api"

export interface LoginRequest {
  account: string
  password: string
}

export interface LoginResponse {
  message: string
  data: {
    id_user: number
    role_id: string
    access_token: string
    token_type: string
    expires_in: number
  }
}

export interface CurrentUser {
  id: number
  name: string
  email: string
  phone: string
  avatar: string | null
  role_id: string
  fcm_token: string | null
  address: string | null
  noreg: string | null
  is_deleted: string
  created_at: string
  updated_at: string | null
  role: {
    id: number
    name: string
    guard_name: string
    permissions: string[]
  }
  id_izin?: string
}

export interface MeResponse {
  message: string
  data: {
    user: CurrentUser
    role: CurrentUser['role']
    id_izin: string
  }
}

export interface LogoutResponse {
  message: string
}

export interface AuthError {
  message: string
  errors?: Record<string, string[]>
}

class AuthService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error: AuthError = await response.json().catch(() => ({ message: "Login failed" }))
      throw new Error(error.message || "Login failed")
    }

    return response.json()
  }

  // Simpan token ke localStorage
  saveToken(token: string): void {
    localStorage.setItem("access_token", token)
  }

  // Ambil token dari localStorage
  getToken(): string | null {
    return localStorage.getItem("access_token")
  }

  // Hapus token dari localStorage
  removeToken(): void {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user_data")
  }

  // Simpan user data
  saveUserData(userData: CurrentUser): void {
    localStorage.setItem("user_data", JSON.stringify(userData))
  }

  // Ambil user data
  getUserData(): CurrentUser | null {
    const data = localStorage.getItem("user_data")
    return data ? JSON.parse(data) : null
  }

  // Cek apakah user sudah login
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Get current user from API
  async getCurrentUser(): Promise<CurrentUser> {
    const token = this.getToken()

    if (!token) {
      throw new Error("No token found")
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.warn('[AuthService] /auth/me returned status:', response.status)
      // UUID flow: token from UUID link won't work with /auth/me — don't clear it
      const isUuidSession = !!sessionStorage.getItem("praasesmen_uuid_data")
      if (response.status === 401 && !isUuidSession) {
        this.removeToken()
      }
      throw new Error(`Failed to get current user (status: ${response.status})`)
    }

    const result: MeResponse = await response.json()
    // Attach role and id_izin to user object
    return { ...result.data.user, role: result.data.role, id_izin: result.data.id_izin }
  }

  // Logout from API
  async logoutFromApi(): Promise<LogoutResponse> {
    const token = this.getToken()

    if (!token) {
      throw new Error("No token found")
    }

    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Logout failed")
    }

    // Clear local storage regardless of API response
    this.removeToken()

    return response.json()
  }

  // Logout (local only - for backward compatibility)
  logout(): void {
    this.removeToken()
  }
}

export const authService = new AuthService()
