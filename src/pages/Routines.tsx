import { useMemo, useState } from 'react';
import { BellRing, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { occurrencesFor, progressFor } from '../services/routineService';
import { addDays, formatRelativeDay, monthLabel, today, weekOf } from '../utils/date';
import { pluralize } from '../utils/format';
import { LargeHeader } from '../components/PageHeader';
import { DateSelector } from '../components/DateSelector';
import { RoutineItem } from '../components/RoutineItem';
import { ProgressBar } from '../components/ProgressCard';
import { InsightTeaser } from '../components/InsightCard';
import { Card, SectionTitle } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useInsights } from '../hooks/useAppData';
import { useToast } from '../components/ui/toastContext';

export function Routines() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { routines, completions, reminders, actions } = useAppData();
  const insights = useInsights('week');

  const now = today();
  const [selected, setSelected] = useState(now);

  const week = useMemo(() => weekOf(selected), [selected]);
  const occurrences = useMemo(
    () => occurrencesFor(routines, completions, selected),
    [routines, completions, selected],
  );
  const progress = useMemo(
    () => progressFor(routines, completions, selected),
    [routines, completions, selected],
  );

  // A quiet dot under any day in view that still has something open.
  const pending = useMemo(() => {
    const set = new Set<string>();
    for (const date of week) {
      const dayProgress = progressFor(routines, completions, date);
      if (dayProgress.total > 0 && dayProgress.completed < dayProgress.total) set.add(date);
    }
    return set;
  }, [week, routines, completions]);

  const dayReminders = useMemo(
    () => reminders.filter((reminder) => reminder.date === selected),
    [reminders, selected],
  );

  return (
    <div className="pb-8">
      <LargeHeader
        title="Routines"
        actions={
          <>
            <IconButton label="Go to today" onClick={() => setSelected(now)}>
              <CalendarDays size={20} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>
            <IconButton label="Add a routine" tone="filled" onClick={() => navigate('/routines/new')}>
              <Plus size={20} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          </>
        }
      />

      <div className="space-y-6 px-5 pt-1">
        <section aria-label="Choose a day">
          <div className="mb-1.5 flex items-center justify-between">
            <IconButton
              label="Previous week"
              onClick={() => setSelected(addDays(selected, -7))}
              className="size-9"
            >
              <ChevronLeft size={18} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>
            <span className="text-[0.875rem] font-medium text-ink-soft">{monthLabel(selected)}</span>
            <IconButton
              label="Next week"
              onClick={() => setSelected(addDays(selected, 7))}
              className="size-9"
            >
              <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>
          </div>

          <DateSelector dates={week} selected={selected} onSelect={setSelected} pending={pending} />
        </section>

        <section>
          <SectionTitle
            action={
              progress.total > 0 ? (
                <span className="text-[0.8125rem] tabular-nums text-ink-soft">
                  {progress.completed} of {progress.total}
                </span>
              ) : undefined
            }
          >
            {formatRelativeDay(selected)}
          </SectionTitle>

          {progress.total > 0 ? <ProgressBar percent={progress.percent} className="mb-4" /> : null}

          {occurrences.length === 0 ? (
            <Card className="px-2 py-2">
              <EmptyState
                icon={<CalendarCheck size={24} strokeWidth={1.5} />}
                title="Nothing on this day"
                body="Routines you add will show up on the days they repeat."
                action={
                  <Button onClick={() => navigate('/routines/new')}>
                    <Plus size={17} strokeWidth={2} aria-hidden="true" />
                    Add routine
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card className="px-1.5 py-1.5">
              <ul>
                {occurrences.map((occurrence) => (
                  <li key={occurrence.routine.id}>
                    <RoutineItem
                      occurrence={occurrence}
                      onToggle={(routineId) => actions.toggleRoutine(routineId, selected)}
                      linkTo={`/routines/${occurrence.routine.id}`}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        {dayReminders.length > 0 ? (
          <section>
            <SectionTitle>Reminders</SectionTitle>
            <Card className="divide-y divide-line-soft">
              {dayReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-clay-soft text-clay"
                  >
                    <BellRing size={17} strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-ink">
                    {reminder.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      actions.deleteReminder(reminder.id);
                      notify('Reminder removed');
                    }}
                    className="tap min-h-10 shrink-0 rounded-full px-3 text-[0.8125rem] text-ink-soft active:bg-surface-sunk"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </Card>
          </section>
        ) : null}

        <section>
          <SectionTitle>Routine insights</SectionTitle>
          <InsightTeaser
            to="/insights"
            title={
              insights.morningPercent >= 70 ? 'Good consistency' : 'Your week so far'
            }
            body={
              insights.total === 0
                ? 'Once you have a few days recorded, patterns will show up here.'
                : `You have completed ${insights.morningPercent}% of your morning routines this week, across ${insights.days.length} ${pluralize(insights.days.length, 'day')}.`
            }
          />
        </section>
      </div>
    </div>
  );
}
