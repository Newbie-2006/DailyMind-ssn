import type { ISODate } from '../types';
import { dayOfMonth, formatDateLong, today, weekdayShort } from '../utils/date';

export interface DateSelectorProps {
  dates: ISODate[];
  selected: ISODate;
  onSelect(date: ISODate): void;
  /** Days that have at least one routine still open, shown as a quiet dot. */
  pending?: Set<ISODate>;
}

/** The week strip at the top of Routines. */
export function DateSelector({ dates, selected, onSelect, pending }: DateSelectorProps) {
  const now = today();

  return (
    <div className="flex justify-between gap-1" role="group" aria-label="Choose a day">
      {dates.map((date) => {
        const isSelected = date === selected;
        const isToday = date === now;
        const hasPending = pending?.has(date) ?? false;

        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            aria-pressed={isSelected}
            aria-label={formatDateLong(date)}
            className="tap flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl py-1.5"
          >
            <span
              className={`text-[0.6875rem] ${isSelected ? 'text-forest' : 'text-ink-faint'}`}
            >
              {weekdayShort(date)}
            </span>

            <span
              className={`flex size-9 items-center justify-center rounded-full text-[0.875rem] tabular-nums transition-colors duration-200 ${
                isSelected
                  ? 'bg-forest font-medium text-canvas'
                  : isToday
                    ? 'bg-sage-wash text-forest'
                    : 'text-ink-soft'
              }`}
            >
              {dayOfMonth(date)}
            </span>

            <span
              aria-hidden="true"
              className={`size-1 rounded-full transition-colors duration-200 ${
                hasPending && !isSelected ? 'bg-sage' : 'bg-transparent'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
