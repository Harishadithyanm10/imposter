// Service functions throw Errors with user-friendly messages; Firebase errors are mapped here.
const AUTH_MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
  'auth/weak-password': 'Choose a password with at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups and retry.',
  'auth/account-exists-with-different-credential': 'This email is registered with a password. Log in with your email and password instead.',
  'auth/requires-recent-login': 'Please log in again to continue.',
};

export function errMsg(e) {
  if (!e) return 'Something went wrong.';
  if (AUTH_MESSAGES[e.code]) return AUTH_MESSAGES[e.code];
  if (e.code === 'unavailable') return 'Cannot reach the server. Check your connection.';
  if (e.code === 'permission-denied') return 'You do not have access to that.';
  if (e.message && !/^(internal|INTERNAL)$/.test(e.message)) return e.message.replace(/^Firebase: /, '').replace(/ \(auth\/.*\)\.?$/, '');
  return 'Something went wrong. Please try again.';
}
