import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { LocationFix } from '../types';
import { useTranslation } from '../i18n/useTranslation';

/**
 * An OpenStreetMap embed with a marker on the shared position.
 *
 * Deliberately an iframe rather than a map library: it adds no JavaScript to
 * the bundle, works on a mid-range Android without a WebGL path, and degrades
 * to the coordinates when there is no network. The tiles are the only thing in
 * DailyMind that talks to the internet, and only a caregiver viewing a position
 * loads them.
 */
export function LocationMap({ fix, className = '' }: { fix: LocationFix; className?: string }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  // A small box around the point; roughly a few streets at typical accuracy.
  const span = 0.004;
  const bbox = [
    fix.longitude - span,
    fix.latitude - span / 2,
    fix.longitude + span,
    fix.latitude + span / 2,
  ].join('%2C');

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${fix.latitude}%2C${fix.longitude}`;

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-sage-wash px-6 text-center ${className}`}
      >
        <MapPin size={22} strokeWidth={1.6} aria-hidden="true" className="text-sage" />
        <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
          {t('locationView.mapUnavailable')}
        </p>
      </div>
    );
  }

  return (
    <iframe
      title={t('locationView.mapAlt')}
      src={src}
      loading="lazy"
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      className={`w-full border-0 bg-surface-sunk ${className}`}
    />
  );
}
