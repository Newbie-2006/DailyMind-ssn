import type { DayProgress } from '../types';
import { Card } from './ui/Card';

export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-beige ${className}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Routine completion"
    >
      <div
        className="h-full rounded-full bg-forest transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function ProgressCard({ progress }: { progress: DayProgress }) {
  const { completed, total, percent } = progress;

  return (
    <Card className="px-5 py-4.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
          Today&rsquo;s progress
        </h2>
        <span className="text-[1.0625rem] font-medium tabular-nums text-forest">{percent}%</span>
      </div>

      <p className="mt-1 text-[0.875rem] text-ink-soft">
        {total === 0 ? 'Nothing scheduled today' : `${completed} of ${total} completed`}
      </p>

      <ProgressBar percent={percent} className="mt-3.5" />
    </Card>
  );
}
