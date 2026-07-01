import { CustomCheckbox } from "@/components/ui/Checkbox"

interface CheckboxGroupProps {
  items: string[]
  ml?: number
}

/**
 * Reusable checkbox group component
 * Used for static checkbox sections in the form
 */
export function CheckboxGroup({ items, ml = 0 }: CheckboxGroupProps) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #000',
      padding: '10px 15px',
      marginBottom: '16px',
      marginLeft: ml ? `${ml}px` : 0
    }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', cursor: 'not-allowed', userSelect: 'none' }}>
          <CustomCheckbox checked={false} onChange={() => {}} disabled style={{ pointerEvents: 'none', opacity: 0.5 }} />
          <span style={{ fontSize: '12px', color: '#000' }}>{item}</span>
        </div>
      ))}
    </div>
  )
}
