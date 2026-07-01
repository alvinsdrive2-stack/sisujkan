import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useKegiatanAsesorList } from "@/hooks/useKegiatan"
import { kegiatanService } from "@/lib/kegiatan-service"
import { API_BASE_URL } from "@/config/api"

interface PersiapanPendingCounts {
  pending: number  // total asesi with APL02 QR filled across all tahap 0 kegiatan
  perKegiatan: Record<string, number>
  isLoading: boolean
}

export function useAsesorPersiapanPending(enabled = true): PersiapanPendingCounts {
  const { user } = useAuth()
  const { kegiatans, isLoading: kegiatanLoading } = useKegiatanAsesorList(enabled)
  const [counts, setCounts] = useState<PersiapanPendingCounts>({
    pending: 0,
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

    // Only process tahap 0 kegiatan
    const tahap0Kegiatan = kegiatans.filter(k => Number(k.tahap) === 0)
    if (tahap0Kegiatan.length === 0) {
      setCounts({ pending: 0, perKegiatan: {}, isLoading: false })
      hasFetched.current = true
      return
    }

    hasFetched.current = true

    const fetchPendingCounts = async () => {
      const token = localStorage.getItem("access_token")
      const headers = { Accept: "application/json", Authorization: `Bearer ${token}` }

      const perKegiatan: Record<string, number> = {}
      let totalPending = 0

      await Promise.all(tahap0Kegiatan.map(async (kegiatan) => {
        try {
          const asesiRes = await kegiatanService.getListAsesi(kegiatan.jadwal_id)
          const asesiList = asesiRes.list_asesi || []

          // Check APL02 barcode for each asesi
          const results = await Promise.all(
            asesiList.map(async (asesi) => {
              try {
                const res = await fetch(`${API_BASE_URL}/praasesmen/${asesi.id_izin}/apl02`, { headers })
                if (res.ok) {
                  const json = await res.json()
                  const data = json.data
                  if (!data?.units) return false
                  // Check if any subunit has asesi barcode filled
                  return data.units.some((unit: any) =>
                    unit.subunits?.some((subunit: any) => !!subunit.barcodes?.asesi?.url)
                  )
                }
              } catch { /* ignore */ }
              return false
            })
          )

          const readyCount = results.filter(Boolean).length
          perKegiatan[kegiatan.jadwal_id] = readyCount
          totalPending += readyCount
        } catch (err) {
          console.error(`Error processing kegiatan ${kegiatan.jadwal_id}:`, err)
        }
      }))

      setCounts({ pending: totalPending, perKegiatan, isLoading: false })
    }

    fetchPendingCounts()
  }, [enabled, kegiatanLoading, kegiatans, user?.id])

  return counts
}
