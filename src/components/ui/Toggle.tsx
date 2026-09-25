export interface ToggleProps {
  checked: boolean;
  onChange(next: boolean): void;
  label: string;
  /** Renders the label visually; otherwise it is read by assistive tech only. */
  showLabel?: boolean;
  description?: string;
  disabled?: boolean;
}

/**
 * A switch, not a checkbox. State is carried by position *and* by the knob's
 * tick, so it never depends on colour alone.
 */
export function Toggle({
  checked,
  onChange,
  label,
  showLabel = false,
  description,
  disabled = false,
}: ToggleProps) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`tap relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40 ${
        checked ? 'bg-forest' : 'bg-beige-deep'
      }`}
    >
      <span
        className={`pointer-events-none absolute top-[3px] left-[3px] flex size-6 items-center justify-center rounded-full bg-surface shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0'
        }`}
      >
        {checked ? (
          <svg viewBox="0 0 12 12" className="size-3 text-forest" aria-hidden="true">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </button>
  );

  if (!showLabel) return control;

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="min-w-0">
        <span className="block text-[0.95rem] text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-faint">
            {description}
          </span>
        ) : null}
      </span>
      {control}
    </div>
  );
}
