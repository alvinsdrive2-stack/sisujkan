/**
 * CheckboxItem.tsx
 * Simple checkbox with label component
 */
import { CustomCheckbox } from "@/components/ui/Checkbox"

interface CheckboxItemProps {
  text: string
  inline?: boolean
}

export function CheckboxItem({ text, inline = false }: CheckboxItemProps) {
  if (inline) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'not-allowed', userSelect: 'none' }}>
        <CustomCheckbox checked={false} onChange={() => {}} disabled style={{ pointerEvents: 'none', opacity: 0.5 }} />
        <span style={{ fontSize: '12px', color: '#000' }}>{text}</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px', cursor: 'not-allowed', userSelect: 'none' }}>
      <CustomCheckbox checked={false} onChange={() => {}} disabled style={{ pointerEvents: 'none', opacity: 0.5 }} />
      <span style={{ fontSize: '12px', color: '#000', lineHeight: '1.4' }}>{text}</span>
    </div>
  )
}
