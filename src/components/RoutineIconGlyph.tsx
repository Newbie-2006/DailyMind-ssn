import {
  BookOpen,
  Droplets,
  Footprints,
  Heart,
  Moon,
  Music,
  Phone,
  Pill,
  Sun,
  UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RoutineIcon } from '../types';

const ICONS: Record<RoutineIcon, LucideIcon> = {
  walk: Footprints,
  food: UtensilsCrossed,
  pill: Pill,
  phone: Phone,
  book: BookOpen,
  heart: Heart,
  water: Droplets,
  sun: Sun,
  moon: Moon,
  music: Music,
};

export function RoutineIconGlyph({
  icon,
  size = 17,
  className = '',
}: {
  icon: RoutineIcon;
  size?: number;
  className?: string;
}) {
  const Glyph = ICONS[icon] ?? Footprints;
  return <Glyph size={size} strokeWidth={1.7} aria-hidden="true" className={className} />;
}
