import { useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { RoleId } from "@/lib/rbac-config"

export type AsesorRole = 'asesor_1' | 'asesor_2' | 'asesor_other' | 'none'

interface UseAsesorRoleResult {
  role: AsesorRole
  asesorIndex: number // 0 = asesor_1, 1 = asesor_2, 2+ = other
  isAsesor1: boolean
  isAsesor2: boolean
  isAsesorOther: boolean
}

export function useAsesorRole(idIzin: string | undefined): UseAsesorRoleResult {
  const { user } = useAuth()
  const { asesorList } = useDataDokumenAsesmen(idIzin)

  const result = useMemo((): UseAsesorRoleResult => {
    // Default: not an asesor or no match
    const defaultResult: UseAsesorRoleResult = {
      role: 'none',
      asesorIndex: -1,
      isAsesor1: false,
      isAsesor2: false,
      isAsesorOther: false,
    }

    if (!user || user.role?.id !== RoleId.ASESOR) {
      return defaultResult
    }

    // Get logged-in asesor's noreg from user data
    // Assuming the user object has noreg field
    const loggedInNoreg = (user as any).noreg || ''

    if (!loggedInNoreg || !asesorList.length) {
      return defaultResult
    }

    // Find matching asesor by noreg
    const matchedIndex = asesorList.findIndex(a => a.noreg === loggedInNoreg)

    if (matchedIndex === -1) {
      return defaultResult
    }

    if (matchedIndex === 0) {
      return {
        role: 'asesor_1',
        asesorIndex: 0,
        isAsesor1: true,
        isAsesor2: false,
        isAsesorOther: false,
      }
    } else if (matchedIndex === 1) {
      return {
        role: 'asesor_2',
        asesorIndex: 1,
        isAsesor1: false,
        isAsesor2: true,
        isAsesorOther: false,
      }
    } else {
      return {
        role: 'asesor_other',
        asesorIndex: matchedIndex,
        isAsesor1: false,
        isAsesor2: false,
        isAsesorOther: true,
      }
    }
  }, [user, asesorList])

  return result
}
