import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, type ReactNode } from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { useReminderSync } from '../hooks/useReminders';

/**
 * The application shell.
 *
 *   system status bar   (drawn by Android, over the frame's own background)
 *   ─────────────────
 *   app bar             (each screen supplies one; sticky at the top of main)
 *   ─────────────────
 *   scrollable content
 *   ─────────────────
 *   bottom navigation
 *   ─────────────────
 *   system gesture bar  (the bar's surface extends behind it)
 *
 * The frame takes the top window inset so nothing is ever drawn under the
 * status bar, and the bottom bar takes the bottom inset so it clears the
 * gesture area. Both come from the real insets rather than a fixed padding.
 *
 * The shell owns the scroll region rather than the document: that keeps the
 * bottom bar in place without covering content, and lets a screen pin its own
 * footer (the assistant's composer) inside the same column.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const scroller = useRef<HTMLElement>(null);

  // Keeps scheduled reminders in step with the routines, on every screen.
  useReminderSync();

  // Each screen should start at the top, the way a native push does.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <Frame>
      <main
        ref={scroller}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
      >
        <Outlet />
      </main>
      <BottomNavigation />
    </Frame>
  );
}

/** Full-bleed shell for screens without the bottom bar (welcome, sign in). */
export function PlainShell({ children }: { children: ReactNode }) {
  return <Frame>{children}</Frame>;
}

/**
 * On a handset the frame fills the screen; on a wide screen it stays at phone
 * width on the warm canvas, so the app reads as an app rather than a stretched
 * website.
 */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-canvas-deep">
      <div className="safe-top relative flex h-dvh w-full max-w-[30rem] flex-col overflow-hidden bg-canvas sm:shadow-lift">
        {children}
      </div>
    </div>
  );
}
