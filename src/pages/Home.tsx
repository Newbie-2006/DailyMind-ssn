import { ArrowRight, Bell, ChevronRight, Sparkle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useAppData, useDay } from '../hooks/useAppData';
import { formatDateWithWeekday, timeOfDay, today } from '../utils/date';
import { firstName, initials } from '../utils/format';
import { mostRecent } from '../services/memoryService';
import { ProgressCard } from '../components/ProgressCard';
import { RoutineItem } from '../components/RoutineItem';
import { MemoryFeatureCard } from '../components/MemoryCard';
import { Card, CardLink, SectionTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ButtonLink, IconButton } from '../components/ui/Button';
import { BrandBar } from '../components/TopBar';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslateFn } from '../i18n/translate';

/** A quiet line that changes with the time of day. Never instructional. */
function contextualNote(now: Date, remaining: number, t: TranslateFn): string {
  if (remaining === 0) return t('home.note.allDone');
  const part = timeOfDay(now);
  if (part === 'morning') return t('home.note.morning');
  if (part === 'afternoon') return t('home.note.afternoon');
  return t('home.note.evening');
}

export function Home() {
  const { memories, settings } = useAppData();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const date = today();
  const { occurrences, progress, toggleRoutine } = useDay(date);

  const now = new Date();
  const remaining = occurrences.filter((occurrence) => !occurrence.completed);
  const recent = useMemo(() => mostRecent(memories), [memories]);

  return (
    <div className="pb-10">
      <BrandBar
        actions={
          <>
            <IconButton
              label={t('app.notificationsLabel')}
              onClick={() => navigate('/profile/notifications')}
            >
              <Bell size={20} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>

            <Link
              to="/profile"
              aria-label={t('home.openProfile')}
              className="tap size-9 shrink-0 overflow-hidden rounded-full bg-sage-wash"
            >
              {settings.avatar ? (
                <img
                  src={settings.avatar}
                  alt=""
                  className="size-full object-cover"
                  decoding="async"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-[0.75rem] font-medium text-forest">
                  {initials(settings.name)}
                </span>
              )}
            </Link>
          </>
        }
      />

      <div className="dm-gutter space-y-6 pt-6">
        <div>
          <h2 className="font-display text-[1.75rem] leading-tight tracking-[-0.015em] text-ink">
            {t(`home.greeting.${timeOfDay(now)}`)}, {firstName(settings.name)}
          </h2>
          <p className="mt-1.5 text-[0.875rem] text-ink-faint">{formatDateWithWeekday(date)}</p>
        </div>

        <Card surface="sage" className="flex items-center gap-4 px-5 py-4">
          <p className="flex-1 font-display text-[1.0625rem] leading-snug text-forest-deep">
            {contextualNote(now, remaining.length, t)}
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
                {t('common.seeAll')}
              </Link>
            }
          >
            {t('home.todaysRoutine')}
          </SectionTitle>

          {occurrences.length === 0 ? (
            <Card className="px-2 py-2">
              <EmptyState
                icon={<Sparkle size={24} strokeWidth={1.5} />}
                title={t('home.emptyRoutines.title')}
                body={t('home.emptyRoutines.body')}
                action={<ButtonLink to="/routines/new">{t('routines.addRoutine')}</ButtonLink>}
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
            <span className="block text-[0.9375rem] font-medium text-ink">
              {t('home.askTitle')}
            </span>
            <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-soft">
              {t('home.askHint')}
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
                  aria-label={t('assistant.reply.seeAllMemories')}
                  className="tap inline-flex items-center gap-0.5 text-[0.8125rem] font-medium text-forest"
                >
                  {t('common.all')}
                  <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                </Link>
              }
            >
              {t('home.recentMemory')}
            </SectionTitle>
            <MemoryFeatureCard memory={recent} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
