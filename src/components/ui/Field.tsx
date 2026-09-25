import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

const control =
  'w-full rounded-2xl bg-surface-sunk px-4 py-3.5 text-[0.9375rem] text-ink placeholder:text-ink-faint border border-line-soft transition-colors duration-150 focus:border-sage focus:bg-surface focus:outline-none';

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[0.8125rem] font-medium text-ink-soft">
      {children}
    </label>
  );
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, className = '', ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <input id={id} className={control} {...rest} />
      {hint ? <p className="mt-1.5 text-[0.8125rem] text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
}

export function TextAreaField({ label, hint, className = '', rows = 5, ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <textarea id={id} rows={rows} className={`${control} resize-none leading-relaxed`} {...rest} />
      {hint ? <p className="mt-1.5 text-[0.8125rem] text-ink-faint">{hint}</p> : null}
    </div>
  );
}

/** A labelled group for controls that are not a single input (chips, pickers). */
export function FieldGroup({
  label,
  hint,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-2 block text-[0.8125rem] font-medium text-ink-soft">{label}</legend>
      {children}
      {hint ? <p className="mt-2 text-[0.8125rem] text-ink-faint">{hint}</p> : null}
    </fieldset>
  );
}

/** Pill options used for repeat rules and icon choice. */
export function ChoiceChip({
  selected,
  onClick,
  children,
  label,
}: {
  selected: boolean;
  onClick(): void;
  children: ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`tap inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-[0.875rem] transition-colors duration-150 ${
        selected
          ? 'bg-forest font-medium text-canvas'
          : 'bg-surface-sunk text-ink-soft hover:bg-beige'
      }`}
    >
      {children}
    </button>
  );
}
