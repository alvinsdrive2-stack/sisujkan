import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { authService, LoginRequest, CurrentUser } from "@/lib/auth-service"
import { RoleId } from "@/lib/rbac-config"

export type { CurrentUser }

interface AuthContextType {
  user: CurrentUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<CurrentUser>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cek auth status saat mount
  useEffect(() => {
    let cancelled = false

    const initAuth = async () => {
      const token = authService.getToken()
      console.log('[AuthContext] initAuth - token exists:', !!token)

      if (token) {
        try {
          // Fetch fresh user data from API to get latest fields (including noreg)
          const userData = await authService.getCurrentUser()
          if (!cancelled) {
            authService.saveUserData(userData)
            setUser(userData)
          }
        } catch (error) {
          console.error('[AuthContext] Failed to fetch user data:', error)
          // Fallback to localStorage if API fails
          const cachedUserData = authService.getUserData()
          console.log('[AuthContext] Cached user data exists:', !!cachedUserData)
          if (!cancelled) {
            if (cachedUserData) {
              setUser(cachedUserData)
            } else {
              // UUID flow: token from UUID link, not regular login — /auth/me will 401
              // Keep the token and use minimal user from UUID session data
              const uuidData = sessionStorage.getItem("praasesmen_uuid_data")
              if (uuidData) {
                try {
                  const parsed = JSON.parse(uuidData)
                  const minimalUser: CurrentUser = {
                    id: 0,
                    name: 'Asesi',
                    email: '',
                    phone: '',
                    avatar: null,
                    role_id: String(RoleId.ASESI),
                    fcm_token: null,
                    address: null,
                    noreg: null,
                    is_deleted: '0',
                    created_at: '',
                    updated_at: null,
                    role: { id: RoleId.ASESI, name: 'Asesi', guard_name: 'web', permissions: [] },
                    id_izin: parsed.id_izin || '',
                  }
                  console.log('[AuthContext] Using UUID minimal user')
                  setUser(minimalUser)
                  setIsLoading(false)
                  return
                } catch {
                  console.warn('[AuthContext] UUID session data parse failed')
                }
              }
              // No cached data, no UUID session, API failed — clear stale token
              console.warn('[AuthContext] No cached data, clearing token')
              authService.removeToken()
            }
          }
        }
      }

      if (!cancelled) {
        setIsLoading(false)
      }
    }

    initAuth()

    return () => { cancelled = true }
  }, [])

  const login = async (credentials: LoginRequest): Promise<CurrentUser> => {
    try {
      const response = await authService.login(credentials)

      // Simpan token dulu
      authService.saveToken(response.data.access_token)

      // Fetch full user data dari /auth/me
      const userData = await authService.getCurrentUser()

      authService.saveUserData(userData)
      setUser(userData)
      setIsLoading(false)
      return userData
    } catch (error) {
      console.error("Failed to fetch user data:", error)
      setIsLoading(false)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logoutFromApi()
    } catch (error) {
      // Ignore API error and still clear local state
      console.error("Logout API error:", error)
    } finally {
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
      authService.saveUserData(userData)
    } catch (error) {
      // If failed to get current user, clear token and user state
      authService.logout()
      setUser(null)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
