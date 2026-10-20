// Everything that differs between the website and the Android / iOS apps (Capacitor) lives here.
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { Share } from '@capacitor/share';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

/**
 * "App mode" = the phone-app interface (welcome screen, tab bar, app home). It is on inside the Android/iOS
 * apps and in an installed web app, and you can preview it in any browser with  ?app=1  (turn off with ?app=0).
 */
function detectApp() {
  if (isNative) return true;
  try {
    const q = new URLSearchParams(window.location.search).get('app');
    if (q === '1') localStorage.setItem('imposter-app-ui', '1');
    if (q === '0') localStorage.removeItem('imposter-app-ui');
    if (localStorage.getItem('imposter-app-ui') === '1') return true;
  } catch { /* storage blocked */ }
  return !!(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
}
export const isApp = detectApp();

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

/** Fades out the launch screens once the first screen of the app is on the display. */
export function appReady() {
  const boot = document.getElementById('boot');
  if (boot) { boot.style.opacity = '0'; setTimeout(() => boot.remove(), 320); }
  if (isNative) SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
}

/** One-time setup: app mode styling, system bars, keyboard, Android back button. */
export function initNative() {
  const root = document.documentElement;
  if (isApp) {
    root.classList.add('app');
    // an app does not pinch-zoom
    document.querySelector('meta[name="viewport"]')?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
  if (!isNative) return;
  root.classList.add('native', `native-${platform}`);
  SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {}); // light icons on our dark background
  // hide the tab bar while the keyboard is open so it does not float above the keyboard
  Keyboard.addListener('keyboardWillShow', () => root.classList.add('kb-open'));
  Keyboard.addListener('keyboardWillHide', () => root.classList.remove('kb-open'));
  Keyboard.setAccessoryBarVisible?.({ isVisible: false }).catch(() => {});
  App.addListener('backButton', ({ canGoBack }) => {
    const atRoot = ['/', '/dashboard', '/login'].includes(window.location.pathname);
    if (canGoBack && !atRoot) window.history.back();
    else App.exitApp();
  });
}
