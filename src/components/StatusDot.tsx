export type StatusTone = 'active' | 'stale' | 'off' | 'error';

const tones: Record<StatusTone, string> = {
  active: 'bg-sage',
  stale: 'bg-clay',
  off: 'bg-beige-deep',
  error: 'bg-clay',
};

/**
 * The small status light beside a sharing state. It is always paired with words
 * - the dot repeats the meaning, it never carries it alone.
 */
export function StatusDot({ tone, className = '' }: { tone: StatusTone; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-2.5 shrink-0 rounded-full ${tones[tone]} ${className}`}
    />
  );
}
