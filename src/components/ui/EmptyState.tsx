import type { ReactNode } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="mb-5 inline-flex size-16 items-center justify-center rounded-full bg-sage-wash text-forest-soft"
      >
        {icon}
      </span>
      <h3 className="font-display text-[1.25rem] text-ink">{title}</h3>
      <p className="mt-2 max-w-[17rem] text-[0.9375rem] leading-relaxed text-ink-soft">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/** Quiet placeholder used while the first read from storage settles. */
export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center px-6 py-16" role="status" aria-live="polite">
      <span className="flex items-center gap-2.5 text-[0.9375rem] text-ink-faint">
        <span className="size-2 animate-pulse rounded-full bg-sage" aria-hidden="true" />
        {label ?? t('common.loading')}
      </span>
    </div>
  );
}

/** Skeleton block for content that is about to arrive. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-sunk ${className}`} aria-hidden="true" />;
}
