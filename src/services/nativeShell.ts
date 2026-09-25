import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Native window setup, run once at startup.
 *
 * Android 15+ draws every app edge to edge, so DailyMind's cream canvas sits
 * behind the status bar rather than under a coloured strip. That is the look we
 * want, but it means the system icons are drawn on top of a light background -
 * hence `Style.Light`, which asks Android for *dark* icons.
 *
 * The layout itself is handled in CSS from the real window insets; nothing here
 * positions content.
 */
export function setUpNativeShell(): void {
  if (!Capacitor.isNativePlatform()) return;

  // Lets the stylesheet apply a floor to the top inset on builds that report
  // zero while still drawing under the bar.
  document.documentElement.classList.add('dm-native');

  void StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {
    // Not every platform supports it; the CSS insets still hold the layout.
  });
  void StatusBar.setStyle({ style: Style.Light }).catch(() => {
    // Icon colour is a polish detail, never a reason to fail startup.
  });
}
