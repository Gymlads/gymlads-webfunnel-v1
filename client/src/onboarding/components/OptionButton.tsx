interface OptionButtonProps {
  selected?: boolean
  multi?: boolean
  onClick: () => void
  children: React.ReactNode
  /** Emoji links in het vlak. */
  icon?: string
}

export default function OptionButton({ selected, multi, onClick, children, icon }: OptionButtonProps) {
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
