import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { RoleId } from "@/lib/rbac-config"

interface Step {
  number: number
  label: string
}

interface AsesiStepIndicatorProps {
  currentStep: number
  idIzin?: string
  tahap?: number
  flow?: 'praasesmen' | 'perjanjian'
  showVerifikasiTukAjj?: boolean
}

const PRAASESMEN_STEPS: Step[] = [
  { number: 1, label: 'Konfirmasi' },
  { number: 2, label: 'APL 01' },
  { number: 3, label: 'APL 02' },
]

const PERJANJIAN_STEPS: Step[] = [
  { number: 1, label: 'AK.01' },
]

// Step paths relative to idIzin
const getPraasesmenPath = (stepNumber: number, idIzin?: string): string | null => {
  if (!idIzin) return null
  const paths: Record<number, string | null> = {
    1: `/asesi/praasesmen/${idIzin}`,
    2: `/asesi/praasesmen/${idIzin}/apl01`,
    3: `/asesi/praasesmen/${idIzin}/apl02`,
  }
  return paths[stepNumber] || null
}

const getPerjanjianPath = (stepNumber: number, idIzin?: string): string | null => {
  if (!idIzin) return null
  const paths: Record<number, string | null> = {
    1: `/asesi/perjanjian/${idIzin}/ak01`,
    2: null, // Selesai
  }
  return paths[stepNumber] || null
}

export default function AsesiStepIndicator({ currentStep, idIzin, tahap, flow = 'praasesmen', showVerifikasiTukAjj }: AsesiStepIndicatorProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAsesor = user?.role?.id === RoleId.ASESOR

  const steps = flow === 'perjanjian' ? PERJANJIAN_STEPS : PRAASESMEN_STEPS

  // For tahap 0: hide Konfirmasi(1)
  const isTahap0 = tahap === 0
  const visibleSteps = (flow === 'praasesmen' && isTahap0)
    ? steps.filter(s => s.number >= 2)
    : steps

  // Get the class name for the step circle based on status
  const getStepCircleClassName = (status: string) => {
    if (status === 'active') {
      return 'animate-blue-pulse'
    }
    return ''
  }

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed'
    if (stepNumber === currentStep) return 'active'
    return 'pending'
  }

  const getStepStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          background: '#4caf50',
          iconColor: '#fff',
          borderColor: '#4caf5000'
        }
      case 'active':
        return {
          background: '#0066cc',
          iconColor: '#fff',
          borderColor: '#0066cc'
        }
      default:
        return {
          background: '#f5f5f5',
          iconColor: '#aaa',
          borderColor: '#ddd'
        }
    }
  }

  return (
    <div style={{
      position: 'sticky',
      top: '80px',
      width: '180px',
      flexShrink: 0
    }}>
      <br/>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '16px', textTransform: 'uppercase' }}>
        {showVerifikasiTukAjj ? 'Verifikasi TUK AJJ' : flow === 'perjanjian' ? 'Perjanjian Asesmen' : 'Pra-Asesmen'}
      </div>
      <div style={{ position: 'relative' }}>
        {/* Vertical Line */}
        <div style={{
          position: 'absolute',
          left: '14px',
          top: '12px',
          bottom: '12px',
          width: '3px',
          background: '#ddd'
        }}></div>

        {/* Steps */}
        {visibleSteps.map((step, index) => {
          const displayNumber = isTahap0 ? index + 1 : step.number
          const status = getStepStatus(step.number)
          const style = getStepStyle(status)
          const stepPath = flow === 'perjanjian'
            ? getPerjanjianPath(step.number, idIzin)
            : getPraasesmenPath(step.number, idIzin)
          const isClickable = isAsesor && stepPath !== null

          return (
            <div
              key={step.number}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: index < visibleSteps.length - 1 ? '24px' : '0',
                position: 'relative',
                cursor: isClickable ? 'pointer' : 'not-allowed'
              }}
              onClick={() => isClickable && stepPath && navigate(stepPath)}
              title={isClickable ? `Klik untuk ke ${step.label}` : undefined}
            >
              {/* Step Circle */}
              <div
                className={getStepCircleClassName(status)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: style.background,
                  color: style.iconColor,
                  border: '3px solid',
                  borderColor: status === 'completed' ? '#4caf50' : style.borderColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: status === 'pending' ? 'normal' : 'bold',
                  flexShrink: 0,
                  zIndex: 1,
                  transition: isClickable ? 'transform 0.2s ease, box-shadow 0.2s ease' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {status === 'completed' ? '✓' : displayNumber}
              </div>
              {/* Label */}
              <span style={{
                marginLeft: '14px',
                fontSize: '14px',
                color: '#333',
                fontWeight: status === 'pending' ? 'normal' : '600',
                paddingTop: '6px'
              }}>
                {step.label}
              </span>
              {/* Completed Line Segment */}
              {status !== 'pending' && index < visibleSteps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '18px',
                  top: '36px',
                  width: '3px',
                  height: 'calc(100% - 36px)',
                  background: '#0066cc',
                  zIndex: 0
                }}></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
