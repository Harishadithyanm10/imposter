import './index.css';
import { appReady, initNative } from './native.js';

initNative();

/** Replaces the launch animation with a readable message, so a startup problem never looks like "loading forever". */
function showFatal(message) {
  let boot = document.getElementById('boot');
  if (!boot) { boot = document.createElement('div'); boot.id = 'boot'; document.body.appendChild(boot); }
  boot.style.opacity = '1';
  boot.innerHTML = '<div style="max-width:320px;padding:24px;text-align:center;font-family:system-ui,sans-serif;color:#e8e8f0">'
    + '<div style="font-size:20px;font-weight:800;margin-bottom:10px">Imposter could not start</div>'
    + '<div id="boot-msg" style="font-size:13px;line-height:1.5;color:#a0a0b4;word-break:break-word;margin-bottom:18px"></div>'
    + '<button id="boot-retry" style="border:0;border-radius:12px;padding:12px 22px;font-size:15px;font-weight:700;color:#fff;background:#8b5cf6">Try again</button></div>';
  boot.querySelector('#boot-msg').textContent = message;
  boot.querySelector('#boot-retry').onclick = () => window.location.reload();
}

// Remember the last error so the watchdog below can show it.
let lastError = '';
window.addEventListener('error', (e) => { lastError = e.message || String(e.error || ''); });
window.addEventListener('unhandledrejection', (e) => { lastError = String(e.reason?.message || e.reason || ''); });

const missing = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'].filter((k) => !import.meta.env[k]);
if (missing.length) {
  showFatal(`This build has no Firebase settings (${missing.join(', ')}). Add the VITE_FIREBASE_* secrets in GitHub (Settings > Secrets and variables > Actions) and run the build again.`);
} else {
  import('./mount.jsx')
    .then((m) => {
      m.mount();
      // the React loader looks identical to the launch screen, so swapping them is seamless
      requestAnimationFrame(() => requestAnimationFrame(appReady));
    })
    .catch((e) => showFatal(String(e?.message || e)));

  // Watchdog: if nothing has appeared after 15 seconds, say so instead of spinning forever.
  setTimeout(() => {
    const stuck = document.getElementById('boot');
    if (stuck && stuck.style.opacity !== '0') showFatal(`The app did not finish starting.${lastError ? ` Last error: ${lastError}` : ''} Check your internet connection and try again.`);
  }, 15000);
}
