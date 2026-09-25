import { useMemo, useState } from 'react';
import { ChevronDown, Images, LayoutList, Plus, Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemories } from '../hooks/useAppData';
import { filterMemories, memoryFilters, type MemoryFilter } from '../services/memoryService';
import { MemoryCard } from '../components/MemoryCard';
import { MemoryGrid } from '../components/MemoryGrid';
import { LargeHeader } from '../components/PageHeader';
import { FilterChips } from '../components/ui/Tag';
import { IconButton } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { pluralize } from '../utils/format';

/** How many memories the list shows before "View all" opens the gallery. */
const PREVIEW_COUNT = 6;

type View = 'list' | 'gallery';

export function Memories() {
  const { memories } = useMemories();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<MemoryFilter>('all');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // The view lives in the URL so that opening a memory and coming back returns
  // to the gallery rather than dropping the person into the list.
  const [params, setParams] = useSearchParams();
  const view: View = params.get('view') === 'gallery' ? 'gallery' : 'list';
  const setView = (next: View) =>
    setParams(next === 'gallery' ? { view: 'gallery' } : {}, { replace: false });

  const visible = useMemo(
    () => filterMemories(memories, filter, query),
    [memories, filter, query],
  );

  const preview = view === 'list' ? visible.slice(0, PREVIEW_COUNT) : visible;

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
  };

  return (
    <div className="pb-8">
      <LargeHeader
        title="Memories"
        actions={
          <>
            <IconButton
              label={searching ? 'Close search' : 'Search memories'}
              onClick={() => (searching ? closeSearch() : setSearching(true))}
            >
              {searching ? (
                <X size={20} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <Search size={20} strokeWidth={1.8} aria-hidden="true" />
              )}
            </IconButton>
            <IconButton
              label="Add a memory"
              tone="filled"
              onClick={() => navigate('/memories/new')}
            >
              <Plus size={20} strokeWidth={2} aria-hidden="true" />
            </IconButton>
          </>
        }
      />

      <div className="space-y-4 px-5 pt-1">
        {searching ? (
          <div className="animate-fade">
            <label htmlFor="memory-search" className="sr-only">
              Search memories
            </label>
            <input
              id="memory-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, person or tag"
              autoFocus
              type="search"
              className="min-h-12 w-full rounded-full border border-line bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-ink-faint focus:border-sage focus:outline-none"
            />
          </div>
        ) : null}

        <FilterChips<MemoryFilter>
          label="Filter memories"
          options={memoryFilters}
          value={filter}
          onChange={setFilter}
        />

        {visible.length === 0 ? (
          <EmptyState
            icon={<Images size={24} strokeWidth={1.5} />}
            title={query || filter !== 'all' ? 'Nothing matches yet' : 'No memories yet'}
            body={
              query || filter !== 'all'
                ? 'Try a different word, or clear the filter to see everything you have saved.'
                : 'Start capturing the moments you want to remember.'
            }
            action={
              query || filter !== 'all' ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => navigate('/memories/new')}>
                  <Plus size={17} strokeWidth={2} aria-hidden="true" />
                  Add memory
                </Button>
              )
            }
          />
        ) : view === 'list' ? (
          <>
            <ul className="space-y-3">
              {preview.map((memory, index) => (
                <li key={memory.id}>
                  <MemoryCard memory={memory} priority={index < 2} />
                </li>
              ))}
            </ul>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setView('gallery')}
                className="tap flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-surface text-[0.875rem] font-medium text-forest shadow-soft transition-transform duration-150 active:scale-[0.99]"
              >
                View all {visible.length} {pluralize(visible.length, 'memory', 'memories')}
                <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.8125rem] text-ink-faint">
                {visible.length} {pluralize(visible.length, 'memory', 'memories')}
              </p>
              <button
                type="button"
                onClick={() => setView('list')}
                className="tap inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium text-forest active:bg-surface-sunk"
              >
                <LayoutList size={15} strokeWidth={1.9} aria-hidden="true" />
                Back to list
              </button>
            </div>

            <MemoryGrid memories={visible} />
          </div>
        )}
      </div>
    </div>
  );
}
