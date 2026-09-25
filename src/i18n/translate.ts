import type { Language } from './languages';
import { DEFAULT_LANGUAGE } from './languages';
import { en, type TranslationKey, type Translations } from './translations/en';

export type { TranslationKey, Translations };

/**
 * `memories.viewAll_one` / `_other` are two spellings of one key. Callers pass
 * the base name and a count, so the base name has to be part of the key type.
 */
type PluralBase<K> = K extends `${infer Base}_one` ? Base : never;
export type PluralKey = PluralBase<TranslationKey>;

/** Any key a component may pass to `t()`. */
export type AnyTranslationKey = TranslationKey | PluralKey;

export type TranslateVars = Record<string, string | number>;

/** `t(key, vars)` as handed to components. */
export type TranslateFn = (key: AnyTranslationKey, vars?: TranslateVars) => string;

/**
 * English is bundled because it is the default and the fallback for every other
 * language. The rest are separate chunks, so an English phone never downloads
 * five dictionaries it will not read.
 */
const loaders: Record<Exclude<Language, 'en'>, () => Promise<Translations>> = {
  ta: () => import('./translations/ta').then((m) => m.ta),
  ml: () => import('./translations/ml').then((m) => m.ml),
  te: () => import('./translations/te').then((m) => m.te),
  kn: () => import('./translations/kn').then((m) => m.kn),
  hi: () => import('./translations/hi').then((m) => m.hi),
};

const cache = new Map<Language, Translations>([['en', en]]);

/** The dictionary if it is already in memory, otherwise null. */
export function loadedDictionary(language: Language): Translations | null {
  return cache.get(language) ?? null;
}

export async function loadDictionary(language: Language): Promise<Translations> {
  const cached = cache.get(language);
  if (cached) return cached;

  const dictionary = await loaders[language as Exclude<Language, 'en'>]();
  cache.set(language, dictionary);
  return dictionary;
}

/**
 * Picks the `_one` / `_other` variant when a count is supplied. Every language
 * DailyMind ships uses a simple one/other split, so this stays deliberately
 * small rather than pulling in a plural-rules library.
 */
function resolveKey(
  dictionary: Translations,
  key: AnyTranslationKey,
  vars?: TranslateVars,
): string | undefined {
  if (vars && typeof vars.count === 'number') {
    const variant = `${key}_${vars.count === 1 ? 'one' : 'other'}` as TranslationKey;
    const plural = dictionary[variant];
    if (plural !== undefined) return plural;
  }
  return dictionary[key as TranslationKey];
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Builds a translator over one dictionary. A key missing from that language
 * falls back to English rather than showing a raw key, so a partial translation
 * degrades into mixed language instead of into nonsense.
 */
export function createTranslatorFor(dictionary: Translations): TranslateFn {
  return (key, vars) => {
    const template = resolveKey(dictionary, key, vars) ?? resolveKey(en, key, vars) ?? key;
    return interpolate(template, vars);
  };
}

/**
 * Synchronous translator for a language, using whatever is loaded. Used where a
 * one-off string is needed outside the provider (the language picker's own
 * confirmation), and safe because that language has just been displayed.
 */
export function createTranslator(language: Language): TranslateFn {
  return createTranslatorFor(cache.get(language) ?? cache.get(DEFAULT_LANGUAGE) ?? en);
}
