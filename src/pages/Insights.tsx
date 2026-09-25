import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import type { InsightRange } from '../types';
import { useAppData, useInsights } from '../hooks/useAppData';
import { currentStreak } from '../services/insightsService';
import { formatDate, today } from '../utils/date';
import { pluralize } from '../utils/format';
import { PageHeader } from '../components/PageHeader';
import { CompletionChart, InsightCard } from '../components/InsightCard';
import { Card, SectionTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

const ranges: { id: InsightRange; label: string }[] = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'Four weeks' },
];

export function Insights() {
  const [range, setRange] = useState<InsightRange>('week');
  const insights = useInsights(range);
  const { routines, completions } = useAppData();
  const streak = currentStreak(routines, completions);

  // Four weeks of bars would be unreadable on a phone, so the chart always
  // shows the seven most recent days of the selected range.
  const chartDays = insights.days.slice(-7);

  // The totals cover elapsed days only, so the label should stop there too.
  const lastCounted =
    [...insights.days].reverse().find((day) => day.date <= today())?.date ?? insights.range.end;

  return (
    <div className="pb-10">
      <PageHeader
        title="Insights"
        onBack
        fallbackTo="/routines"
        actions={
          <div className="relative mr-1">
            <label htmlFor="insight-range" className="sr-only">
              Choose a period
            </label>
            <select
              id="insight-range"
              value={range}
              onChange={(event) => setRange(event.target.value as InsightRange)}
              className="tap min-h-10 appearance-none rounded-full bg-surface-sunk py-2 pr-9 pl-4 text-[0.8125rem] text-ink focus:outline-none"
            >
              {ranges.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-soft"
            />
          </div>
        }
      />

      {insights.total === 0 ? (
        <EmptyState
          icon={<Info size={24} strokeWidth={1.5} />}
          title="Nothing to show yet"
          body="Once you have recorded a few days of routines, DailyMind will describe what it notices."
        />
      ) : (
        <div className="space-y-6 px-5 pt-2">
          <Card className="px-5 py-4.5">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-[0.8125rem] text-ink-faint">Completed</p>
                <p className="mt-0.5 font-display text-[1.75rem] leading-none text-ink">
                  {insights.percent}%
                </p>
              </div>
              <p className="text-right text-[0.8125rem] leading-relaxed text-ink-soft">
                {insights.completed} of {insights.total} routines
                <br />
                {formatDate(insights.range.start)} - {formatDate(lastCounted)}
              </p>
            </div>
          </Card>

          {insights.observations.map((observation) => (
            <InsightCard key={observation.id} observation={observation} />
          ))}

          <section>
            <SectionTitle>Routine completion</SectionTitle>
            <Card className="px-4 py-5">
              <CompletionChart days={chartDays} />
            </Card>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <Card className="px-4 py-4">
              <p className="text-[0.8125rem] text-ink-faint">Mornings</p>
              <p className="mt-1 font-display text-[1.375rem] leading-none text-ink">
                {insights.morningPercent}%
              </p>
              <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink-soft">
                of morning routines completed
              </p>
            </Card>
            <Card className="px-4 py-4">
              <p className="text-[0.8125rem] text-ink-faint">Full days</p>
              <p className="mt-1 font-display text-[1.375rem] leading-none text-ink">{streak}</p>
              <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink-soft">
                {pluralize(streak, 'day')} in a row with everything done
              </p>
            </Card>
          </div>

          <p className="flex items-start gap-2 px-1 text-[0.8125rem] leading-relaxed text-ink-faint">
            <Info size={14} strokeWidth={1.7} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              These are plain observations from what you have recorded. They describe your routine,
              not your health.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
