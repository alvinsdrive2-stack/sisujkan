import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config/api"

interface StepDef {
  stepKey: string
  label: string
  href: string
}

interface StepCheck extends StepDef {
  filled: boolean
}

interface UseTahapStepCheckOptions {
  /** tahap 1 = praasesmen, tahap 2 = asesmen */
  tahap: number
  /** id_izin for praasesmen, or jadwal_id for asesmen */
  idIzin: string | undefined
  /** Replace :id in href (for asesmen steps) */
  replaceId?: string
  /** jenjang ID for dynamic tahap 2 steps */
  jenjang?: string
  /** methode for dynamic tahap 2 steps */
  metode?: string
}

interface UseTahapStepCheckReturn {
  redirectStep: StepCheck | null
  isLoading: boolean
  checked: boolean
}

function hasBarcode(data: any): boolean {
  if (!data) return false
  if (data.units?.some) {
    return data.units.some((u: any) =>
      u.subunits?.some?.((s: any) => !!s.barcodes?.asesi?.url)
    )
  }
  if (data.barcodes?.asesi?.url) return true
  if (data.asesi?.url) return true
  return false
}

function getTahapSteps(tahap: number, jenjang?: string, metode?: string): StepDef[] {
  if (tahap === 1) {
    return [
      { stepKey: 'apl01', label: 'APL 01', href: '/praasesmen/:idIzin/apl01' },
      { stepKey: 'apl02', label: 'APL 02', href: '/praasesmen/:idIzin/apl02' },
      { stepKey: 'mapa01', label: 'MAPA 01', href: '/praasesmen/:idIzin/mapa01' },
      { stepKey: 'mapa02', label: 'MAPA 02', href: '/praasesmen/:idIzin/mapa02' },
      { stepKey: 'ak07', label: 'AK.07', href: '/praasesmen/:idIzin/ak07' },
      { stepKey: 'ak04', label: 'AK.04', href: '/praasesmen/:idIzin/ak04' },
      { stepKey: 'k3', label: 'Tata Tertib dan K3', href: '/praasesmen/:idIzin/k3-asesmen' },
    ]
  }

  // Dynamic tahap 2 steps based on jenjang and methode
  const jenjangId = parseInt(jenjang || "0")
  const isLowJenjang = jenjangId < 4
  const isPortofolio = metode?.toLowerCase() === 'portofolio'

  if (isPortofolio) {
    return [
      { stepKey: 'ak01', label: 'AK.01', href: '/asesmen/:id/ak01' },
      { stepKey: 'ia08', label: 'IA.08', href: '/asesmen/:id/ia08' },
      { stepKey: 'ia09', label: 'IA.09', href: '/asesmen/:id/ia09' },
      { stepKey: 'ia10', label: 'IA.10', href: '/asesmen/:id/ia10' },
      { stepKey: 'ak02', label: 'AK.02', href: '/asesmen/:id/ak02' },
      { stepKey: 'ak03', label: 'AK.03', href: '/asesmen/:id/ak03' },
    ]
  }

  if (isLowJenjang) {
    return [
      { stepKey: 'ak01', label: 'AK.01', href: '/asesmen/:id/ak01' },
      { stepKey: 'ia01', label: 'IA.01', href: '/asesmen/:id/ia01' },
      { stepKey: 'ia02', label: 'IA.02', href: '/asesmen/:id/ia02' },
      { stepKey: 'ia03', label: 'IA.03', href: '/asesmen/:id/ia03' },
      { stepKey: 'upload-tugas', label: 'Upload Tugas', href: '/asesmen/:id/upload-tugas' },
      { stepKey: 'ia05', label: 'IA.05', href: '/asesmen/:id/ia05' },
      { stepKey: 'ak02', label: 'AK.02', href: '/asesmen/:id/ak02' },
      { stepKey: 'ak03', label: 'AK.03', href: '/asesmen/:id/ak03' },
    ]
  }

  // Default: full jenjang
  return [
    { stepKey: 'ak01', label: 'AK.01', href: '/asesmen/:id/ak01' },
    { stepKey: 'ia04a', label: 'IA.04.A', href: '/asesmen/:id/ia04a' },
    { stepKey: 'upload-tugas', label: 'Upload Tugas', href: '/asesmen/:id/upload-tugas' },
    { stepKey: 'ia04b', label: 'IA.04.B', href: '/asesmen/:id/ia04b' },
    { stepKey: 'ia05', label: 'IA.05', href: '/asesmen/:id/ia05' },
    { stepKey: 'ak02', label: 'AK.02', href: '/asesmen/:id/ak02' },
    { stepKey: 'ak03', label: 'AK.03', href: '/asesmen/:id/ak03' },
  ]
}

export function useTahapStepCheck({
  tahap,
  idIzin,
  replaceId,
  jenjang,
  metode,
}: UseTahapStepCheckOptions): UseTahapStepCheckReturn {
  const navigate = useNavigate()
  const [redirectStep, setRedirectStep] = useState<StepCheck | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  const runCheck = useCallback(async () => {
    if (!idIzin) {
      setChecked(true)
      return
    }
    if (tahap === 2 && !jenjang) {
      // Wait for jenjang to load
      return
    }

    setIsLoading(true)
    setChecked(false)

    const token = localStorage.getItem("access_token")
    const headers = { Accept: "application/json", Authorization: `Bearer ${token}` }
    const steps = getTahapSteps(tahap, jenjang, metode)
    const resolvedId = tahap === 1 ? idIzin : (replaceId || idIzin)

    let cancelled = false

    // Fire all step checks in parallel
    const results = await Promise.allSettled(
      steps.map(async (step) => {
        const apiPath = tahap === 1
          ? `/praasesmen/${idIzin}/${step.stepKey}`
          : `/asesmen/${resolvedId}/${step.stepKey}`

        const res = await fetch(`${API_BASE_URL}${apiPath}`, { headers })
        if (!res.ok) return { step, filled: false }
        const json = await res.json()
        return { step, filled: hasBarcode(json.data) }
      })
    )

    if (cancelled) return

    // Find first unfilled step (in step order)
    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      const { step, filled } = result.value
      if (!filled) {
        const finalHref = step.href.replace(':id', resolvedId).replace(':idIzin', idIzin)
        setRedirectStep({ ...step, href: finalHref, filled: false })
        setIsLoading(false)
        setChecked(true)
        navigate(`/asesi${finalHref}`)
        return
      }
    }

    setRedirectStep(null)
    setIsLoading(false)
    setChecked(true)
  }, [tahap, idIzin, replaceId, jenjang, metode])

  useEffect(() => {
    runCheck()
  }, [runCheck])

  return { redirectStep, isLoading, checked }
}
