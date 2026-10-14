
// Pure rules engine: no Firebase imports, fully unit-testable.

/** Most imposters allowed so normal players always start as the majority. */
// Imposters must stay a strict minority; hard cap of 10 (matches firestore.rules).
const maxImposters = (n) => Math.min(10, Math.max(1, Math.floor((n - 1) / 2)));

function tallyVotes(votes, candidates) {
  const counts = {};
  for (const c of candidates) counts[c] = 0;
  for (const v of votes) {
    if (v && Object.prototype.hasOwnProperty.call(counts, v.targetUid)) counts[v.targetUid] += 1;
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

function evaluateWin({ imposters, normals, cycle, maxCycles }) {
  if (imposters <= 0) return { winner: 'NORMAL', reason: 'All imposters were eliminated.' };
  if (imposters >= normals) {
    return { winner: 'IMPOSTER', reason: 'The imposters now match or outnumber the remaining players.' };
  }
  if (cycle >= maxCycles) {
    return { winner: 'IMPOSTER', reason: 'The round limit was reached and an imposter is still hiding.' };
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

export { maxImposters, tallyVotes, resolveTally, evaluateWin, countSides, pickNewHost, allVoted, clueLeaksWord };
