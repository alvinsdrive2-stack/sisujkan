import { useState, useEffect, useRef } from "react"

import { API_BASE_URL } from "@/config/api"

export interface AbsenData {
  id_izin?: string
  // Asesi - Pra Asesmen
  url_absen_asesi_pra_awal: string | null
  url_absen_asesi_pra_akhir: string | null
  // Asesi - Asesmen
  url_absen_asesi_awal: string | null
  url_absen_asesi_akhir: string | null
  // Asesor 1 - Pra Asesmen
  url_absen_asesor1_pra_awal: string | null
  url_absen_asesor1_pra_akhir: string | null
  // Asesor 1 - Asesmen
  url_absen_asesor1_awal: string | null
  url_absen_asesor1_akhir: string | null
  // Asesor 2 - Pra Asesmen
  url_absen_asesor2_pra_awal: string | null
  url_absen_asesor2_pra_akhir: string | null
  // Asesor 2 - Asesmen
  url_absen_asesor2_awal: string | null
  url_absen_asesor2_akhir: string | null
  // Foto
  foto_kegiatan: string | null
  foto_bersama: string | null
}

export interface AbsenDataResponse {
  message: string
  data: AbsenData
}

async function fetchAbsenData(idIzin: string): Promise<AbsenDataResponse> {
  const token = localStorage.getItem("access_token")

  const response = await fetch(`${API_BASE_URL}/dokumen/absen/${idIzin}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch absen data" }))
    throw new Error(error.message || "Failed to fetch absen data")
  }

  return response.json()
}

export function useAbsenData(idIzin: string, enabled = true) {
  const [data, setData] = useState<AbsenData | null>(null)
  const [isLoading, setIsLoading] = useState(enabled && !!idIzin)
  const [error, setError] = useState<string | null>(null)

  const setDataRef = useRef(setData)
  setDataRef.current = setData

  useEffect(() => {
    if (!enabled || !idIzin) {
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetchAbsenData(idIzin)
        
        setDataRef.current?.(response.data)
      } catch (err) {
        console.error('Error fetching absen data:', err)
        setError(err instanceof Error ? err.message : "Failed to fetch absen data")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [idIzin, enabled])

  const refetch = async () => {
    if (!idIzin) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchAbsenData(idIzin)
      setDataRef.current?.(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch absen data")
    } finally {
      setIsLoading(false)
    }
  }

  return { data, isLoading, error, refetch }
}

/** Batch absen data fetcher for multiple asesi IDs */
export function useBatchAbsenData(asesiIds: string[], enabled = true) {
  const [absenData, setAbsenData] = useState<Record<string, AbsenData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || asesiIds.length === 0) return

    const fetchAbsenData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("access_token")
        const results: Record<string, AbsenData> = {}

        await Promise.all(
          asesiIds.map(async (idIzin) => {
            try {
              const response = await fetch(`${API_BASE_URL}/dokumen/absen/${idIzin}`, {
                headers: {
                  "Accept": "application/json",
                  "Authorization": `Bearer ${token}`,
                },
              })

              if (response.ok) {
                const result = await response.json()
                if (result.message === "Success" && result.data) {
                  results[idIzin] = {
                    id_izin: idIzin,
                    ...result.data
                  }
                }
              }
            } catch (err) {
              console.error(`Error fetching absen for ${idIzin}:`, err)
            }
          })
        )

        setAbsenData(results)
      } catch (err) {
        console.error('Error fetching absen data:', err)
        setError(err instanceof Error ? err.message : "Failed to fetch absen data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAbsenData()
  }, [asesiIds.join(','), enabled])

  return { absenData, isLoading, error }
}
