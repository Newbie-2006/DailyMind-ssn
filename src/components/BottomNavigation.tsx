import { NavLink } from 'react-router-dom';
import { CalendarCheck, House, Images, MessageCircle, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/routines', label: 'Routines', icon: CalendarCheck },
  { to: '/assistant', label: 'Assistant', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: User },
];

export function BottomNavigation() {
  return (
    <nav
      aria-label="Main"
      className="safe-bottom sticky bottom-0 z-30 border-t border-line-soft bg-surface/95 backdrop-blur-sm"
    >
      <ul className="mx-auto flex max-w-[30rem] items-stretch justify-between px-1.5">
        {items.map(({ to, label, icon: Icon }) => (
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
                    {label}
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
