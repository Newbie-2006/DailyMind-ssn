import { useContext } from 'react';
import { I18nContext, type I18nValue } from './I18nContext';

/** `const { t } = useTranslation()` - the only way components read copy. */
export function useTranslation(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useTranslation must be used inside an I18nProvider');
  }
  return value;
}
