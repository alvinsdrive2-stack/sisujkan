import { useNavigate } from "react-router-dom"
import React from 'react'

interface Step {
  number: number
  label: string
  href?: string
}

interface ModularStepIndicatorProps {
  currentStep: number
  steps: Step[]
  id?: string
  disableClick?: boolean
  title?: string
}

const ModularStepIndicator = React.memo(function ModularStepIndicator({ currentStep, steps, id, disableClick, title = 'Progress' }: ModularStepIndicatorProps) {
  const navigate = useNavigate()

  // Get the class name for the step circle based on status
  const getStepCircleClassName = (status: string) => {
    if (status === 'active') {
      return 'animate-blue-pulse'
    }
    return ''
  }

  const getHref = (href: string | undefined) => {
    if (!href) return undefined
    if (id && href.startsWith('/asesi/asesmen/')) {
      // Insert id after /asesi/asesmen/
      // Example: /asesi/asesmen/ia01 -> /asesi/asesmen/{id}/ia01
      const parts = href.split('/')
      // parts = ['', 'asesi', 'asesmen', 'ia01']
      if (parts[2] === 'asesmen') {
        parts.splice(3, 0, id)
        return parts.join('/')
      }
    }
    return href
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

  const handleStepClick = (step: Step) => {
    const href = getHref(step.href)
    if (href) navigate(href)
  }

  return (
    <div style={{
      position: 'sticky',
      top: '80px',
      width: '200px',
      flexShrink: 0
    }}>
      <br/>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '16px', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ position: 'relative' }}>
        {/* Vertical Line */}
        <div style={{
          position: 'absolute',
          left: '18px',
          top: '12px',
          bottom: '12px',
          width: '3px',
          background: '#ddd'
        }}></div>

        {/* Steps */}
        {steps.map((step, index) => {
          const status = getStepStatus(step.number)
          const style = getStepStyle(status)
          const stepHref = getHref(step.href)
          const isClickable = !disableClick && stepHref !== undefined

          return (
            <div
              key={step.number}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: index < steps.length - 1 ? '24px' : '0',
                position: 'relative',
                cursor: isClickable ? 'pointer' : 'not-allowed'
              }}
              onClick={() => isClickable && handleStepClick(step)}
              title={isClickable ? `Klik untuk ke ${step.label}` : undefined}
            >
              {/* Step Circle */}
              <div
                className={getStepCircleClassName(status)}
                style={{
                  width: '36px',
                  height: '36px',
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
                {status === 'completed' ? '\u2713' : step.number}
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
              {status !== 'pending' && index < steps.length - 1 && (
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
})

export default ModularStepIndicator
