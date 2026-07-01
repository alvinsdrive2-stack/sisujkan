import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"
import { KegiatanAsesor } from "@/lib/kegiatan-service"

interface BaKomtekProgress {
  my_ttd_signed: boolean
  ba_komtek_ttd_progress: {
    komtek1: boolean
    komtek2: boolean
    komtek3: boolean
  }
  my_position: number
}

export function useBaKomtekProgress(kegiatans: KegiatanAsesor[], enabled = true) {
  const [baProgress, setBaProgress] = useState<Record<string, BaKomtekProgress>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || kegiatans.length === 0) return

    const fetchProgress = async () => {
      setIsLoading(true)
      const token = localStorage.getItem("access_token")
      const results: Record<string, BaKomtekProgress> = {}

      await Promise.all(
        kegiatans.map(async (kegiatan) => {
          try {
            const response = await fetch(`${API_BASE_URL}/komtek/files/${kegiatan.jadwal_id}`, {
              headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
              },
            })

            if (!response.ok) return

            const data = await response.json()
            if (data.ba_komtek_ttd_progress) {
              results[kegiatan.jadwal_id] = {
                my_ttd_signed: data.my_ttd_signed ?? false,
                ba_komtek_ttd_progress: data.ba_komtek_ttd_progress,
                my_position: data.my_position ?? 0,
              }
            }
          } catch (err) {
            console.error(`Error fetching BA Komtek progress for ${kegiatan.jadwal_id}:`, err)
          }
        })
      )

      setBaProgress(results)
      setIsLoading(false)
    }

    fetchProgress()
  }, [kegiatans.map(k => k.jadwal_id).join(','), enabled])

  return { baProgress, isLoading }
}
