import type { ComponentType } from 'react'

interface OptionButtonProps {
  selected?: boolean
  multi?: boolean
  onClick: () => void
  children: React.ReactNode
  /** Lijn-icoon (Lucide) links in het vlak; wit, lime als gekozen. */
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}

export default function OptionButton({ selected, multi, onClick, children, icon: Icon }: OptionButtonProps) {
  const selectedClass = selected
    ? multi
      ? ' onboarding__option--border-selected'
      : ' onboarding__option--selected'
    : ''

  return (
    <button
      type="button"
      className={`onboarding__option${Icon ? ' onboarding__option--icon' : ''}${selectedClass}`}
      onClick={onClick}
    >
      {Icon && <Icon size={24} strokeWidth={1.75} className="onboarding__option-icon" />}
      <span className="onboarding__option-label">{children}</span>
    </button>
  )
}
