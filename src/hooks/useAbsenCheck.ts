import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/toast"
import { RoleId } from "@/lib/rbac-config"

import { API_BASE_URL } from "@/config/api"

interface AbsenData {
  // Praasesmen - Asesi
  url_absen_asesi_pra_awal: string | null
  url_absen_asesi_pra_akhir: string | null
  // Praasesmen - Asesor
  url_absen_asesor1_pra_awal: string | null
  url_absen_asesor1_pra_akhir: string | null
  url_absen_asesor2_pra_awal: string | null
  url_absen_asesor2_pra_akhir: string | null
  // Asesmen - Asesi
  url_absen_asesi_awal: string | null
  url_absen_asesi_akhir: string | null
  // Asesmen - Asesor
  url_absen_asesor1_awal: string | null
  url_absen_asesor1_akhir: string | null
  url_absen_asesor2_awal: string | null
  url_absen_asesor2_akhir: string | null
  // Foto
  foto_kegiatan?: string | null
}

interface PostResponse {
  message: string
  url: string
}

interface AsesorInfo {
  id: number | string
  noreg?: string
}

interface UseAbsenCheckOptions {
  phase: 'praasesmen' | 'asesmen'
  role?: 'asesi' | 'asesor1' | 'asesor2' | 'auto' // 'auto' will detect based on asesorList
  checkOnMount?: boolean
  idIzin?: string // Optional override from props
  asesorList?: AsesorInfo[] // Required when role='auto' to determine asesor1/2
  tahap?: number // If 0, skip absen check (initial/setup state)
}

