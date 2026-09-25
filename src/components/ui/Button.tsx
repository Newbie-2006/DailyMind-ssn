import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'quiet';
type Size = 'md' | 'lg';

const base =
  'tap inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,color] duration-150 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-forest text-canvas hover:bg-forest-deep',
  secondary: 'bg-sage-soft text-forest-deep hover:bg-sage-mid',
  quiet: 'bg-transparent text-ink-soft hover:bg-surface-sunk',
};

// 48px and 56px tall: comfortable thumb targets on a phone.
const sizes: Record<Size, string> = {
  md: 'min-h-12 px-5 text-[0.95rem]',
  lg: 'min-h-14 px-6 text-base w-full',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface ButtonLinkProps {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'filled';
  children: ReactNode;
}

/** Square tap target for header actions. The label is required, not optional. */
export function IconButton({
  label,
  tone = 'default',
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  const tones = {
    default: 'text-ink-soft hover:bg-surface-sunk active:bg-beige',
    filled: 'bg-forest text-canvas hover:bg-forest-deep',
  } as const;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`tap inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-150 active:scale-[0.97] ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
