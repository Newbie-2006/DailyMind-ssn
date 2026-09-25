import { createContext, useContext } from 'react';

export interface ToastValue {
  /** Shows a brief confirmation. Deliberately the only kind of toast there is. */
  notify(message: string): void;
}

export const ToastContext = createContext<ToastValue | null>(null);

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  // A missing provider should not take a screen down over a confirmation.
  return value ?? { notify: () => {} };
}
