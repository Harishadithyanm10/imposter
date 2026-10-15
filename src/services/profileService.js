import { collection, collectionGroup, doc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { auth, db } from './firebase.js';
import { validateDisplayName } from '../lib/settings.js';
import { leaveRoom } from './roomService.js';
import { leaderboardEntry } from './leaderboardService.js';

export const subscribeProfile = (uid, onData, onError) =>
  onSnapshot(doc(db, 'users', uid), (s) => onData(s.exists() ? { id: s.id, ...s.data() } : null), onError);

export async function updateProfile(uid, current, { displayName, fullName, avatar }) {
  const name = validateDisplayName(displayName);
  await runTransaction(db, async (tx) => {
    const lbRef = doc(db, 'leaderboard', uid);
    const onBoard = (await tx.get(lbRef)).exists(); // keep the public ranking name/avatar in step
    const patch = { fullName: (fullName || '').trim().slice(0, 60), avatar };
    if (name.toLowerCase() !== current.displayNameLower) {
      const newRef = doc(db, 'usernames', name.toLowerCase());
      if ((await tx.get(newRef)).exists()) {
        const e = new Error('That display name is already taken.'); e.code = 'app/display-name-taken'; throw e;
      }
      tx.set(newRef, { uid });
      tx.delete(doc(db, 'usernames', current.displayNameLower));
    }
    patch.displayName = name; patch.displayNameLower = name.toLowerCase();
    tx.update(doc(db, 'users', uid), patch);
    if (onBoard) tx.update(lbRef, { displayName: name, avatar });
  });
}

export async function getHistory(uid, max = 50) {
  const snap = await getDocs(query(collection(db, 'users', uid, 'history'), orderBy('completedAt', 'desc'), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export const computeStats = (profile) => {
  const played = profile?.gamesPlayed || 0;
  const wins = profile?.gamesWon || 0;
  return { played, wins, losses: Math.max(0, played - wins), winRate: played ? Math.round((wins / played) * 100) : 0 };
};

/** Leaves every room, deletes history, the name reservation and profile, then the Auth user. */
export async function deleteAccount(uid, profile) {
  const memberships = await getDocs(query(collectionGroup(db, 'members'), where('uid', '==', uid)));
  for (const m of memberships.docs) {
    const roomId = m.ref.parent.parent.id;
    try {
      const members = (await getDocs(collection(db, 'rooms', roomId, 'members'))).docs.map((d) => ({ id: d.id, ...d.data() }));
      await leaveRoom(roomId, uid, members);
    } catch { /* room may already be closed */ }
  }
  const history = await getDocs(collection(db, 'users', uid, 'history'));
  const batch = writeBatch(db);
  history.docs.forEach((d) => batch.delete(d.ref));
  if (profile?.displayNameLower) batch.delete(doc(db, 'usernames', profile.displayNameLower));
  batch.delete(doc(db, 'leaderboard', uid));
  batch.delete(doc(db, 'users', uid));
  await batch.commit();
  await deleteUser(auth.currentUser);
}

/**
 * Records one finished game for the signed-in player. Rules only accept it once per match,
 * for a round the host finalised, with the player's real role and the matching result.
 */
export async function recordResult({ roomId, uid, roomName, round, role }) {
  const matchId = round.matchId;
  const hRef = doc(db, 'users', uid, 'history', matchId);
  const uRef = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const [h, u] = [await tx.get(hRef), await tx.get(uRef)];
    if (h.exists() || !u.exists()) return;
    const won = (role === 'IMPOSTER') === (round.result.winner === 'IMPOSTER');
    tx.set(hRef, {
      matchId, roomId, roundId: round.id, roomName, completedAt: serverTimestamp(),
      role, won, rounds: round.cycle, winner: round.result.winner, reason: round.result.reason,
      word: round.result.word, playerCount: Object.keys(round.players).length,
    });
    const next = { gamesPlayed: u.data().gamesPlayed + 1, gamesWon: u.data().gamesWon + (won ? 1 : 0) };
    tx.update(uRef, { ...next, lastMatchId: matchId });
    tx.set(doc(db, 'leaderboard', uid), leaderboardEntry(uid, { ...u.data(), ...next })); // public ranking entry
  });
}
