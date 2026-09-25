import { Check, Languages } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/toastContext';
import { useTranslation } from '../i18n/useTranslation';
import { languageOptions } from '../i18n/languages';
import { createTranslator } from '../i18n/translate';

export function LanguageSettings() {
  const { t, language, setLanguage } = useTranslation();
  const { notify } = useToast();

  return (
    <div className="pb-10">
      <PageHeader title={t('language.title')} onBack fallbackTo="/profile" />

      <div className="dm-gutter space-y-5 pt-6">
        <Card surface="sage" className="flex items-start gap-3 px-4 py-4">
          <Languages
            size={18}
            strokeWidth={1.6}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-forest-soft"
          />
          <p className="text-[0.875rem] leading-relaxed text-forest-deep">{t('language.intro')}</p>
        </Card>

        <Card className="divide-y divide-line-soft" role="radiogroup" aria-label={t('language.title')}>
          {languageOptions.map((option) => {
            const selected = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                role="radio"
                aria-checked={selected}
                lang={option.code}
                onClick={() => {
                  setLanguage(option.code);
                  // The confirmation is written with the newly chosen language's
                  // translator, so it already speaks the language just picked.
                  notify(createTranslator(option.code)('language.changedToast'));
                }}
                className="tap flex min-h-14 w-full items-center gap-3.5 px-4 py-3 text-left transition-colors duration-150 active:bg-surface-sunk"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.0625rem] text-ink">{option.nativeName}</span>
                  {option.nativeName !== option.englishName ? (
                    <span className="block text-[0.8125rem] text-ink-faint">
                      {option.englishName}
                    </span>
                  ) : null}
                </span>

                <span
                  aria-hidden="true"
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
                    selected
                      ? 'border-forest bg-forest text-canvas'
                      : 'border-beige-deep bg-surface text-transparent'
                  }`}
                >
                  <Check size={14} strokeWidth={2.6} />
                </span>
              </button>
            );
          })}
        </Card>

        <p className="px-1 text-[0.8125rem] leading-relaxed text-ink-faint">
          {t('language.assistantNote')}
        </p>
      </div>
    </div>
  );
}
