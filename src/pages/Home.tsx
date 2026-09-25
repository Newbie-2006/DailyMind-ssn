import { ArrowRight, ChevronRight, Sparkle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAppData, useDay } from '../hooks/useAppData';
import { formatDateWithWeekday, greetingFor, today } from '../utils/date';
import { firstName, initials } from '../utils/format';
import { mostRecent } from '../services/memoryService';
import { ProgressCard } from '../components/ProgressCard';
import { RoutineItem } from '../components/RoutineItem';
import { MemoryFeatureCard } from '../components/MemoryCard';
import { Card, CardLink, SectionTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ButtonLink } from '../components/ui/Button';

/** A quiet line that changes with the time of day. Never instructional. */
function contextualNote(hour: number, remaining: number): string {
  if (remaining === 0) return 'Everything on today is done. Rest easy.';
  if (hour < 12) return 'A calmer day starts with small steps.';
  if (hour < 17) return 'There is no hurry. The day is still yours.';
  return 'A gentle end to the day is enough.';
}

export function Home() {
  const { memories, settings } = useAppData();
  const date = today();
  const { occurrences, progress, toggleRoutine } = useDay(date);

  const now = new Date();
  const remaining = occurrences.filter((occurrence) => !occurrence.completed);
  const recent = useMemo(() => mostRecent(memories), [memories]);

  return (
    <div className="pb-8">
      <header className="safe-top px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.9375rem] text-ink-soft">{greetingFor(now)},</p>
            <h1 className="font-display text-[1.875rem] leading-tight tracking-[-0.015em] text-ink">
              {firstName(settings.name)}
            </h1>
            <p className="mt-1.5 text-[0.8125rem] text-ink-faint">{formatDateWithWeekday(date)}</p>
          </div>

          <Link
            to="/profile"
            aria-label="Open your profile"
            className="tap size-12 shrink-0 overflow-hidden rounded-full bg-sage-wash"
          >
            {settings.avatar ? (
              <img
                src={settings.avatar}
                alt=""
                className="size-full object-cover"
                decoding="async"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-[0.875rem] font-medium text-forest">
                {initials(settings.name)}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="space-y-6 px-5">
        <Card surface="sage" className="flex items-center gap-4 px-5 py-4">
          <p className="flex-1 font-display text-[1.0625rem] leading-snug text-forest-deep">
            {contextualNote(now.getHours(), remaining.length)}
          </p>
          <Sparkle
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
            className="shrink-0 text-sage"
          />
        </Card>

        <ProgressCard progress={progress} />

        <section>
          <SectionTitle
            action={
              <Link
                to="/routines"
                className="tap text-[0.8125rem] font-medium text-forest underline-offset-4 hover:underline"
              >
                See all
              </Link>
            }
          >
            Today&rsquo;s routine
          </SectionTitle>

          {occurrences.length === 0 ? (
            <Card className="px-2 py-2">
              <EmptyState
                icon={<Sparkle size={24} strokeWidth={1.5} />}
                title="Nothing scheduled"
                body="Add the things you would like to keep doing each day."
                action={<ButtonLink to="/routines/new">Add a routine</ButtonLink>}
              />
            </Card>
          ) : (
            <Card className="px-1.5 py-1.5">
              <ul>
                {occurrences.map((occurrence) => (
                  <li key={occurrence.routine.id}>
                    <RoutineItem
                      occurrence={occurrence}
                      onToggle={(routineId) => toggleRoutine(routineId, date)}
                      linkTo={`/routines/${occurrence.routine.id}`}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        <CardLink to="/assistant" surface="beige" className="flex items-center gap-4 px-5 py-4">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-forest"
          >
            <Sparkle size={19} strokeWidth={1.6} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-medium text-ink">Ask DailyMind</span>
            <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-soft">
              What do I need to do today?
            </span>
          </span>
          <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" className="shrink-0 text-forest" />
        </CardLink>

        {recent ? (
          <section>
            <SectionTitle
              action={
                <Link
                  to="/memories"
                  aria-label="See all memories"
                  className="tap inline-flex items-center gap-0.5 text-[0.8125rem] font-medium text-forest"
                >
                  All
                  <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                </Link>
              }
            >
              Recent memory
            </SectionTitle>
            <MemoryFeatureCard memory={recent} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
