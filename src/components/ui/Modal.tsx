import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose(): void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Footer buttons, laid out by the caller. */
  actions?: ReactNode;
}

/**
 * A sheet that rises from the bottom on a phone and centres on a wide screen.
 * Escape closes it, the backdrop closes it, and focus moves inside on open.
 */
export function Modal({ open, onClose, title, description, children, actions }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-fade absolute inset-0 bg-ink/25 backdrop-blur-[1px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-sheet safe-bottom relative w-full max-w-[26rem] rounded-t-[1.5rem] bg-surface p-6 shadow-lift outline-none sm:rounded-[1.5rem]"
      >
        <span
          aria-hidden="true"
          className="mx-auto mb-4 block h-1 w-10 rounded-full bg-beige-deep sm:hidden"
        />
        <h2 id={titleId} className="font-display text-[1.3125rem] text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {actions ? <div className="mt-6 flex flex-col gap-2.5">{actions}</div> : null}
      </div>
    </div>
  );
}
