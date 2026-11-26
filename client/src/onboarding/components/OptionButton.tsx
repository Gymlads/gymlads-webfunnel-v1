interface OptionButtonProps {
  selected?: boolean
  multi?: boolean
  onClick: () => void
  children: React.ReactNode
  /** Emoji links in het vlak. */
  icon?: string
  /** Niet te kiezen (bv. al genoeg dagen gekozen) */
  disabled?: boolean
}

export default function OptionButton({ selected, multi, onClick, children, icon, disabled }: OptionButtonProps) {
  const selectedClass = selected
    ? multi
      ? ' onboarding__option--border-selected'
      : ' onboarding__option--selected'
    : ''

  return (
    <button
      type="button"
      className={`onboarding__option${icon ? ' onboarding__option--icon' : ''}${selectedClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && (
        <span className="onboarding__option-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="onboarding__option-label">{children}</span>
    </button>
  )
}
