/** Language codes DailyMind ships. English is the default and the fallback. */
export const LANGUAGES = ['en', 'ta', 'ml', 'te', 'kn', 'hi'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

export interface LanguageOption {
  code: Language;
  /** The language's own name, which is what the selector shows. */
  nativeName: string;
  /** English name, used as a quiet subtitle so the list stays navigable. */
  englishName: string;
}

export const languageOptions: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
];

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/**
 * Maps a browser/device locale onto a shipped language. Only used when nothing
 * has been chosen yet; a stored choice always wins.
 */
export function detectLanguage(locales: readonly string[]): Language {
  for (const locale of locales) {
    const base = locale.toLowerCase().split('-')[0];
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}

/** BCP-47 tag for `Intl` and the document's `lang` attribute. */
export const localeTags: Record<Language, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  ml: 'ml-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
};
