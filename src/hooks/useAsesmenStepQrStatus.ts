import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { useDataDokumenAsesmen } from "@/hooks/useDataDokumenAsesmen"
import { useKegiatanByRole } from "@/hooks/useKegiatanByRole"
import { getAsesmenSteps } from "@/lib/asesmen-steps"
import { RoleId } from "@/lib/rbac-config"
import { API_BASE_URL } from "@/config/api"

export function useMissingStepsRedirect(idIzin: string | undefined, enabled = true) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { jenjang, metode } = useDataDokumenAsesmen(idIzin)
  const { kegiatan: _kegiatan } = useKegiatanByRole()
  const [checked, setChecked] = useState(false)

  const isAsesi = user?.role?.id === RoleId.ASESI

  const redirectToFirstMissing = useCallback(async () => {
    if (!idIzin || !isAsesi || !enabled) {
      setChecked(true)
      return
    }

    const token = localStorage.getItem("access_token")
    const headers = { Accept: "application/json", Authorization: `Bearer ${token}` }

    // Get steps for this jenjang/method
    const steps = getAsesmenSteps(jenjang, false, 'asesor_1', 0, metode, _kegiatan?.tahap)

    // IA05 is step index 4 or 5 depending on jenjang
    // Check all steps BEFORE ia05 (index < current ia05 index)
    const ia05Index = steps.findIndex(s => s.href.includes('ia05'))
    const stepsToCheck = ia05Index >= 0 ? steps.slice(0, ia05Index + 1) : steps

    // Build API path from client-side route
    // Client routes: /asesi/asesmen/{stepKey} or /asesi/asesmen/:id/{stepKey}
    // API endpoints: /asesmen/{idIzin}/{stepKey}
    const buildApiPath = (href: string) => {
      // Strip /asesi prefix, keep /asesmen/{...}
      const stripped = href.replace(/^\/asesi/, '')
      // Replace :id placeholder with actual idIzin
      return stripped.replace(':id', idIzin)
    }
    // Build navigation href (client-side route)
    const buildNavHref = (href: string) => href.replace(':id', idIzin).replace(':idIzin', idIzin)

    for (const step of stepsToCheck) {
      const navHref = buildNavHref(step.href)
      if (!navHref || !navHref.startsWith('/')) continue

      const apiPath = buildApiPath(step.href)

      try {
        const res = await fetch(`${API_BASE_URL}${apiPath}`, { headers })
        if (!res.ok) continue

        const json = await res.json()
        const data = json.data
        let filled = false

        if (data?.barcodes?.asesi?.url) {
          filled = true
        } else if (data?.asesi?.url) {
          filled = true
        } else if (data?.units) {
          // APL02, upload-tugas
          filled = data.units.some?.((u: any) =>
            u.subunits?.some?.((s: any) => !!s.barcodes?.asesi?.url)
          ) ?? false
        }

        if (!filled) {
          setChecked(true)
          navigate(navHref)
          return
        }
      } catch { /* continue */ }
    }

    setChecked(true)
  }, [idIzin, isAsesi, enabled, jenjang, metode, navigate, _kegiatan?.tahap])

  useEffect(() => {
    if (enabled && isAsesi && idIzin && jenjang) {
      redirectToFirstMissing()
    } else {
      setChecked(true)
    }
  }, [enabled, isAsesi, idIzin, jenjang])

  return { checked, recheck: redirectToFirstMissing }
}
