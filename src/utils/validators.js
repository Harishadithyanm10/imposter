export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isDisplayName = (v) => /^[\p{L}\p{N}_.-]{3,20}$/u.test(v.trim());

export function validateRegister(v) {
  const e = {};
  if (v.fullName.trim().length < 2) e.fullName = 'Enter your full name.';
  if (!isDisplayName(v.displayName)) e.displayName = '3-20 characters: letters, numbers, dot, dash or underscore.';
  if (!isEmail(v.email)) e.email = 'Enter a valid email address.';
  if (v.password.length < 8) e.password = 'Use at least 8 characters.';
  if (v.confirm !== v.password) e.confirm = 'Passwords do not match.';
  if (!v.terms) e.terms = 'Accept the terms to continue.';
  return e;
}

export function validateRoomSettings(s) {
  const e = {};
  const name = s.roomName.trim();
  if (name.length < 3 || name.length > 30) e.roomName = 'Room name must be 3-30 characters.';
  if (s.gameMode === 'CUSTOM' && !s.hasCustomWords) {
    if (s.customWord.trim().length < 2) e.customWord = 'Enter the secret word.';
    if (s.customImposterWord.trim().length < 2) e.customImposterWord = 'Enter a clue for the imposter.';
    if (s.customWord.trim() && s.customWord.trim().toLowerCase() === s.customImposterWord.trim().toLowerCase()) e.customImposterWord = 'The clue must differ from the secret word.';
  }
  return e;
}
