import { useMemo, useState } from 'react';
import { CalendarRange, Check, Clock, Pencil, Trash2 } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import { describeRepeat, occursOn } from '../services/routineService';
import { addDays, formatTime, today, weekdayShort } from '../utils/date';
import { percentOf, pluralize } from '../utils/format';
import { PageHeader } from '../components/PageHeader';
import { RoutineIconGlyph } from '../components/RoutineIconGlyph';
import { Button, IconButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/toastContext';

const HISTORY_DAYS = 14;

export function RoutineDetails() {
  const { routineId } = useParams<{ routineId: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { routines, completions, actions } = useAppData();

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const routine = routines.find((item) => item.id === routineId);
  const date = today();

  const history = useMemo(() => {
    if (!routine) return [];
    return Array.from({ length: HISTORY_DAYS }, (_, index) => {
      const day = addDays(date, index - (HISTORY_DAYS - 1));
      return {
        date: day,
        scheduled: occursOn(routine, day),
        completed: (completions[day] ?? []).includes(routine.id),
      };
    });
  }, [routine, completions, date]);

  if (!routine) return <Navigate to="/routines" replace />;

  const scheduledDays = history.filter((day) => day.scheduled);
  const completedDays = scheduledDays.filter((day) => day.completed);
  const completedToday = (completions[date] ?? []).includes(routine.id);
  const dueToday = occursOn(routine, date);

  const removeRoutine = () => {
    actions.deleteRoutine(routine.id);
    setConfirmingDelete(false);
    notify('Routine deleted');
    navigate('/routines', { replace: true });
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={routine.name}
        onBack
        fallbackTo="/routines"
        actions={
          <>
            <IconButton
              label="Edit routine"
              onClick={() => navigate(`/routines/${routine.id}/edit`)}
            >
              <Pencil size={18} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>
            <IconButton label="Delete routine" onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={18} strokeWidth={1.8} aria-hidden="true" />
            </IconButton>
          </>
        }
      />

      <div className="space-y-6 px-5 pt-2">
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
          >
            <RoutineIconGlyph icon={routine.icon} size={24} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[1.5rem] leading-tight tracking-[-0.015em] text-ink">
              {routine.name}
            </h2>
            <p className="mt-0.5 text-[0.875rem] text-ink-soft">{formatTime(routine.time)}</p>
          </div>
        </div>

        {routine.note ? (
          <Card surface="beige" className="px-4 py-3.5">
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{routine.note}</p>
          </Card>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Card className="px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-[0.8125rem] text-ink-faint">
              <Clock size={14} strokeWidth={1.7} aria-hidden="true" />
              Time
            </p>
            <p className="mt-1 text-[0.9375rem] text-ink">{formatTime(routine.time)}</p>
          </Card>
          <Card className="px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-[0.8125rem] text-ink-faint">
              <CalendarRange size={14} strokeWidth={1.7} aria-hidden="true" />
              Repeats
            </p>
            <p className="mt-1 text-[0.9375rem] text-ink">{describeRepeat(routine)}</p>
          </Card>
        </div>

        {dueToday ? (
          <Button
            size="lg"
            variant={completedToday ? 'secondary' : 'primary'}
            onClick={() => actions.toggleRoutine(routine.id, date)}
          >
            {completedToday ? (
              <>
                <Check size={18} strokeWidth={2.2} aria-hidden="true" />
                Completed today
              </>
            ) : (
              'Mark as done today'
            )}
          </Button>
        ) : (
          <p className="text-center text-[0.875rem] text-ink-faint">
            Not scheduled for today.
          </p>
        )}

        <section>
          <h3 className="mb-3 text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
            Last two weeks
          </h3>

          <Card className="px-4 py-4">
            <p className="text-[0.875rem] text-ink-soft">
              Completed on {completedDays.length} of {scheduledDays.length}{' '}
              {pluralize(scheduledDays.length, 'scheduled day')} (
              {percentOf(completedDays.length, scheduledDays.length)}%).
            </p>

            <ul className="mt-3.5 flex justify-between gap-1">
              {history.map((day) => (
                <li key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                  <span
                    title={day.date}
                    aria-label={`${day.date}: ${
                      !day.scheduled ? 'not scheduled' : day.completed ? 'completed' : 'not completed'
                    }`}
                    className={`flex h-7 w-full max-w-[1.125rem] items-center justify-center rounded-md ${
                      !day.scheduled
                        ? 'bg-surface-sunk'
                        : day.completed
                          ? 'bg-forest text-canvas'
                          : 'bg-beige-deep'
                    }`}
                  >
                    {day.scheduled && day.completed ? (
                      <Check size={11} strokeWidth={3} aria-hidden="true" />
                    ) : null}
                  </span>
                  {day.date === date ? (
                    <span className="text-[0.5625rem] text-forest">{weekdayShort(day.date)}</span>
                  ) : (
                    <span className="text-[0.5625rem] text-ink-faint">{weekdayShort(day.date)}</span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete this routine?"
        description="It will be removed from your days, along with its completion history."
        actions={
          <>
            <Button size="lg" onClick={removeRoutine}>
              Delete routine
            </Button>
            <Button size="lg" variant="quiet" onClick={() => setConfirmingDelete(false)}>
              Keep it
            </Button>
          </>
        }
      />
    </div>
  );
}
