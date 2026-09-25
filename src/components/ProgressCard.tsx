import type { DayProgress } from '../types';
import { Card } from './ui/Card';
import { useTranslation } from '../i18n/useTranslation';

export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-beige ${className}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t('progress.ariaLabel')}
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
  const { t } = useTranslation();

  return (
    <Card className="px-5 py-4.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
          {t('progress.title')}
        </h2>
        <span className="text-[1.0625rem] font-medium tabular-nums text-forest">{percent}%</span>
      </div>

      <p className="mt-1 text-[0.875rem] text-ink-soft">
        {total === 0
          ? t('progress.nothingScheduled')
          : t('progress.completedOf', { completed, total })}
      </p>

      <ProgressBar percent={percent} className="mt-3.5" />
    </Card>
  );
}
