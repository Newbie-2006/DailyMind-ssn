import { createContext } from 'react';
import type { Language } from './languages';
import type { TranslateFn } from './translate';

export interface I18nValue {
  language: Language;
  setLanguage(next: Language): void;
  t: TranslateFn;
  /** BCP-47 tag for `Intl` formatting and the document's `lang`. */
  locale: string;
}

export const I18nContext = createContext<I18nValue | null>(null);
