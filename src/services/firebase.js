import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Public web config (not secrets). Security comes from Auth + Firestore Security Rules.
// Only Authentication + Cloud Firestore are used, so everything fits the free Spark plan.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const missing = ['apiKey', 'authDomain', 'projectId', 'appId'].filter((k) => !firebaseConfig[k]);
if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(`Firebase config missing: ${missing.join(', ')}. Copy .env.example to .env.local and fill it in, then restart "npm run dev".`);
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
