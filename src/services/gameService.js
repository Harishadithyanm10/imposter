// Player-side game actions. Each is a single Firestore write that Security Rules validate
// (whose turn it is, one vote per attempt, phase, membership). Host-only logic is in lib/hostGame.js.
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { clueLeaksWord } from '../lib/engine.js';
import { validateClue } from '../lib/settings.js';

const denied = (e, msg) => { throw e.code === 'permission-denied' ? new Error(msg) : e; };

export async function submitClue(roomId, roundId, uid, text, secretWord, turnIndex) {
  const clue = validateClue(text);
  if (clueLeaksWord(clue, secretWord)) throw new Error('Your clue cannot contain your secret word.');
  try {
    await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'clues', uid), {
      uid, clue, skipped: false, order: turnIndex, submittedAt: serverTimestamp(),
    });
  } catch (e) { denied(e, 'It is not your turn, or your turn just ended.'); }
}

// Timer-only mode: the speaker taps "Done" instead of typing. A tiny marker is stored so the turn advances.
export const SPOKE_MARK = '🎤';
export async function markSpoke(roomId, roundId, uid, turnIndex) {
  try {
    await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'clues', uid), {
      uid, clue: SPOKE_MARK, skipped: false, order: turnIndex, submittedAt: serverTimestamp(),
    });
  } catch (e) { denied(e, 'It is not your turn, or your turn just ended.'); }
}

/** One vote document per player per attempt, naming one player for each imposter in the game. */
/** One private final guess at the secret word. Rules: eligible players only, once, before the deadline. */
export async function submitGuess(roomId, roundId, uid, text) {
  const guess = String(text || '').replace(/\s+/g, ' ').trim();
  if (!guess) throw new Error('Type your guess first.');
  if (guess.length > 40) throw new Error('Guesses are at most 40 characters.');
  try {
    await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'guesses', uid), { uid, guess, submittedAt: serverTimestamp() });
  } catch (e) { denied(e, 'Your guess was not accepted. You may have already guessed, or time is up.'); }
}

/** "One More Hint": creates the one-per-match record that unlocks the imposter's private hint. */
export async function activateExtraHint(roomId, matchId, uid) {
  try {
    await setDoc(doc(db, 'rooms', roomId, 'abilityUse', `${matchId}_${uid}`), { uid, matchId, usedAt: serverTimestamp() });
  } catch (e) { denied(e, 'You can only use this ability once per round, during the discussion.'); }
}

export const REACTIONS = ['😂', '😱', '👀', '🔥', '👏', '💀', '🤔', '😈'];
export async function sendReaction(roomId, uid, emoji) {
  if (!REACTIONS.includes(emoji)) return;
  try {
    await setDoc(doc(db, 'rooms', roomId, 'reactions', uid), { uid, emoji, at: serverTimestamp() });
  } catch (e) { denied(e, 'Slow down a little, reactions are limited.'); }
}

export async function submitVote(roomId, roundId, uid, attempt, targetUids) {
  const picks = [...new Set(Array.isArray(targetUids) ? targetUids : [targetUids])];
  if (!picks.length) throw new Error('Pick at least one player.');
  try {
    await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'votes', `a${attempt}_${uid}`), {
      uid, targetUids: picks, attempt, submittedAt: serverTimestamp(),
    });
  } catch (e) { denied(e, 'Your vote was not accepted. You may have already voted, or voting just closed.'); }
}

export async function ackReveal(roomId, roundId, uid) {
  try {
    await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'acks', uid), { uid, at: serverTimestamp() });
  } catch (e) { denied(e, 'Could not continue. Try again.'); }
}
