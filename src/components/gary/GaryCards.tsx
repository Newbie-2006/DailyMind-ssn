import { Check, CircleDashed, Clock, ImageOff } from 'lucide-react';
import type { ISODate } from '../../types';
import { useAppData } from '../../hooks/useAppData';
import { occurrencesFor } from '../../services/routineService';
import type { GaryStrings } from '../../services/gary/text';
import { formatDateLong, formatTime, isPastTime, today } from '../../utils/date';
import { initials } from '../../utils/format';
import { RoutineIconGlyph } from '../RoutineIconGlyph';
import { MemoryImage } from '../MemoryImage';

/*
 * Large, simple cards: what Gary is talking about, on screen, so the person
 * can hear it and see it. Each card reads live data by id, so a routine
 * marked done a moment ago already shows its tick.
 */

const card = 'w-full rounded-card bg-surface shadow-soft';

export function ScheduleCard({ date, text }: { date: ISODate; text: GaryStrings }) {
  const { routines, completions } = useAppData();
  const occurrences = occurrencesFor(routines, completions, date);

  if (occurrences.length === 0) {
    return <div className={`${card} px-5 py-5 text-[1.0625rem] text-ink`}>{text.nothingToday}</div>;
  }

  return (
    <ul className={`${card} divide-y divide-line-soft px-2 py-1`}>
      {occurrences.map(({ routine, completed }) => {
        const label = completed
          ? text.doneLabel
          : isPastTime(routine.time)
            ? text.missedLabel
            : text.laterLabel;
        return (
          <li key={routine.id} className="flex min-h-16 items-center gap-3 px-3 py-2.5">
            <span
              aria-hidden="true"
              className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                completed ? 'bg-forest text-canvas' : 'bg-sage-wash text-forest-soft'
              }`}
            >
              {completed ? <Check size={20} strokeWidth={2.4} /> : <RoutineIconGlyph icon={routine.icon} size={20} />}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[1.0625rem] leading-snug ${
                  completed ? 'text-ink-soft line-through decoration-ink-faint' : 'text-ink'
                }`}
              >
                {routine.name}
              </span>
              <span className="block text-[0.875rem] text-ink-faint">{label}</span>
            </span>
            <span className="shrink-0 text-[1rem] font-medium tabular-nums text-ink-soft">
              {formatTime(routine.time)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function RoutineCard({
  routineId,
  text,
  onDone,
}: {
  routineId: string;
  text: GaryStrings;
  onDone(routineId: string): void;
}) {
  const { routines, completions } = useAppData();
  const routine = routines.find((r) => r.id === routineId);
  if (!routine) return null;

  const todays = occurrencesFor(routines, completions, today()).find(
    (o) => o.routine.id === routineId,
  );
  const completed = todays?.completed ?? false;

  return (
    <div className={`${card} px-5 py-5`}>
      <p className="text-[0.875rem] font-medium text-forest-soft">{completed ? text.doneLabel : text.nextUp}</p>
      <div className="mt-2 flex items-center gap-4">
        <span
          aria-hidden="true"
          className={`flex size-16 shrink-0 items-center justify-center rounded-full ${
            completed ? 'bg-forest text-canvas' : 'bg-sage-wash text-forest'
          }`}
        >
          {completed ? <Check size={30} strokeWidth={2.4} /> : <RoutineIconGlyph icon={routine.icon} size={30} />}
        </span>
        <div className="min-w-0">
          <p className="font-display text-[1.5rem] leading-tight text-ink">{routine.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[1.0625rem] text-ink-soft">
            <Clock size={17} strokeWidth={1.8} aria-hidden="true" />
            {formatTime(routine.time)}
          </p>
        </div>
      </div>
      {routine.note ? <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink">{routine.note}</p> : null}
      {todays && !completed ? (
        <button
          type="button"
          onClick={() => onDone(routine.id)}
          className="tap mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-sage-soft text-[1.0625rem] font-medium text-forest-deep active:scale-[0.98]"
        >
          <CircleDashed size={20} strokeWidth={2} aria-hidden="true" />
          {text.markDone}
        </button>
      ) : null}
    </div>
  );
}

export function MemoryCard({
  memoryId,
  text,
  onOpen,
}: {
  memoryId: string;
  text: GaryStrings;
  onOpen(memoryId: string): void;
}) {
  const { memories } = useAppData();
  const memory = memories.find((m) => m.id === memoryId);
  if (!memory) return null;

  return (
    <div className={`${card} overflow-hidden`}>
      {memory.image ? (
        <MemoryImage src={memory.image} alt={memory.title} className="aspect-[4/3] w-full" rounded="rounded-none" priority />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-sage-wash text-sage">
          <ImageOff size={32} strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
      <div className="px-5 pt-4 pb-5">
        <p className="font-display text-[1.5rem] leading-tight text-ink">{memory.title}</p>
        <p className="mt-1 text-[1rem] text-ink-soft">{formatDateLong(memory.date)}</p>
        {memory.people.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {memory.people.map((person) => (
              <li key={person} className="rounded-full bg-sage-wash px-3.5 py-1.5 text-[0.9375rem] text-forest-deep">
                {person}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="clamp-3 mt-3 text-[1.0625rem] leading-relaxed text-ink">{memory.description}</p>
        <button
          type="button"
          onClick={() => onOpen(memory.id)}
          className="tap mt-4 inline-flex min-h-12 items-center rounded-full bg-sage-soft px-5 text-[1rem] font-medium text-forest-deep active:scale-[0.98]"
        >
          {text.openMemory}
        </button>
      </div>
    </div>
  );
}

export function PersonCard({ memberId }: { memberId: string }) {
  const { family } = useAppData();
  const member = family.find((m) => m.id === memberId);
  if (!member) return null;

  return (
    <div className={`${card} flex items-center gap-4 px-5 py-5`}>
      <span className="size-20 shrink-0 overflow-hidden rounded-full bg-sage-wash">
        {member.photo ? (
          <img src={member.photo} alt="" className="size-full object-cover" decoding="async" />
        ) : (
          <span className="flex size-full items-center justify-center font-display text-[1.75rem] text-forest">
            {initials(member.name)}
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className="font-display text-[1.625rem] leading-tight text-ink">{member.name}</p>
        <p className="mt-0.5 text-[1.0625rem] text-ink-soft">{member.relation}</p>
        {member.notes ? <p className="mt-2 text-[1rem] leading-relaxed text-ink">{member.notes}</p> : null}
      </div>
    </div>
  );
}

/** The only path by which Gary changes saved data, and it is the person's tap or "yes". */
export function ConfirmCard({
  routineId,
  text,
  onAnswer,
}: {
  routineId: string;
  text: GaryStrings;
  onAnswer(answer: 'yes' | 'no'): void;
}) {
  const { routines } = useAppData();
  const routine = routines.find((r) => r.id === routineId);
  if (!routine) return null;

  return (
    <div role="group" aria-label={text.confirmQuestion(routine.name)} className={`${card} border-2 border-sage px-5 py-5`}>
      <p className="text-[1.25rem] leading-snug text-ink">{text.confirmQuestion(routine.name)}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onAnswer('yes')}
          className="tap inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-forest text-[1.25rem] font-semibold text-canvas active:scale-[0.98]"
        >
          <Check size={24} strokeWidth={2.4} aria-hidden="true" />
          {text.yes}
        </button>
        <button
          type="button"
          onClick={() => onAnswer('no')}
          className="tap inline-flex min-h-16 items-center justify-center rounded-2xl border-2 border-line bg-surface text-[1.25rem] font-semibold text-ink active:scale-[0.98]"
        >
          {text.no}
        </button>
      </div>
    </div>
  );
}
