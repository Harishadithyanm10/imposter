
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
 * Round rules (one word = one round, split into sub-rounds). Players eliminated in a sub-round
 * become spectators until the next ROUND, where everyone plays again with new roles.
 *  - The crew wins ONLY when every imposter has been caught (possibly over several sub-rounds).
 *  - The imposters win if they match or outnumber the players still in the game.
 *  - The imposters also win if, after the LAST sub-round, at least one of them is still hiding.
 *  - Otherwise the same word continues into the next sub-round.
 */
function evaluateWin({ imposters, normals, cycle, maxCycles }) {
  if (imposters <= 0) {
    return { winner: 'NORMAL', reason: cycle > 0 ? `Every imposter was caught by sub-round ${cycle}. The crew wins this round.` : 'All imposters were eliminated.' };
  }
  if (imposters >= normals) {
    return { winner: 'IMPOSTER', reason: 'The imposters now match or outnumber the remaining players.' };
  }
  if (cycle >= maxCycles) {
    return { winner: 'IMPOSTER', reason: `${imposters === 1 ? 'An imposter was' : `${imposters} imposters were`} still hiding after all ${maxCycles} sub-round${maxCycles === 1 ? '' : 's'}.` };
  }
  return null;
}

/** Roles on the hidden team: imposters and (in Mr. White mode) Mr. White. */
const isHidden = (role) => role === 'IMPOSTER' || role === 'WHITE';

/** `imposters` counts every hidden player still in the game (imposters + Mr. White). */
function countSides(aliveUids, roles, left = []) {
  let imposters = 0;
  let normals = 0;
  for (const u of aliveUids) {
    if (left.includes(u)) continue;
    if (isHidden(roles[u])) imposters += 1;
    else normals += 1;
  }
  return { imposters, normals };
}

/** Can this many players support the configured roles? (the crew must always start as the majority) */
function rolesFit(n, imposters, mrWhite) {
  const hidden = imposters + (mrWhite ? 1 : 0);
  return n >= 3 && hidden <= maxImposters(n);
}

// ---------- final word guess ("last stand" / Mr. White) ----------
const normalizeGuess = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const isCorrectGuess = (guess, word) => normalizeGuess(guess) !== '' && normalizeGuess(guess) === normalizeGuess(word);

/**
 * Judge every submitted guess. Deterministic: guesses are ordered by submit time, then uid, and the
 * FIRST correct one is credited. The result is a single outcome, so several correct guesses that
 * arrive together can never award the round twice.
 * @param {{uid:string, guess:string, at?:number}[]} guesses
 */
function resolveGuesses(guesses, word) {
  const ordered = [...guesses].sort((a, b) => (a.at || 0) - (b.at || 0) || String(a.uid).localeCompare(String(b.uid)));
  const seen = new Set();
  const entries = [];
  for (const g of ordered) {
    if (seen.has(g.uid)) continue; // one guess per player, ever
    seen.add(g.uid);
    entries.push({ uid: g.uid, guess: String(g.guess).slice(0, 40), correct: isCorrectGuess(g.guess, word) });
  }
  return { entries, winnerUid: entries.find((e) => e.correct)?.uid ?? null };
}

/** A vague extra hint that never contains the word: first letter + number of letters. */
function buildExtraHint(word) {
  const letters = String(word).replace(/\s+/g, '');
  return `Starts with “${letters[0].toUpperCase()}” · ${letters.length} letters`;
}

// ---------- random events between sub-rounds ----------
const EVENT_TYPES = ['REVERSE', 'PANIC'];
const EVENT_CHANCE = 0.65;
/** Pick at most one event; never the same one twice in a row when another is available. */
function pickEvent({ enabled = EVENT_TYPES, last = null, rand = Math.random } = {}) {
  const pool = enabled.filter((e) => EVENT_TYPES.includes(e));
  if (!pool.length || rand() >= EVENT_CHANCE) return null;
  const options = pool.length > 1 ? pool.filter((e) => e !== last) : pool;
  return options[Math.floor(rand() * options.length) % options.length];
}
/** Clue seconds for a sub-round: Panic Mode halves the timer (minimum 5 seconds). */
const clueSeconds = (settings, eventType) => (eventType === 'PANIC' ? Math.max(5, Math.floor(settings.clueTimer / 2)) : settings.clueTimer);

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

export { isHidden, rolesFit, normalizeGuess, isCorrectGuess, resolveGuesses, buildExtraHint, pickEvent, clueSeconds, EVENT_TYPES, maxImposters, tallyVotes, resolveTally, resolveVotes, evaluateWin, countSides, pickNewHost, allVoted, clueLeaksWord };
