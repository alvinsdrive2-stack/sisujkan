import { useEffect, useState, useRef, useCallback } from "react"
import { ASESOR_SIGNATURE_POLLING_INTERVAL_MS } from "@/lib/polling-config"

interface BarcodeData {
  url: string
  tanggal: string
  nama: string
}

// Old format: { asesor1?: BarcodeData, asesor2?: BarcodeData }
// New format: { asesor?: Record<string, BarcodeData> }
interface Barcodes {
  asesi?: BarcodeData | null
  asesor1?: BarcodeData | null
  asesor2?: BarcodeData | null
  asesor?: Record<string, BarcodeData>
}

interface UseAsesorSignaturePollingOptions {
  fetchDataFn: () => Promise<void>
  isAsesor: boolean
  barcodes: Barcodes | null
  asesorCount: number
  intervalMs?: number
}

interface UseAsesorSignaturePollingResult {
  allAsesorSigned: boolean
  missingAsesorLabels: string[]
}

function checkAsesorSigned(
  barcodes: Barcodes | null,
  asesorIndex: number
): boolean {
  if (!barcodes) return false

  const key = asesorIndex === 0 ? "asesor1" : "asesor2"

  // Check old format
  if (barcodes[key]?.url) return true

  // Check new format: asesor Record<string, BarcodeData>
  if (barcodes.asesor) {
    const asesorKeys = Object.keys(barcodes.asesor)
    if (asesorKeys.length > asesorIndex) {
      const asesorKey = asesorKeys[asesorIndex]
      if (barcodes.asesor[asesorKey]?.url) return true
    }
    // Also check by string key "asesor1"/"asesor2" in Record
    if (barcodes.asesor[key]?.url) return true
  }

  return false
}

export function useAsesorSignaturePolling({
  fetchDataFn,
  isAsesor,
  barcodes,
  asesorCount,
  intervalMs = ASESOR_SIGNATURE_POLLING_INTERVAL_MS,
}: UseAsesorSignaturePollingOptions): UseAsesorSignaturePollingResult {
  const [allAsesorSigned, setAllAsesorSigned] = useState(false)
  const [missingAsesorLabels, setMissingAsesorLabels] = useState<string[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetchDataRef = useRef(fetchDataFn)

  fetchDataRef.current = fetchDataFn

  // Compute signed status
  const computeStatus = useCallback(() => {
    if (isAsesor || asesorCount === 0) {
      setAllAsesorSigned(true)
      setMissingAsesorLabels([])
      return
    }

    const missing: string[] = []

    const asesor1Signed = checkAsesorSigned(barcodes, 0)
    if (!asesor1Signed) missing.push("Asesor 1")

    if (asesorCount >= 2) {
      const asesor2Signed = checkAsesorSigned(barcodes, 1)
      if (!asesor2Signed) missing.push("Asesor 2")
    }

    const allSigned = missing.length === 0
    setAllAsesorSigned(allSigned)
    setMissingAsesorLabels(missing)

    return allSigned
  }, [isAsesor, barcodes, asesorCount])

  // Update signed status when barcodes change
  useEffect(() => {
    computeStatus()
  }, [computeStatus])

  // Polling: re-fetch data every intervalMs when asesi and not all signed
  useEffect(() => {
    if (isAsesor || allAsesorSigned) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const startPolling = () => {
      if (intervalRef.current) return

      intervalRef.current = setInterval(async () => {
        if (document.visibilityState !== "visible") return
        await fetchDataRef.current()
      }, intervalMs)
    }

    startPolling()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAsesor, allAsesorSigned, intervalMs])

  return { allAsesorSigned, missingAsesorLabels }
}
