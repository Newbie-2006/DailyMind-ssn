import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { IconButton } from './ui/Button';
import { BrandMark } from './BrandMark';
import { useTranslation } from '../i18n/useTranslation';

/**
 * The application bar.
 *
 * It sits directly under the system status bar - the shell applies the top
 * inset, so this never guesses at a padding. Two shapes only:
 *
 *   brand - the app's own identity, used on the tab a person lands on
 *   page  - a back control and the page's name, used everywhere else
 *
 * Actions are deliberately limited to what that screen needs; a bar carrying
 * every icon in the app tells nobody where they are.
 */

const barBase =
  'sticky top-0 z-20 flex min-h-[var(--dm-topbar)] items-center gap-2 border-b border-transparent bg-canvas/95 backdrop-blur-sm transition-colors';

export function BrandBar({ actions }: { actions?: ReactNode }) {
  const { t } = useTranslation();

  return (
    <header className={`${barBase} dm-gutter py-2`}>
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        <BrandMark />
        <span className="font-display text-[1.25rem] leading-none tracking-[-0.01em] text-forest-deep">
          {t('app.name')}
        </span>
      </span>
      {actions ? <span className="flex shrink-0 items-center gap-1">{actions}</span> : null}
    </header>
  );
}

export interface PageBarProps {
  title: string;
  /** Where back goes when there is no history to pop. */
  fallbackTo?: string;
  actions?: ReactNode;
  /** Top-level tabs have nothing to go back to. */
  showBack?: boolean;
}

export function PageBar({ title, fallbackTo = '/home', actions, showBack = true }: PageBarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackTo);
  };

  return (
    <header className={`${barBase} px-2 py-2`}>
      {showBack ? (
        <IconButton label={t('common.back')} onClick={goBack}>
          <ChevronLeft size={22} strokeWidth={1.8} aria-hidden="true" />
        </IconButton>
      ) : (
        <span className="w-3" aria-hidden="true" />
      )}

      <h1
        className={`min-w-0 flex-1 truncate text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink ${
          showBack ? '' : 'pl-1'
        }`}
      >
        {title}
      </h1>

      <span className="flex shrink-0 items-center gap-0.5 pr-1">
        {actions}
        {showBack && !actions ? <span className="w-9" aria-hidden="true" /> : null}
      </span>
    </header>
  );
}
