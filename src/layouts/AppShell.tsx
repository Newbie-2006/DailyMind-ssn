import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, type ReactNode } from 'react';
import { BottomNavigation } from '../components/BottomNavigation';
import { Gary } from '../components/gary/Gary';

/**
 * The phone frame. On a handset it fills the screen; on a wide screen it stays
 * at phone width and sits on the warm canvas, so the app reads as an app rather
 * than a stretched website.
 *
 * The shell owns the scroll region rather than the document: that keeps the
 * bottom bar fixed without overlaying content, and lets a screen pin its own
 * footer (the assistant's composer) inside the same column.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const scroller = useRef<HTMLElement>(null);

  // Each screen should start at the top, the way a native push does.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <Frame>
      <main ref={scroller} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <Outlet />
        {/* Room at the end of every page, so the Gary button never covers the last item. */}
        {pathname !== '/assistant' ? <div aria-hidden="true" className="h-16 shrink-0" /> : null}
      </main>
      <BottomNavigation />
      <Gary />
    </Frame>
  );
}

/** Full-bleed shell for screens without the bottom bar (the welcome screen). */
export function PlainShell({ children }: { children: ReactNode }) {
  return <Frame>{children}</Frame>;
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-canvas-deep">
      <div className="relative flex h-dvh w-full max-w-[30rem] flex-col overflow-hidden bg-canvas sm:shadow-lift">
        {children}
      </div>
    </div>
  );
}
