import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config/api"
import { KegiatanAsesor, AsesiItem } from "@/lib/kegiatan-service"

interface RekomendasiData {
  komtek1?: { id: string; rekomendasi: string | null }
  komtek2?: { id: string; rekomendasi: string | null }
  komtek3?: { id: string; rekomendasi: string | null }
}

export function useRekomendasiStatus(kegiatans: KegiatanAsesor[], enabled = true) {
  const [rekomendasiStatus, setRekomendasiStatus] = useState<Record<string, { hasPending: boolean; pendingCount: number; completedCount: number }>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || kegiatans.length === 0) return

    const fetchRekomendasi = async () => {
      setIsLoading(true)
      const token = localStorage.getItem("access_token")
      const userData = localStorage.getItem("user_data")
      const currentUser = userData ? JSON.parse(userData) : null
      const currentUserId = currentUser?.id?.toString()

      if (!currentUserId) {
        setIsLoading(false)
        return
      }

      const results: Record<string, { hasPending: boolean; pendingCount: number; completedCount: number }> = {}

      await Promise.all(
        kegiatans.map(async (kegiatan) => {
          try {
            const listAsesiResponse = await fetch(`${API_BASE_URL}/kegiatan/${kegiatan.jadwal_id}/list-asesi`, {
              headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
              },
            })

            if (!listAsesiResponse.ok) return

            const listAsesiData = await listAsesiResponse.json()
            const asesiList = listAsesiData.list_asesi || []

            let pendingCount = 0
            let completedCount = 0

            await Promise.all(
              asesiList.map(async (asesi: AsesiItem) => {
                try {
                  const rekomendasiResponse = await fetch(`${API_BASE_URL}/komtek/rekomendasi/${asesi.id_izin}`, {
                    headers: {
                      "Accept": "application/json",
                      "Authorization": `Bearer ${token}`,
                    },
                  })

                  if (!rekomendasiResponse.ok) return

                  const rekomendasiData: RekomendasiData = await rekomendasiResponse.json()

                  const komtekKeys: (keyof RekomendasiData)[] = ['komtek1', 'komtek2', 'komtek3']
                  for (const key of komtekKeys) {
                    const komtek = rekomendasiData[key]
                    if (komtek && komtek.id === currentUserId) {
                      if (komtek.rekomendasi === null) {
                        pendingCount++
                      } else {
                        completedCount++
                      }
                      break
                    }
                  }
                } catch (err) {
                  console.error(`Error fetching rekomendasi for ${asesi.id_izin}:`, err)
                }
              })
            )

            results[kegiatan.jadwal_id] = {
              hasPending: pendingCount > 0,
              pendingCount,
              completedCount
            }
          } catch (err) {
            console.error(`Error processing kegiatan ${kegiatan.jadwal_id}:`, err)
          }
        })
      )

      setRekomendasiStatus(results)
      setIsLoading(false)
    }

    fetchRekomendasi()
  }, [kegiatans.map(k => k.jadwal_id).join(','), enabled])

  return { rekomendasiStatus, isLoading }
}

export function useAsesiRekomendasiStatus(asesiList: AsesiItem[], enabled = true) {
  const [asesiRekomendasiStatus, setAsesiRekomendasiStatus] = useState<Record<string, { status: 'pending' | 'completed' | 'unknown' }>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled || asesiList.length === 0) return

    const fetchRekomendasi = async () => {
      setIsLoading(true)
      const token = localStorage.getItem("access_token")
      const userData = localStorage.getItem("user_data")
      const currentUser = userData ? JSON.parse(userData) : null
      const currentUserId = currentUser?.id?.toString()

      if (!currentUserId) {
        setIsLoading(false)
        return
      }

      const results: Record<string, { status: 'pending' | 'completed' | 'unknown' }> = {}

      await Promise.all(
        asesiList.map(async (asesi) => {
          try {
            const response = await fetch(`${API_BASE_URL}/komtek/rekomendasi/${asesi.id_izin}`, {
              headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
              },
            })

            if (!response.ok) {
              results[asesi.id_izin] = { status: 'unknown' }
              return
            }

            const rekomendasiData: RekomendasiData = await response.json()

            const komtekKeys: (keyof RekomendasiData)[] = ['komtek1', 'komtek2', 'komtek3']
            let found = false
            for (const key of komtekKeys) {
              const komtek = rekomendasiData[key]
              if (komtek && komtek.id === currentUserId) {
                results[asesi.id_izin] = {
                  status: komtek.rekomendasi === null ? 'pending' : 'completed'
                }
                found = true
                break
              }
            }

            if (!found) {
              results[asesi.id_izin] = { status: 'unknown' }
            }
          } catch (err) {
            console.error(`Error fetching rekomendasi for ${asesi.id_izin}:`, err)
            results[asesi.id_izin] = { status: 'unknown' }
          }
        })
      )

      setAsesiRekomendasiStatus(results)
      setIsLoading(false)
    }

    fetchRekomendasi()
  }, [asesiList.map(a => a.id_izin).join(','), enabled])

  return { asesiRekomendasiStatus, isLoading }
}
