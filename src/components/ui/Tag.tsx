import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export function Tag({
  children,
  onRemove,
  tone = 'sage',
}: {
  children: ReactNode;
  onRemove?: () => void;
  tone?: 'sage' | 'beige';
}) {
  const { t } = useTranslation();
  const tones = {
    sage: 'bg-sage-wash text-forest-deep',
    beige: 'bg-beige text-ink-soft',
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3.5 text-[0.8125rem] ${
        onRemove ? 'pr-1.5' : 'pr-3.5'
      } ${tones[tone]}`}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${t('common.remove')} ${String(children)}`}
          className="tap inline-flex size-5 items-center justify-center rounded-full text-forest/70 hover:bg-sage-soft hover:text-forest-deep"
        >
          <X size={13} strokeWidth={2.2} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}

export interface FilterChipsProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange(next: T): void;
  label: string;
}

/** The row of filters at the top of Memories. Scrolls sideways when it must. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: FilterChipsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`tap min-h-10 shrink-0 rounded-full px-4 text-[0.875rem] transition-colors duration-150 ${
              active
                ? 'bg-forest font-medium text-canvas'
                : 'bg-surface text-ink-soft hover:bg-surface-sunk'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
