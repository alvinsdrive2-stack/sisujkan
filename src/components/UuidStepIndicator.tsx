interface UuidStepIndicatorProps {
  currentStep: number
  isVerifikasiPage?: boolean
}

const getSteps = () => [
  { number: 1, label: 'Konfirmasi\nData Diri' },
  { number: 2, label: 'APL 01' },
  { number: 3, label: 'APL 02' },
]

const getHeaderText = (isVerifikasiPage: boolean): string => {
  return isVerifikasiPage ? "Verifikasi TUK AJJ" : "Persiapan Asesmen"
}

export default function UuidStepIndicator({ currentStep, isVerifikasiPage }: UuidStepIndicatorProps) {
  const headerText = getHeaderText(isVerifikasiPage || false)

  // For verifikasi page, show only header (no steps)
  if (isVerifikasiPage) {
    return (
      <div style={{ padding: '20px 0 4px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '12px', textTransform: 'uppercase', textAlign: 'center' }}>
          {headerText}
        </div>
      </div>
    )
  }

  const steps = getSteps()

  return (
    <div>
      <div style={{
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '12px',
        textTransform: 'uppercase'
      }}>
        {headerText}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 0 4px', gap: '0',
      }}>
      {steps.map((step, idx) => {
        const status = step.number < currentStep ? 'completed'
          : step.number === currentStep ? 'active' : 'pending'
        const isLast = idx === steps.length - 1

        return (
          <div key={step.number} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: status === 'completed' ? '#4caf50'
                  : status === 'active' ? '#0066cc' : '#e0e0e0',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 'bold',
                border: status === 'active' ? '3px solid #0066cc' : 'none',
                boxShadow: status === 'active' ? '0 0 0 3px rgba(0,102,204,0.2)' : 'none',
              }}>
                {status === 'completed' ? '✓' : step.number}
              </div>
              <span style={{
                fontSize: '11px', color: status === 'pending' ? '#999' : '#333',
                fontWeight: status === 'pending' ? 'normal' : '600',
                textAlign: 'center', whiteSpace: 'pre-line', lineHeight: '1.3',
              }}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div style={{
                width: '80px', height: '2px',
                background: step.number < currentStep ? '#4caf50' : '#e0e0e0',
                margin: '0 8px', marginBottom: '28px',
              }} />
            )}
          </div>
        )
      })}
    </div>
    </div>
  )
}
