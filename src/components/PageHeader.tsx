import type { ReactNode } from 'react';
import { PageBar } from './TopBar';

/**
 * Screen-level headers.
 *
 * Neither of these takes the status-bar inset any more - the shell does, once,
 * so every screen sits below the system bar without repeating the calculation.
 */

export interface PageHeaderProps {
  title: string;
  /** Shows a back control. Falls back to `fallbackTo` when there is no history. */
  onBack?: boolean;
  fallbackTo?: string;
  actions?: ReactNode;
}

/** A secondary screen: back control, page name, and its own actions. */
export function PageHeader({ title, onBack = false, fallbackTo, actions }: PageHeaderProps) {
  return <PageBar title={title} showBack={onBack} fallbackTo={fallbackTo} actions={actions} />;
}

/**
 * The editorial heading used on the top-level tabs, where the screen is a place
 * rather than a step in a flow. It keeps DailyMind's display face; only the
 * spacing is shared with the rest of the shell.
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
    <header className="dm-gutter sticky top-0 z-20 bg-canvas/95 pt-4 pb-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[1.75rem] leading-tight tracking-[-0.015em] text-ink">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-[0.875rem] text-ink-faint">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
      </div>
    </header>
  );
}
