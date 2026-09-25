import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_LANGUAGE,
  detectLanguage,
  isLanguage,
  localeTags,
  type Language,
} from './languages';
import {
  createTranslatorFor,
  loadDictionary,
  loadedDictionary,
  type Translations,
} from './translate';
import { en } from './translations/en';
import { I18nContext, type I18nValue } from './I18nContext';
import { StorageKeys, readKey, writeKey } from '../services/storage';
import { setDateLocale } from '../utils/date';

/**
 * Reads the saved language before the first paint, so the app never flashes
 * English on its way to the chosen language. Falls back to the device locale on
 * a genuine first run, then to English.
 */
function initialLanguage(): Language {
  const stored = readKey<string | null>(StorageKeys.language, null);
  if (isLanguage(stored)) return stored;

  if (typeof navigator !== 'undefined') {
    const locales = navigator.languages ?? [navigator.language].filter(Boolean);
    return detectLanguage(locales as string[]);
  }
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  // English is bundled, so it is ready on the first render. Another language
  // arrives as a separate chunk a moment later.
  const [dictionary, setDictionary] = useState<Translations>(
    () => loadedDictionary(initialLanguage()) ?? en,
  );

  const locale = localeTags[language];

  // Dates are formatted through `Intl`, which needs the language too. Set it
  // during render so the first paint already uses the right locale.
  setDateLocale(locale);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    // Resolves from cache when the chunk has already been fetched, so this is
    // the only path and there is no synchronous branch to duplicate.
    void loadDictionary(language)
      .then((loaded) => {
        if (!cancelled) setDictionary(loaded);
      })
      .catch(() => {
        // A chunk that will not load must not leave a blank app: English is
        // already in memory, so the screen stays usable in the fallback.
        if (!cancelled) setDictionary(en);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    writeKey(StorageKeys.language, next);
    // Load before switching, so the UI never flickers through English.
    void loadDictionary(next)
      .then((loaded) => {
        setDictionary(loaded);
        setLanguageState(next);
      })
      .catch(() => {
        setLanguageState(next);
      });
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ language, setLanguage, locale, t: createTranslatorFor(dictionary) }),
    [language, setLanguage, locale, dictionary],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}
