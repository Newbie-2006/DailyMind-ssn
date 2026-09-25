import { Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RoutineOccurrence } from '../types';
import { formatTime } from '../utils/date';
import { RoutineIconGlyph } from './RoutineIconGlyph';

export interface RoutineItemProps {
  occurrence: RoutineOccurrence;
  onToggle(routineId: string): void;
  /** Adds a chevron through to the routine's own page. */
  linkTo?: string;
}

/**
 * One line of the day. The tick and the row are separate targets: tapping the
 * circle completes it, tapping the row opens it. Completion is carried by the
 * tick mark and the strikethrough, not by colour alone.
 */
export function RoutineItem({ occurrence, onToggle, linkTo }: RoutineItemProps) {
  const { routine, completed } = occurrence;

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-2.5 py-2.5 transition-colors duration-200 ${
        completed ? 'bg-transparent' : 'bg-transparent'
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        onClick={() => onToggle(routine.id)}
        className="tap inline-flex size-11 shrink-0 items-center justify-center rounded-full active:scale-95"
      >
        <span className="sr-only">
          {completed ? `Mark ${routine.name} as not done` : `Mark ${routine.name} as done`}
        </span>
        <span
          className={`flex size-[26px] items-center justify-center rounded-full border transition-colors duration-200 ${
            completed
              ? 'border-forest bg-forest text-canvas'
              : 'border-beige-deep bg-surface text-transparent'
          }`}
          aria-hidden="true"
        >
          <Check size={15} strokeWidth={2.6} />
        </span>
      </button>

      <Wrapper to={linkTo}>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
            completed ? 'bg-sage-wash text-sage' : 'bg-surface-sunk text-forest-soft'
          }`}
          aria-hidden="true"
        >
          <RoutineIconGlyph icon={routine.icon} size={16} />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[0.9375rem] transition-colors duration-200 ${
              completed ? 'text-ink-faint line-through decoration-ink-faint/50' : 'text-ink'
            }`}
          >
            {routine.name}
          </span>
        </span>

        <span
          className={`shrink-0 text-[0.8125rem] tabular-nums ${
            completed ? 'text-ink-faint' : 'text-ink-soft'
          }`}
        >
          {formatTime(routine.time)}
        </span>

        {/* On a 360px handset the name needs the room more than the chevron does. */}
        {linkTo ? (
          <ChevronRight
            size={17}
            strokeWidth={1.7}
            aria-hidden="true"
            className="hidden text-ink-faint min-[390px]:block"
          />
        ) : null}
      </Wrapper>
    </div>
  );
}

function Wrapper({ to, children }: { to?: string; children: React.ReactNode }) {
  const className = 'flex min-w-0 flex-1 items-center gap-2.5';
  if (!to) return <div className={className}>{children}</div>;
  return (
    <Link to={to} className={`tap ${className}`}>
      {children}
    </Link>
  );
}
