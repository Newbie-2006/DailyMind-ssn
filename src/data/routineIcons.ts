import type { RoutineIcon } from '../types';
import type { TranslationKey } from '../i18n/translate';

/** The icon choices offered on the Add Routine screen, in picker order. */
export const routineIconOptions: { id: RoutineIcon; labelKey: TranslationKey }[] = [
  { id: 'walk', labelKey: 'icon.walk' },
  { id: 'food', labelKey: 'icon.food' },
  { id: 'pill', labelKey: 'icon.pill' },
  { id: 'phone', labelKey: 'icon.phone' },
  { id: 'book', labelKey: 'icon.book' },
  { id: 'heart', labelKey: 'icon.heart' },
  { id: 'water', labelKey: 'icon.water' },
  { id: 'sun', labelKey: 'icon.sun' },
  { id: 'moon', labelKey: 'icon.moon' },
  { id: 'music', labelKey: 'icon.music' },
];
