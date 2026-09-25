import type { RoutineIcon } from '../types';

/** The icon choices offered on the Add Routine screen, in picker order. */
export const routineIconOptions: { id: RoutineIcon; label: string }[] = [
  { id: 'walk', label: 'Walk' },
  { id: 'food', label: 'Food' },
  { id: 'pill', label: 'Medicine' },
  { id: 'phone', label: 'Call' },
  { id: 'book', label: 'Reading' },
  { id: 'heart', label: 'Wellbeing' },
  { id: 'water', label: 'Water' },
  { id: 'sun', label: 'Morning' },
  { id: 'moon', label: 'Evening' },
  { id: 'music', label: 'Music' },
];
