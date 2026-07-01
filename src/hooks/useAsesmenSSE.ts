import { useEffect, useRef, useState } from "react"
import { API_BASE_URL } from "@/config/api"

interface UseAsesmenSSEOptions {
  /** URL path suffix appended to API_BASE_URL, e.g. "/asesmen/{id}/sse" or "/praasesmen/{idIzin}/sse" */
  path: string
  /** Called whenever server pushes an update event */
  onUpdate: () => void
  /** Polling interval in ms (default 5000), used as fallback when SSE fails */
  pollingInterval?: number
}

export function useAsesmenSSE({ path, onUpdate, pollingInterval = 5000 }: UseAsesmenSSEOptions) {
  const esRef = useRef<EventSource | null>(null)
  const onUpdateRef = useRef(onUpdate)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [usePolling, setUsePolling] = useState(false)
  onUpdateRef.current = onUpdate

  // Start polling as fallback
  const startPolling = () => {
    if (pollIntervalRef.current) return

    // Initial call
    onUpdateRef.current()

    pollIntervalRef.current = setInterval(() => {
      onUpdateRef.current()
    }, pollingInterval)

    console.log(`[SSE] Fallback to polling every ${pollingInterval}ms`)
  }

  // Stop polling
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  useEffect(() => {
    if (!path) return

    // If SSE failed before, use polling
    if (usePolling) {
      startPolling()
      return () => stopPolling()
    }

    if (typeof EventSource === "undefined") {
      // Browser doesn't support EventSource, fallback to polling
      setUsePolling(true)
      return
    }

    const token = localStorage.getItem("access_token")
    const url = `${API_BASE_URL}${path}${token ? `?token=${token}` : ""}`

    let es: EventSource | null = null
    let connectionTimeout: NodeJS.Timeout | null = null
    let hasConnected = false

    // Set timeout to detect if SSE connection fails
    connectionTimeout = setTimeout(() => {
      if (!hasConnected) {
        console.log(`[SSE] Connection timeout, falling back to polling`)
        es?.close()
        setUsePolling(true)
      }
    }, 5000) // 5 seconds timeout

    try {
      es = new EventSource(url)
      esRef.current = es

      es.onopen = () => {
        hasConnected = true
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        console.log(`[SSE] Connected to ${path}`)
      }

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === "updated" || data.type === "asesor_saved") {
            console.log(`[SSE] Update event: ${data.type}`)
            onUpdateRef.current()
          }
        } catch {
          // non-JSON ping, ignore
        }
      }

      es.addEventListener("asesor_saved", () => onUpdateRef.current())
      es.addEventListener("asesi_saved", () => onUpdateRef.current())

      es.onerror = (err) => {
        console.warn("[SSE] Connection error, falling back to polling", err)
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        es?.close()
        setUsePolling(true)
      }
    } catch (err) {
      console.error("[SSE] Failed to create EventSource, falling back to polling", err)
      if (connectionTimeout) {
        clearTimeout(connectionTimeout)
        connectionTimeout = null
      }
      setUsePolling(true)
    }

    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout)
      }
      es?.close()
      esRef.current = null
      stopPolling()
    }
  }, [path, usePolling, pollingInterval])
}
