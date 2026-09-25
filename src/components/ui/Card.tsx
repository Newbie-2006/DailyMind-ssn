import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

const surfaces = {
  plain: 'bg-surface',
  sunk: 'bg-surface-sunk',
  beige: 'bg-beige',
  sage: 'bg-sage-wash',
} as const;

export type CardSurface = keyof typeof surfaces;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
  children: ReactNode;
}

export function Card({ surface = 'plain', className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-card shadow-soft ${surfaces[surface]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardLinkProps {
  to: string;
  surface?: CardSurface;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

export function CardLink({ to, surface = 'plain', className = '', children, ...rest }: CardLinkProps) {
  return (
    <Link
      to={to}
      className={`tap block rounded-card shadow-soft transition-transform duration-150 active:scale-[0.99] ${surfaces[surface]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** Small uppercase-free section label used above groups of cards. */
export function SectionTitle({
  children,
  action,
  className = '',
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-baseline justify-between gap-3 ${className}`}>
      <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">{children}</h2>
      {action}
    </div>
  );
}
