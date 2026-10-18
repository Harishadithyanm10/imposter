// Everything that differs between the web build and the Android / iOS apps (Capacitor) lives here.
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { Share } from '@capacitor/share';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

/**
 * Public https address of the website. Inside the apps the page origin is capacitor://localhost or
 * https://localhost, which is useless in an invite, so set VITE_PUBLIC_URL (see .env.example).
 * Returns null when there is no shareable address.
 */
export const publicOrigin = () => (isNative ? (import.meta.env.VITE_PUBLIC_URL || '').replace(/\/+$/, '') || null : window.location.origin);

/** Native share sheet. Resolves true when handled (shared or cancelled), false to let the caller fall back. */
export async function nativeShare({ title, text, url }) {
  if (!isNative) return false;
  try {
    await Share.share({ title, text, url: url || undefined, dialogTitle: title });
    return true;
  } catch (e) {
    return /cancel/i.test(String(e?.message)); // user closed the sheet: nothing more to do
  }
}

/** One-time setup when running as an app: system bar style, splash screen, Android back button. */
export function initNative() {
  if (!isNative) return;
  document.documentElement.classList.add('native', `native-${platform}`);
  SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {}); // light icons on our dark background
  setTimeout(() => SplashScreen.hide().catch(() => {}), 300);
  App.addListener('backButton', ({ canGoBack }) => {
    const atRoot = ['/', '/dashboard', '/login'].includes(window.location.pathname);
    if (canGoBack && !atRoot) window.history.back();
    else App.exitApp();
  });
}
