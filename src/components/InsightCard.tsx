import { ChevronRight, Lightbulb, Sprout, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DayProgress, Observation, ObservationTone } from '../types';
import { weekdayShort } from '../utils/date';
import { Card } from './ui/Card';
import { useTranslation } from '../i18n/useTranslation';

const toneIcon: Record<ObservationTone, typeof Sprout> = {
  positive: Sprout,
  neutral: TrendingUp,
  attention: Lightbulb,
};

const toneStyle: Record<ObservationTone, string> = {
  positive: 'bg-sage-wash text-forest-soft',
  neutral: 'bg-surface-sunk text-ink-soft',
  attention: 'bg-clay-soft text-clay',
};

export function InsightCard({ observation }: { observation: Observation }) {
  const Icon = toneIcon[observation.tone];

  return (
    <Card className="flex gap-3.5 px-4 py-4">
      <span
        aria-hidden="true"
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${toneStyle[observation.tone]}`}
      >
        <Icon size={18} strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <h3 className="text-[0.9375rem] font-medium text-ink">{observation.title}</h3>
        <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-soft">{observation.body}</p>
      </div>
    </Card>
  );
}

/** The compact teaser that sits at the bottom of the Routines tab. */
export function InsightTeaser({ title, body, to }: { title: string; body: string; to: string }) {
  return (
    <Link
      to={to}
      className="tap flex items-center gap-3.5 rounded-card bg-sage-wash px-4 py-4 transition-transform duration-150 active:scale-[0.99]"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest-soft"
      >
        <TrendingUp size={18} strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-soft">{body}</span>
      </span>
      <ChevronRight size={18} strokeWidth={1.7} aria-hidden="true" className="shrink-0 text-forest-soft" />
    </Link>
  );
}

/**
 * Weekly completion, drawn as plain bars. Each column carries its own numbers
 * for screen readers, so the shape is never the only way to read it.
 */
export function CompletionChart({ days }: { days: DayProgress[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-end justify-between gap-2" role="list" aria-label={t('insights.chartAria')}>
      {days.map((day) => {
        // A sliver of a bar always shows, so an empty day reads as "nothing
        // recorded" rather than as a rendering fault.
        const height = Math.max(day.percent, 4);
        return (
          <div
            key={day.date}
            role="listitem"
            aria-label={t('insights.chartDay', {
              day: weekdayShort(day.date),
              completed: day.completed,
              total: day.total,
            })}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-24 w-full items-end justify-center">
              <div
                className={`w-full max-w-[1.375rem] rounded-t-md transition-[height] duration-500 ease-out ${
                  day.percent >= 70 ? 'bg-forest' : day.percent > 0 ? 'bg-sage' : 'bg-beige'
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[0.6875rem] text-ink-faint">{weekdayShort(day.date)}</span>
          </div>
        );
      })}
    </div>
  );
}
