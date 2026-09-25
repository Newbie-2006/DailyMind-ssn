import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import type { Memory } from '../types';
import { formatDate } from '../utils/date';
import { truncate } from '../utils/format';

/**
 * The gallery view behind "View all": a dense grid of square tiles, closer to a
 * phone's photo album than to the reading list. Tapping a tile opens the
 * memory's full information.
 */
export function MemoryGrid({ memories }: { memories: Memory[] }) {
  return (
    <ul className="-mx-5 grid grid-cols-3 gap-[3px]">
      {memories.map((memory, index) => (
        <li key={memory.id}>
          <Link
            to={`/memories/${memory.id}`}
            aria-label={`${memory.title}, ${formatDate(memory.date)}`}
            className="tap group relative block aspect-square overflow-hidden bg-surface-sunk transition-opacity duration-150 active:opacity-80"
          >
            {memory.image ? (
              <img
                src={memory.thumbnail ?? memory.image}
                alt=""
                // The first two rows are on screen immediately; the rest wait.
                loading={index < 6 ? 'eager' : 'lazy'}
                decoding="async"
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full flex-col items-center justify-center gap-1.5 bg-sage-wash px-2 text-center">
                <Leaf size={16} strokeWidth={1.5} aria-hidden="true" className="text-sage" />
                <span className="text-[0.625rem] leading-tight text-forest-soft">
                  {truncate(memory.title, 28)}
                </span>
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
