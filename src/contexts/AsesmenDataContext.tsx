import { createContext, useContext } from "react"

// Contexts for gate-provided data — hooks check these before fetching
export const DokumenAsesmenCtx = createContext<any | null>(null)
export const DokumenPraAsesmenCtx = createContext<any | null>(null)

export function useDokumenAsesmenCtx() {
  return useContext(DokumenAsesmenCtx)
}

export function useDokumenPraAsesmenCtx() {
  return useContext(DokumenPraAsesmenCtx)
}
