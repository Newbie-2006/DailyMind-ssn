import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { IconButton } from './ui/Button';

export interface PageHeaderProps {
  title: string;
  /** Shows a back control. Falls back to `fallbackTo` when there is no history. */
  onBack?: boolean;
  fallbackTo?: string;
  actions?: ReactNode;
  /** Sticks to the top while the page scrolls. */
  sticky?: boolean;
}

export function PageHeader({
  title,
  onBack = false,
  fallbackTo = '/home',
  actions,
  sticky = true,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackTo);
  };

  return (
    <header
      className={`safe-top z-20 bg-canvas/95 backdrop-blur-sm ${sticky ? 'sticky top-0' : ''}`}
    >
      <div className="flex min-h-[3.5rem] items-center gap-1 px-2 py-2">
        {onBack ? (
          <IconButton label="Go back" onClick={goBack}>
            <ChevronLeft size={22} strokeWidth={1.8} aria-hidden="true" />
          </IconButton>
        ) : (
          <span className="w-2" aria-hidden="true" />
        )}

        <h1
          className={`min-w-0 flex-1 truncate text-[1.125rem] font-semibold tracking-[-0.01em] text-ink ${
            onBack ? 'text-center' : 'pl-2'
          }`}
        >
          {title}
        </h1>

        <div className="flex items-center gap-0.5">
          {actions}
          {onBack && !actions ? <span className="w-11" aria-hidden="true" /> : null}
        </div>
      </div>
    </header>
  );
}

/**
 * The larger editorial heading used on the top-level tabs, where the page is a
 * place rather than a step in a flow.
 */
export function LargeHeader({
  title,
  actions,
  subtitle,
}: {
  title: string;
  actions?: ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="safe-top sticky top-0 z-20 bg-canvas/95 px-5 pt-3 pb-2 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[1.75rem] leading-tight tracking-[-0.015em] text-ink">
            {title}
          </h1>
          {subtitle ? <p className="mt-0.5 text-[0.875rem] text-ink-faint">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
    </header>
  );
}
