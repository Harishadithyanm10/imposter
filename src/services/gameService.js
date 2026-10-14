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

export async function submitVote(roomId, roundId, uid, attempt, targetUid) {
  try {
    await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'votes', `a${attempt}_${uid}`), {
      uid, targetUid, attempt, submittedAt: serverTimestamp(),
    });
  } catch (e) { denied(e, 'Your vote was not accepted. You may have already voted, or voting just closed.'); }
}

export async function ackReveal(roomId, roundId, uid) {
  try {
    await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'acks', uid), { uid, at: serverTimestamp() });
  } catch (e) { denied(e, 'Could not continue. Try again.'); }
}
