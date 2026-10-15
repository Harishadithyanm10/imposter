
// Pure rules engine: no Firebase imports, fully unit-testable.

/** Most imposters allowed so normal players always start as the majority. */
// Imposters must stay a strict minority; hard cap of 10 (matches firestore.rules).
const maxImposters = (n) => Math.min(10, Math.max(1, Math.floor((n - 1) / 2)));

/** Each vote may name several targets (`targetUids`, one per imposter) or a single legacy `targetUid`. */
function tallyVotes(votes, candidates) {
  const counts = {};
  for (const c of candidates) counts[c] = 0;
  for (const v of votes) {
    if (!v) continue;
    const targets = Array.isArray(v.targetUids) ? v.targetUids : v.targetUid ? [v.targetUid] : [];
    for (const t of new Set(targets)) { // a voter can only back each player once
      if (Object.prototype.hasOwnProperty.call(counts, t)) counts[t] += 1;
    }
  }
  const max = Math.max(0, ...Object.values(counts));
  const leaders = max > 0 ? candidates.filter((c) => counts[c] === max) : [];
  return { counts, max, leaders };
}

/** Tie => revote among leaders (attempt 1). A tied revote eliminates nobody. */
function resolveTally(tally, attempt) {
  const { leaders } = tally;
  if (leaders.length === 0) return { eliminated: null, tie: false, needRevote: false, leaders };
  if (leaders.length === 1) return { eliminated: leaders[0], tie: false, needRevote: false, leaders };
  if (attempt === 1) return { eliminated: null, tie: true, needRevote: true, leaders };
  return { eliminated: null, tie: true, needRevote: false, leaders };
}

/**
 * Multi-vote elimination. Every voter backs `slots` players (one per imposter); the `slots`
 * players with the most votes are eliminated. Players with zero votes are never eliminated.
 * If several players are tied for the LAST open slot(s), those tied players get ONE revote
 * (each voter picks `revoteSlots` of them); players who were already clearly out stay out.
 * If the revote is still tied, only the players who were clearly out are eliminated.
 * With slots = 1 this behaves exactly like a normal single-vote tie-break.
 *
 * @param {{counts:Object<string,number>}} tally from tallyVotes
 * @param {{slots:number, attempt:number, sure?:string[]}} opts `sure` = already-decided eliminations from attempt 1
 */
function resolveVotes(tally, { slots, attempt, sure = [] }) {
  const ranked = Object.entries(tally.counts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const base = { tie: false, needRevote: false, revoteCandidates: [], revoteSlots: 0, sure: [] };
  if (!ranked.length) return { ...base, eliminated: [...sure] };
  if (ranked.length <= slots) return { ...base, eliminated: [...sure, ...ranked.map(([u]) => u)] };
  const cutoff = ranked[slots - 1][1];
  const clear = ranked.filter(([, n]) => n > cutoff).map(([u]) => u);
  const edge = ranked.filter(([, n]) => n === cutoff).map(([u]) => u);
  const needed = slots - clear.length;
  if (edge.length <= needed) return { ...base, eliminated: [...sure, ...clear, ...edge] };
  if (attempt === 1) {
    return { ...base, eliminated: [], tie: true, needRevote: true, revoteCandidates: edge, revoteSlots: needed, sure: [...sure, ...clear] };
  }
  return { ...base, eliminated: [...sure, ...clear], tie: true };
}

/**
 * Round rules (one word = one round, split into sub-rounds):
 *  - If any imposter is caught in a sub-round, the crew wins the round.
 *  - If the imposters match or outnumber the remaining players, the imposters win the round.
 *  - If the imposters escape the LAST sub-round (cycle >= maxCycles), the imposters win the round.
 *  - Otherwise play the next sub-round.
 */
function evaluateWin({ imposters, normals, cycle, maxCycles, caught = 0 }) {
  if (caught > 0) {
    return { winner: 'NORMAL', reason: `${caught > 1 ? `${caught} imposters were` : 'An imposter was'} caught in sub-round ${cycle}. The crew wins this round.` };
  }
  if (imposters <= 0) return { winner: 'NORMAL', reason: 'All imposters were eliminated.' };
  if (imposters >= normals) {
    return { winner: 'IMPOSTER', reason: 'The imposters now match or outnumber the remaining players.' };
  }
  if (cycle >= maxCycles) {
    return { winner: 'IMPOSTER', reason: `The imposters escaped all ${maxCycles} sub-round${maxCycles === 1 ? '' : 's'}.` };
  }
  return null;
}

function countSides(aliveUids, roles, left = []) {
  let imposters = 0;
  let normals = 0;
  for (const u of aliveUids) {
    if (left.includes(u)) continue;
    if (roles[u] === 'IMPOSTER') imposters += 1;
    else normals += 1;
  }
  return { imposters, normals };
}

/** Deterministic host transfer: earliest-joined connected member, else earliest-joined member. */
function pickNewHost(members, excludeUid, { onlineOnly = false } = {}) {
  const candidates = members.filter((m) => m.uid !== excludeUid);
  const online = candidates.filter((m) => m.connectionStatus !== 'offline');
  const pool = onlineOnly ? online : online.length ? online : candidates;
  if (!pool.length) return null;
  pool.sort((a, b) => (a.joinedAtMs || 0) - (b.joinedAtMs || 0) || (a.uid < b.uid ? -1 : 1));
  return pool[0].uid;
}

const allVoted = (eligible, voted) => eligible.length > 0 && eligible.every((u) => voted.includes(u));

/** Clue must not contain the player's own secret word. */
function clueLeaksWord(clue, secretWord) {
  if (!secretWord) return false;
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const c = ` ${norm(clue)} `;
  return c.includes(` ${norm(secretWord)} `);
}

export { maxImposters, tallyVotes, resolveTally, resolveVotes, evaluateWin, countSides, pickNewHost, allVoted, clueLeaksWord };
