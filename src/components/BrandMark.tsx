/**
 * The DailyMind mark: a sprout, drawn from the same palette as the rest of the
 * app. Inline SVG so it costs no request and inherits the theme's colours.
 */
export function BrandMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-[0.5rem] bg-forest ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 32 32" width={size * 0.64} height={size * 0.64} fill="none">
        <path
          d="M16 25V14"
          stroke="var(--color-canvas)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M16 15.5c-.3-3.8-2.9-6.4-6.6-6.8-.3 3.9 2.3 6.6 6.6 6.8Z"
          fill="var(--color-sage)"
        />
        <path
          d="M16 18.5c.2-4.5 3.1-7.7 7.4-8.2.4 4.6-2.5 7.9-7.4 8.2Z"
          fill="var(--color-sage-soft)"
        />
      </svg>
    </span>
  );
}
