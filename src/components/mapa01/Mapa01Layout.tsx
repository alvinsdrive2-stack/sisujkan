import { ReactNode } from "react"

interface Mapa01LayoutProps {
  children: ReactNode
}

/**
 * Main layout wrapper for MAPA 01 form
 * Provides consistent styling and structure matching the PDF layout
 */
export function Mapa01Layout({ children }: Mapa01LayoutProps) {
  return (
    <div style={{
      maxWidth: '1000px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '12px',
      color: '#000',
      paddingBottom: '40px'
    }}>
      {children}
    </div>
  )
}
