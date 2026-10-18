import {
  GoogleAuthProvider, browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword,
  deleteUser, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup,
  sendPasswordResetEmail, setPersistence, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile as updateAuthProfile,
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { AVATAR_KEYS } from '../constants/avatars.js';
import { validateDisplayName } from '../lib/settings.js';
import { randomInt } from '../lib/random.js';
import { leaderboardEntry } from './leaderboardService.js';
import { isNative } from '../native.js';

const nameKey = (n) => n.toLowerCase();

export async function isDisplayNameAvailable(displayName) {
  const snap = await getDoc(doc(db, 'usernames', nameKey(displayName)));
  return !snap.exists();
}

function takenError() {
  const err = new Error('That display name is already taken.');
  err.code = 'app/display-name-taken';
  return err;
}

/**
 * Creates users/{uid} and reserves the display name in ONE transaction, so two people can never
 * end up with the same name. Security Rules verify the pairing (see firestore.rules).
 */
export async function createProfile(uid, { displayName, fullName = '', email = '', photoURL = null, avatar }) {
  const lower = nameKey(displayName);
  await runTransaction(db, async (tx) => {
    const nameRef = doc(db, 'usernames', lower);
    if ((await tx.get(nameRef)).exists()) throw takenError();
    const pickedAvatar = avatar || AVATAR_KEYS[randomInt(AVATAR_KEYS.length)];
    tx.set(nameRef, { uid });
    tx.set(doc(db, 'users', uid), {
      uid, displayName, displayNameLower: lower, fullName, email, photoURL,
      avatar: pickedAvatar,
      createdAt: serverTimestamp(), gamesPlayed: 0, gamesWon: 0,
    });
    // every player is on the all-time leaderboard from day one (0 wins)
    tx.set(doc(db, 'leaderboard', uid), leaderboardEntry(uid, { displayName, avatar: pickedAvatar, gamesPlayed: 0, gamesWon: 0 }));
  });
}

function deriveName(user) {
  const raw = (user.displayName || (user.email || 'player').split('@')[0] || 'player').replace(/[^\p{L}\p{N}_.-]+/gu, '');
  return (raw.length >= 3 ? raw : `${raw}player`).slice(0, 14);
}

/** First Google sign-in (or an interrupted sign-up): create the profile if it does not exist. */
export async function ensureProfile(user) {
  if ((await getDoc(doc(db, 'users', user.uid))).exists()) return;
  const base = deriveName(user);
  for (let i = 0; i < 6; i += 1) {
    const displayName = i === 0 ? base : `${base}${1000 + randomInt(9000)}`;
    try {
      await createProfile(user.uid, { displayName, fullName: user.displayName || '', email: user.email || '', photoURL: user.photoURL || null });
      return;
    } catch (e) {
      if (e.code !== 'app/display-name-taken') throw e;
    }
  }
  throw new Error('Could not reserve a display name. Please try again.');
}

/**
 * Registration with rollback: if the profile cannot be created (e.g. the name was taken a moment
 * ago) the new Auth account is deleted, so nobody is left half-registered.
 */
export async function registerWithEmail({ fullName, displayName, email, password, avatar }) {
  const name = validateDisplayName(displayName);
  if (!(await isDisplayNameAvailable(name))) throw takenError();
  await setPersistence(auth, browserLocalPersistence);
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await updateAuthProfile(cred.user, { displayName: name });
    await createProfile(cred.user.uid, { displayName: name, fullName, email: email.trim(), avatar });
  } catch (e) {
    await deleteUser(cred.user).catch(() => signOut(auth));
    throw e;
  }
  return cred.user;
}

export async function loginWithEmail(email, password, remember = true) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

/**
 * Google blocks OAuth inside embedded web views, so the apps use the NATIVE Google account picker and then
 * hand the resulting token to the normal Firebase JS SDK (skipNativeAuth), so everything else is unchanged.
 */
async function nativeGoogleCredential() {
  let res;
  try {
    res = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
  } catch (e) {
    const err = new Error(e?.message || 'Google sign-in failed.');
    err.code = /cancel/i.test(String(e?.message)) || String(e?.code) === '12501' ? 'auth/popup-closed-by-user' : e?.code;
    throw err;
  }
  const idToken = res?.credential?.idToken;
  if (!idToken) { const err = new Error('Google sign-in was cancelled.'); err.code = 'auth/popup-closed-by-user'; throw err; }
  return GoogleAuthProvider.credential(idToken, res.credential.accessToken || undefined);
}

export async function loginWithGoogle() {
  let user;
  if (isNative) {
    user = (await signInWithCredential(auth, await nativeGoogleCredential())).user;
  } else {
    await setPersistence(auth, browserLocalPersistence);
    user = (await signInWithPopup(auth, new GoogleAuthProvider())).user;
  }
  await ensureProfile(user);
  return user;
}

export const logout = () => signOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

export async function reauthenticate(user, password) {
  if (user.providerData.some((p) => p.providerId === 'google.com')) {
    return isNative ? reauthenticateWithCredential(user, await nativeGoogleCredential()) : reauthenticateWithPopup(user, new GoogleAuthProvider());
  }
  return reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}
