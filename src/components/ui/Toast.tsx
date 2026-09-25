import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { ToastContext } from './toastContext';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const notify = useCallback((next: string) => {
    setMessage(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-5"
      >
        {message ? (
          <div className="animate-rise flex max-w-[22rem] items-center gap-2.5 rounded-full bg-forest px-4 py-3 text-[0.875rem] text-canvas shadow-lift">
            <Check size={16} strokeWidth={2.4} aria-hidden="true" className="shrink-0" />
            <span>{message}</span>
          </div>
        ) : null}
      </div>
    </ToastContext>
  );
}
