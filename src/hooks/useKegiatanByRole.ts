import { useKegiatanAsesi, useKegiatanAsesor } from "@/hooks/useKegiatan"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"

/**
 * Hook yang otomatis memilih useKegiatanAsesi atau useKegiatanAsesor
 * berdasarkan role user saat ini.
 *
 * - Jika role asesor: menggunakan useKegiatanAsesor
 * - Jika role asesi (atau lainnya): menggunakan useKegiatanAsesi
 *
 * Hanya fetch data untuk role yang sesuai, menghindari 403 error.
 */
export function useKegiatanByRole() {
  const { user } = useAuth()
  const isAsesor = user?.role?.id === RoleId.ASESOR

  // Hooks harus dipanggil unconditionally, tapi kita kontrol enabled-nya
  // Hanya fetch untuk role yang sesuai
  const { kegiatan: kegiatanAsesi, isLoading: isLoadingAsesi } = useKegiatanAsesi(!isAsesor)
  const { kegiatan: kegiatanAsesor, isLoading: isLoadingAsesor } = useKegiatanAsesor(isAsesor)

  // Return data berdasarkan role
  return {
    kegiatan: isAsesor ? kegiatanAsesor : kegiatanAsesi,
    isLoading: isAsesor ? isLoadingAsesor : isLoadingAsesi,
    isAsesor,
  }
}