export function useAbsenCheck({
  phase,
  role = 'asesi',
  checkOnMount = true,
  idIzin: idIzinProp,
  asesorList = [],
  tahap
}: UseAbsenCheckOptions) {
  // Always use URL param as source of truth for idIzin.
  // idIzinProp is only a fallback; URL param ensures we check the right izin
  // even when user?.id_izin is stale (e.g. direct URL navigation).
  const { idIzin: idIzinFromUrl } = useParams<{ idIzin: string }>()
  const { user } = useAuth()
  const finalIdIzin = idIzinFromUrl || idIzinProp

  const [showAwalModal, setShowAwalModal] = useState(false)
  const [showAkhirModal, setShowAkhirModal] = useState(false)
  const [absenData, setAbsenData] = useState<AbsenData | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  // Determine actual role based on user and asesorList
  const actualRole = useMemo((): 'asesi' | 'asesor1' | 'asesor2' => {
    if (role !== 'auto') return role

    // If role is 'auto', detect based on user and asesorList
    const isAsesor = user?.role?.id === RoleId.ASESOR

    if (!isAsesor) return 'asesi'

    // Find user position in asesorList
    const userId = String(user?.id || '')
    const userNoreg = (user as any)?.noreg || ''

    // Try to match by ID first, then by noreg
    let matchedIndex = asesorList.findIndex(a => String(a.id) === userId)
    if (matchedIndex === -1 && userNoreg) {
      matchedIndex = asesorList.findIndex(a => a.noreg === userNoreg)
    }

    // Default to asesor1 if found at index 0, asesor2 if index 1
    if (matchedIndex === 0) return 'asesor1'
    if (matchedIndex === 1) return 'asesor2'

    // If not found but is asesor, default to asesor1
    return 'asesor1'
  }, [role, user, asesorList])

  // Get field names based on phase and role
  const getAwalField = useCallback(() => {
    const roleField = actualRole === 'asesi' ? 'asesi' : actualRole
    return `url_absen_${roleField}_${phase === 'praasesmen' ? 'pra_' : ''}awal` as keyof AbsenData
  }, [phase, actualRole])

  const getAkhirField = useCallback(() => {
    const roleField = actualRole === 'asesi' ? 'asesi' : actualRole
    return `url_absen_${roleField}_${phase === 'praasesmen' ? 'pra_' : ''}akhir` as keyof AbsenData
  }, [phase, actualRole])

  // Get endpoint based on phase
  const getEndpoint = useCallback(() => {
    // For praasesmen: /praasesmen/{id_izin}/absen-awal
    // For asesmen: /asesmen/{id_izin}/absen-awal
    return `${phase}/${finalIdIzin}/absen`
  }, [phase, finalIdIzin])

  // Module-level cache: skip API call if data already fetched within 30s
  const absenCacheRef = useRef<{ idIzin: string; data: AbsenData | null; expiry: number } | null>(null)

  // Fetch absen data
  const fetchAbsenData = useCallback(async (force = false) => {
    if (!finalIdIzin) {
      return null
    }

    // Return cached data if valid and not forced
    if (!force && absenCacheRef.current && absenCacheRef.current.idIzin === finalIdIzin && Date.now() < absenCacheRef.current.expiry) {
      const cached = absenCacheRef.current.data
      if (cached) setAbsenData(cached)
      return cached
    }

    try {
      const token = localStorage.getItem("access_token")

      const response = await fetch(`${API_BASE_URL}/dokumen/absen/${finalIdIzin}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const absen = result.data || result
        absenCacheRef.current = { idIzin: finalIdIzin, data: absen, expiry: Date.now() + 30_000 }
        setAbsenData(absen)
        return absen
      }
    } catch (error) {
      console.error("[fetchAbsenData] Error fetching absen data:", error)
    }
    return null
  }, [finalIdIzin])

  // Check absen data on mount
  useEffect(() => {
    const checkAbsenData = async () => {
      if (!finalIdIzin || !checkOnMount) {
        setIsChecking(false)
        return
      }

      // Skip absen if tahap is 0 (initial/setup state, no attendance needed)
      if (tahap === 0) {
        setIsChecking(false)
        return
      }

      // For asesor with 'auto' role, wait for asesorList to be populated
      const isAsesor = user?.role?.id === RoleId.ASESOR
      if (isAsesor && role === 'auto' && asesorList.length === 0) {
        console.log('[useAbsenCheck] Asesor with empty asesorList — skipping modal until asesorList is loaded')
        setIsChecking(false)
        return
      }

      setIsChecking(true)
      const absen = await fetchAbsenData()
      setIsChecking(false)

      // Show modal only if absen data is loaded AND the field is empty/missing
      if (absen) {
        const awalField = getAwalField()
        // Only show modal if field exists in response AND is empty/missing
        // This prevents showing modal when API returns partial data
        if (!Object.prototype.hasOwnProperty.call(absen, awalField)) {
          // Field doesn't exist in API response — treat as no record, don't show modal
          console.log(`[useAbsenCheck] Field ${awalField} not in API response — skipping modal`)
        } else {
          const fieldValue = absen[awalField]
          if (!fieldValue || String(fieldValue).trim() === '') {
            console.log(`[useAbsenCheck] Absen awal for ${awalField} is empty — showing modal`)
            setShowAwalModal(true)
          } else {
            console.log(`[useAbsenCheck] Absen awal for ${awalField} already exists — skipping modal`, fieldValue)
          }
        }
      } else {
        // No absen record at all for this izin — don't show modal
        console.log(`[useAbsenCheck] No absen record found for izin ${finalIdIzin} — skipping modal`)
      }
    }

    checkAbsenData()
  }, [finalIdIzin, checkOnMount, fetchAbsenData, getAwalField, role, user, asesorList, tahap])

  // Submit absen awal photo
  const submitAbsenAwal = useCallback(async (imageBlob: Blob) => {
    if (!finalIdIzin) throw new Error("ID Izin tidak ditemukan")

    const token = localStorage.getItem("access_token")
    const formData = new FormData()
    formData.append("image", imageBlob, "absen-awal.jpg")

    const endpoint = getEndpoint()

    const response = await fetch(`${API_BASE_URL}/${endpoint}-awal`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    })

    const result: PostResponse = await response.json()


    if (!response.ok) {
      throw new Error(result.message || "Gagal menyimpan foto absen")
    }

    // Update local state with the URL from response
    const awalField = getAwalField()
    setAbsenData(prev => prev ? { ...prev, [awalField]: result.url } : null)

    // Close modal after successful submit
    setShowAwalModal(false)

    toast("Foto absen berhasil disimpan!", "success")
  }, [finalIdIzin, getEndpoint, getAwalField])

  // Submit absen akhir photo
  const submitAbsenAkhir = useCallback(async (imageBlob: Blob) => {
    if (!finalIdIzin) throw new Error("ID Izin tidak ditemukan")

    const token = localStorage.getItem("access_token")
    const formData = new FormData()
    formData.append("image", imageBlob, "absen-akhir.jpg")

    const endpoint = getEndpoint()

    const response = await fetch(`${API_BASE_URL}/${endpoint}-akhir`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    })

    const result: PostResponse = await response.json()
    

    if (!response.ok) {
      throw new Error(result.message || "Gagal menyimpan foto absen")
    }

    // Update local state with the URL from response
    const akhirField = getAkhirField()
    setAbsenData(prev => prev ? { ...prev, [akhirField]: result.url } : null)

    toast("Foto absen berhasil disimpan!", "success")
  }, [finalIdIzin, getEndpoint, getAkhirField])

  // Check if should show absen akhir modal (with fresh data)
  const shouldShowAkhirModal = useCallback(async () => {
    // Force fresh fetch — need newest absen status
    const freshData = await fetchAbsenData(true)

    if (!freshData) {
      return false
    }

    const akhirField = getAkhirField()
    const fieldValue = freshData[akhirField]

    return !fieldValue
  }, [fetchAbsenData, getAkhirField, actualRole])

  // Close modal handlers
  const handleAwalModalClose = useCallback(() => {
    setShowAwalModal(false)
  }, [])

  const handleAkhirModalClose = useCallback(() => {
    setShowAkhirModal(false)
  }, [])

  return {
    idIzin: finalIdIzin,
    showAwalModal,
    showAkhirModal,
    setShowAwalModal,
    setShowAkhirModal,
    absenData,
    isChecking,
    submitAbsenAwal,
    submitAbsenAkhir,
    shouldShowAkhirModal,
    handleAwalModalClose,
    handleAkhirModalClose,
    fetchAbsenData,
  }
}
