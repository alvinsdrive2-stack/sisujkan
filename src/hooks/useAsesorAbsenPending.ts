import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useKegiatanAsesorList } from "@/hooks/useKegiatan"
import { kegiatanService } from "@/lib/kegiatan-service"
import { API_BASE_URL } from "@/config/api"

interface AbsenKeluarCounts {
  tahap1Pending: number  // total asesi without absen keluar across all tahap 1 kegiatan
  tahap2Pending: number  // total asesi without absen keluar across all tahap 2 kegiatan
  perKegiatan: Record<string, number>  // jadwalId -> pending count for that kegiatan
  isLoading: boolean
}

export function useAsesorAbsenPending(enabled = true): AbsenKeluarCounts {
  const { user } = useAuth()
  const { kegiatans, isLoading: kegiatanLoading } = useKegiatanAsesorList(enabled)
  const [counts, setCounts] = useState<AbsenKeluarCounts>({
    tahap1Pending: 0,
    tahap2Pending: 0,
    perKegiatan: {},
    isLoading: true,
  })

  const hasFetched = useRef(false)

  useEffect(() => {
    if (!enabled) {
      setCounts(prev => ({ ...prev, isLoading: false }))
      return
    }
    if (kegiatanLoading || kegiatans.length === 0 || hasFetched.current) return
    hasFetched.current = true

    const fetchPendingCounts = async () => {
      const token = localStorage.getItem("access_token")
      const headers = { Accept: "application/json", Authorization: `Bearer ${token}` }

      // Filter kegiatan to only tahap 1 and 2
      const relevantKegiatan = kegiatans.filter(k => k.tahap === 1 || k.tahap === 2)

      const perKegiatan: Record<string, number> = {}
      let tahap1Pending = 0
      let tahap2Pending = 0

      // Process each kegiatan
      await Promise.all(relevantKegiatan.map(async (kegiatan) => {
        try {
          // Determine if user is asesor1 or asesor2
          const isAsesor1 = kegiatan.asesor?.id === Number(user?.id)
          const asesorNum = isAsesor1 ? 1 : 2

          // Fetch asesi list for this kegiatan
          const asesiRes = await kegiatanService.getListAsesi(kegiatan.jadwal_id)
          const asesiList = asesiRes.list_asesi || []

          // Fetch absen data for all asesi in parallel
          const absenResults = await Promise.all(
            asesiList.map(async (asesi) => {
              try {
                const res = await fetch(`${API_BASE_URL}/dokumen/absen/${asesi.id_izin}`, { headers })
                if (res.ok) {
                  const json = await res.json()
                  return json.data || null
                }
              } catch { /* ignore */ }
              return null
            })
          )

          // Count asesi without absen keluar
          let pending = 0
          absenResults.forEach((absen: any) => {
            if (!absen) { pending++; return }

            let akhir: string | null = null
            if (kegiatan.tahap === 1) {
              akhir = asesorNum === 1 ? absen.url_absen_asesor1_pra_akhir : absen.url_absen_asesor2_pra_akhir
            } else if (kegiatan.tahap === 2) {
              akhir = asesorNum === 1 ? absen.url_absen_asesor1_akhir : absen.url_absen_asesor2_akhir
            }
            if (!akhir) pending++
          })

          perKegiatan[kegiatan.jadwal_id] = pending
          if (kegiatan.tahap === 1) tahap1Pending += pending
          else if (kegiatan.tahap === 2) tahap2Pending += pending
        } catch (err) {
          console.error(`Error processing kegiatan ${kegiatan.jadwal_id}:`, err)
        }
      }))

      setCounts({ tahap1Pending, tahap2Pending, perKegiatan, isLoading: false })
    }

    fetchPendingCounts()
  }, [enabled, kegiatanLoading, kegiatans, user?.id])

  return counts
}
