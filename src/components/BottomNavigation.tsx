import { NavLink } from 'react-router-dom';
import { CalendarCheck, House, Images, MessageCircle, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translate';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { to: '/home', labelKey: 'nav.home', icon: House },
  { to: '/memories', labelKey: 'nav.memories', icon: Images },
  { to: '/routines', labelKey: 'nav.routines', icon: CalendarCheck },
  { to: '/assistant', labelKey: 'nav.assistant', icon: MessageCircle },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
];

export function BottomNavigation() {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('nav.main')}
      className="safe-bottom sticky bottom-0 z-30 border-t border-line-soft bg-surface/95 backdrop-blur-sm"
    >
      <ul className="mx-auto flex max-w-[30rem] items-stretch justify-between px-1.5">
        {items.map(({ to, labelKey, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `tap flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-2xl pt-1.5 pb-1 transition-colors duration-150 ${
                  isActive ? 'text-forest' : 'text-ink-faint'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-200 ${
                      isActive ? 'bg-sage-wash' : 'bg-transparent'
                    }`}
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.1 : 1.7} aria-hidden="true" />
                  </span>
                  <span className={`text-[0.6875rem] ${isActive ? 'font-medium' : ''}`}>
                    {t(labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
