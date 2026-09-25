import { Link } from 'react-router-dom';
import type { Memory } from '../types';
import { formatDate } from '../utils/date';
import { MemoryImage } from './MemoryImage';

/** The list row on the Memories tab: photo, title, date, a couple of lines. */
export function MemoryCard({ memory, priority = false }: { memory: Memory; priority?: boolean }) {
  return (
    <Link
      to={`/memories/${memory.id}`}
      className="tap flex gap-3.5 rounded-card bg-surface p-3 shadow-soft transition-transform duration-150 active:scale-[0.99]"
    >
      <MemoryImage
        src={memory.thumbnail ?? memory.image}
        alt={memory.title}
        priority={priority}
        className="size-[5.25rem] shrink-0"
        rounded="rounded-xl"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
        <h3 className="truncate text-[0.9375rem] font-medium text-ink">{memory.title}</h3>
        <p className="mt-0.5 text-[0.8125rem] text-ink-faint">{formatDate(memory.date)}</p>
        <p className="clamp-2 mt-1.5 text-[0.8125rem] leading-snug text-ink-soft">
          {memory.description}
        </p>
      </div>
    </Link>
  );
}

/** The wider card used on Home to resurface one recent memory. */
export function MemoryFeatureCard({ memory }: { memory: Memory }) {
  return (
    <Link
      to={`/memories/${memory.id}`}
      className="tap block overflow-hidden rounded-card bg-surface shadow-soft transition-transform duration-150 active:scale-[0.99]"
    >
      <MemoryImage
        src={memory.image}
        alt={memory.title}
        className="h-40 w-full"
        rounded="rounded-none"
      />
      <div className="px-4 py-3.5">
        <h3 className="text-[0.9375rem] font-medium text-ink">{memory.title}</h3>
        <p className="mt-0.5 text-[0.8125rem] text-ink-faint">{formatDate(memory.date)}</p>
      </div>
    </Link>
  );
}
