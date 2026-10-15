// All-time ranking across every player. Each player owns one public document in "leaderboard/{uid}"
// that Security Rules force to mirror their (already protected) stats, so nobody can fake a score.
import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';

export const leaderboardEntry = (uid, p) => ({
  uid, displayName: p.displayName, avatar: p.avatar || 'violet', gamesPlayed: p.gamesPlayed || 0, gamesWon: p.gamesWon || 0,
});

/**
 * EVERY player, ranked: most wins first, then best win rate, then fewer games played.
 * Players with identical numbers share the same rank. (One read per player: fine on the free plan
 * for thousands of players, since reads are 50,000 per day.)
 */
export async function getLeaderboard(max = 2000) {
  const snap = await getDocs(query(collection(db, 'leaderboard'), orderBy('gamesWon', 'desc'), limit(max)));
  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .map((r) => ({ ...r, gamesPlayed: r.gamesPlayed || 0, gamesWon: r.gamesWon || 0, winRate: r.gamesPlayed ? Math.round((r.gamesWon / r.gamesPlayed) * 100) : 0 }))
    .sort((a, b) => b.gamesWon - a.gamesWon || b.winRate - a.winRate || a.gamesPlayed - b.gamesPlayed || String(a.displayName).localeCompare(String(b.displayName)));
  let rank = 0; let prev = null;
  return rows.map((r, i) => {
    const key = `${r.gamesWon}|${r.winRate}|${r.gamesPlayed}`;
    if (key !== prev) { rank = i + 1; prev = key; }
    return { ...r, rank };
  });
}

/** Players who finished games before the leaderboard existed get listed the first time they open it. */
export async function syncMyLeaderboard(uid, profile) {
  if (!profile) return;
  const ref = doc(db, 'leaderboard', uid);
  const cur = (await getDoc(ref)).data();
  if (cur && cur.gamesPlayed === profile.gamesPlayed && cur.gamesWon === profile.gamesWon
    && cur.displayName === profile.displayName && cur.avatar === (profile.avatar || 'violet')) return;
  await setDoc(ref, leaderboardEntry(uid, profile));
}
