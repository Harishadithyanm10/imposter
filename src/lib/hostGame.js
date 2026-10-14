// Host-authoritative game logic for the free plan (no Cloud Functions).
// Only the room host's browser runs these writes; Security Rules reject them from anyone else.
// Every transition re-reads the round inside a transaction and checks it is still in the expected
// state, so a double run (or a host handover mid-phase) can never apply a step twice.
import { collection, deleteField, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase.js';
import * as engine from './engine.js';
import { shuffle } from './random.js';
import { pickWords } from './words.js';

const REVEAL_MS = 30_000;
const OFFLINE_SKIP_MS = 10_000;
const GRACE_MS = 1500;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

const ts = (ms) => Timestamp.fromMillis(ms);
export const toMs = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : 0);
export const effectiveAlive = (round) => round.alive.filter((u) => !round.left.includes(u));
const roomRef = (roomId) => doc(db, 'rooms', roomId);
const roundRefOf = (roomId, roundId) => doc(db, 'rooms', roomId, 'rounds', roundId);
const secretsRef = (roomId, id) => doc(db, 'rooms', roomId, 'secrets', id);

function cluePhaseFields({ alive, left }, settings, now) {
  const endsAt = ts(now + settings.clueTimer * 1000);
  return {
    phase: 'CLUE', turnOrder: shuffle(alive.filter((u) => !left.includes(u))), currentTurnIndex: 0,
    turnStartedAt: ts(now), turnEndsAt: endsAt, phaseEndsAt: endsAt, voted: [], voteCandidates: [], voteAttempt: 1,
  };
}

function newRoundData({ matchId, cycle, alive, left = [], players, settings, phase, now }) {
  const base = {
    matchId, cycle, phase, alive, left, players, voted: [], voteAttempt: 1, voteCandidates: [],
    turnOrder: [], currentTurnIndex: 0, result: null, createdAt: serverTimestamp(),
  };
  if (phase === 'ROLE_REVEAL') return { ...base, phaseEndsAt: ts(now + REVEAL_MS) };
  return { ...base, ...cluePhaseFields({ alive, left }, settings, now) };
}

/** Deal a brand-new match (fresh roles and words). Runs inside a transaction, writes only. */
function beginMatchTx(tx, { roomId, room, members, config, meta, now }) {
  const { settings } = room;
  const uids = members.map((m) => m.id);
  const n = uids.length;
  if (n < 3) throw new Error('At least 3 players are needed to play.');
  if (settings.imposters > engine.maxImposters(n)) {
    throw new Error(`With ${n} players you can have at most ${engine.maxImposters(n)} imposter(s). Lower the imposter count in settings.`);
  }
  // The crew all get the same word. The imposter only ever gets a vague CLUE about that word
  // (never a different/opposite word), plus the topic, and has to bluff from it.
  let word; let hint; let topic = null; let category = null; let wordId = null;
  if (settings.gameMode === 'CUSTOM') {
    if (!config?.customWord) throw new Error('Custom words are missing. Set them in room settings.');
    word = config.customWord; hint = config.customImposterWord;
  } else {
    const picked = pickWords({ category: settings.category, difficulty: settings.difficulty, recent: meta?.recent || [] });
    ({ word, hint, category } = picked); topic = picked.categoryLabel; wordId = picked.id;
  }
  const imposterWord = hint;
  const imposters = shuffle(uids).slice(0, settings.imposters); // CSPRNG shuffle
  const roles = {};
  uids.forEach((u) => { roles[u] = imposters.includes(u) ? 'IMPOSTER' : 'NORMAL'; });
  const players = {};
  members.forEach((m) => { players[m.id] = { displayName: m.displayName, avatar: m.avatar || 'violet' }; });

  const rRef = roomRef(roomId);
  const roundRef = doc(collection(rRef, 'rounds'));
  const matchId = doc(collection(rRef, 'secrets')).id;
  tx.set(secretsRef(roomId, matchId), { matchId, word, imposterWord, hint, category, topic, wordId, mode: settings.gameMode, roles, imposters });
  uids.forEach((u) => {
    const isImp = roles[u] === 'IMPOSTER';
    tx.set(doc(rRef, 'privateRoles', u), {
      uid: u, role: roles[u], matchId, roundId: roundRef.id, secretWord: isImp ? hint : word, isClue: isImp, topic,
    });
  });
  tx.set(roundRef, newRoundData({ matchId, cycle: 1, alive: uids, players, settings, phase: 'ROLE_REVEAL', now }));
  tx.update(rRef, {
    status: 'IN_GAME', currentPhase: 'ROLE_REVEAL', currentRoundId: roundRef.id, matchId, currentRound: 1,
    matchCount: (room.matchCount || 0) + 1, expiresAt: ts(now + ROOM_TTL_MS),
  });
  if (wordId) tx.set(secretsRef(roomId, '_meta'), { recent: [...(meta?.recent || []), wordId].slice(-40) }, { merge: true });
}

/** Host presses Start Game in the lobby. */
export async function startMatch(roomId, members) {
  await runTransaction(db, async (tx) => {
    const room = (await tx.get(roomRef(roomId))).data();
    if (!room || room.status !== 'WAITING') throw new Error('The game has already started.');
    const config = (await tx.get(secretsRef(roomId, '_config'))).data();
    const meta = (await tx.get(secretsRef(roomId, '_meta'))).data();
    if (members.length < 3) throw new Error('At least 3 players are needed.');
    if (members.some((m) => m.id !== room.hostUid && !m.isReady)) throw new Error('Every player must be ready first.');
    beginMatchTx(tx, { roomId, room, members, config, meta, now: Date.now() });
  });
}

/** Host presses Next Round on the result screen. */
export async function nextRound(roomId, members) {
  await runTransaction(db, async (tx) => {
    const room = (await tx.get(roomRef(roomId))).data();
    if (!room || room.status !== 'IN_GAME') throw new Error('The game is not running.');
    const round = (await tx.get(roundRefOf(roomId, room.currentRoundId))).data();
    if (!round || round.phase !== 'RESULT') throw new Error('The round is not finished yet.');
    const config = (await tx.get(secretsRef(roomId, '_config'))).data();
    const meta = (await tx.get(secretsRef(roomId, '_meta'))).data();
    const now = Date.now();
    if (round.result?.matchOver) {
      beginMatchTx(tx, { roomId, room, members, config, meta, now }); // fresh roles + fresh words
      return;
    }
    const rRef = roomRef(roomId);
    const roundRef = doc(collection(rRef, 'rounds'));
    tx.set(roundRef, newRoundData({
      matchId: round.matchId, cycle: round.cycle + 1, alive: round.alive.filter((u) => !round.left.includes(u)),
      left: round.left, players: round.players, settings: room.settings, phase: 'CLUE', now,
    }));
    tx.update(rRef, { currentRoundId: roundRef.id, currentPhase: 'CLUE', currentRound: round.cycle + 1 });
  });
}

/** Run a guarded transition: only applies if the round is still in the expected state. */
async function withRound(roomId, { phase, check, withSecrets = false }, fn) {
  return runTransaction(db, async (tx) => {
    const rRef = roomRef(roomId);
    const room = (await tx.get(rRef)).data();
    if (!room || room.status !== 'IN_GAME' || !room.currentRoundId) return false;
    const roundRef = roundRefOf(roomId, room.currentRoundId);
    const round = (await tx.get(roundRef)).data();
    if (!round || (phase && round.phase !== phase) || (check && !check(round))) return false;
    const secrets = withSecrets ? (await tx.get(secretsRef(roomId, round.matchId))).data() : null;
    await fn(tx, { room, round, roundRef, roomRef: rRef, secrets });
    return true;
  });
}

function finishMatchTx(tx, c, { alive, left, win, base }) {
  const { secrets, round } = c;
  const result = {
    ...base, matchOver: true, winner: win.winner, reason: win.reason,
    imposters: secrets.imposters, word: secrets.word, mode: secrets.mode,
    imposterWord: secrets.hint || secrets.imposterWord,
  };
  tx.update(c.roundRef, { phase: 'RESULT', alive, left, result, phaseEndsAt: deleteField() });
  tx.update(c.roomRef, { currentPhase: 'RESULT', lastWinner: win.winner });
  return round;
}

function advanceTurnTx(tx, c, now) {
  const { round, room } = c;
  const next = round.currentTurnIndex + 1;
  if (next < round.turnOrder.length) {
    const endsAt = ts(now + room.settings.clueTimer * 1000);
    tx.update(c.roundRef, { currentTurnIndex: next, turnStartedAt: ts(now), turnEndsAt: endsAt, phaseEndsAt: endsAt });
  } else {
    tx.update(c.roundRef, { phase: 'DISCUSSION', phaseEndsAt: ts(now + room.settings.discussionTimer * 1000) });
    tx.update(c.roomRef, { currentPhase: 'DISCUSSION' });
  }
}

export const startClueFromReveal = (roomId) => withRound(roomId, { phase: 'ROLE_REVEAL' }, (tx, c) => {
  tx.update(c.roundRef, cluePhaseFields(c.round, c.room.settings, Date.now()));
  tx.update(c.roomRef, { currentPhase: 'CLUE' });
});

/** Advance past the current turn. If `skipUid` is given and has no clue yet, a "skipped" marker is written. */
export const advanceTurn = (roomId, expectedIndex, skipUid = null) =>
  withRound(roomId, { phase: 'CLUE', check: (r) => r.currentTurnIndex === expectedIndex }, async (tx, c) => {
    if (skipUid) {
      const clueRef = doc(c.roundRef, 'clues', skipUid);
      if (!(await tx.get(clueRef)).exists()) {
        tx.set(clueRef, { uid: skipUid, clue: null, skipped: true, order: expectedIndex, submittedAt: serverTimestamp() });
      }
    }
    advanceTurnTx(tx, c, Date.now());
  });

export const startVoting = (roomId) => withRound(roomId, { phase: 'DISCUSSION' }, (tx, c) => {
  tx.update(c.roundRef, {
    phase: 'VOTING', phaseEndsAt: ts(Date.now() + c.room.settings.votingTimer * 1000),
    voted: [], voteAttempt: 1, voteCandidates: effectiveAlive(c.round), revoteNotice: false,
  });
  tx.update(c.roomRef, { currentPhase: 'VOTING' });
});

const syncVoted = (roomId, attempt, voted) =>
  withRound(roomId, { phase: 'VOTING', check: (r) => r.voteAttempt === attempt }, (tx, c) => tx.update(c.roundRef, { voted }));

/** Count votes: revote on a tie, eliminate, or end the match. Votes are only ever read by the host. */
const closeVoting = (roomId, attempt, votes, voted) =>
  withRound(roomId, { phase: 'VOTING', check: (r) => r.voteAttempt === attempt, withSecrets: true }, (tx, c) => {
    const { round, room, secrets } = c;
    const candidates = round.voteCandidates.filter((u) => !round.left.includes(u));
    const tally = engine.tallyVotes(votes, candidates);
    const res = engine.resolveTally(tally, round.voteAttempt);
    const now = Date.now();
    if (res.needRevote) {
      tx.update(c.roundRef, { voteAttempt: 2, voteCandidates: res.leaders, voted: [], revoteNotice: true, phaseEndsAt: ts(now + room.settings.votingTimer * 1000) });
      return;
    }
    const alive = round.alive.filter((u) => u !== res.eliminated);
    const base = {
      eliminatedUid: res.eliminated, eliminatedRole: res.eliminated ? secrets.roles[res.eliminated] : null,
      counts: tally.counts, tie: res.tie, attempt: round.voteAttempt, matchOver: false,
    };
    const win = engine.evaluateWin({ ...engine.countSides(alive, secrets.roles, round.left), cycle: round.cycle, maxCycles: room.settings.rounds });
    if (win) { finishMatchTx(tx, c, { alive, left: round.left, win, base }); return; }
    tx.update(c.roundRef, { phase: 'RESULT', alive, result: base, voted, phaseEndsAt: deleteField() });
    tx.update(c.roomRef, { currentPhase: 'RESULT' });
  });

/** Players who deleted their member record are marked as left; the match may end immediately. */
const handleDeparture = (roomId, gone) =>
  withRound(roomId, { check: (r) => !r.result?.matchOver, withSecrets: true }, (tx, c) => {
    const left = [...new Set([...c.round.left, ...gone])];
    const win = engine.evaluateWin({ ...engine.countSides(c.round.alive, c.secrets.roles, left), cycle: 0, maxCycles: Infinity });
    if (win) {
      const base = c.round.result || { eliminatedUid: null, eliminatedRole: null, counts: {}, tie: false, attempt: 1 };
      finishMatchTx(tx, c, { alive: c.round.alive, left, win: { ...win, reason: `${win.reason} (a player left the room)` }, base });
    } else tx.update(c.roundRef, { left });
  });

export const hostSkipTurn = (roomId, index, uid) => advanceTurn(roomId, index, uid);
export const hostEndDiscussion = (roomId) => startVoting(roomId);

/**
 * One tick of the host "server loop". Looks at the latest listener state and performs at most
 * one transition. Called every second and whenever state changes (see hooks/useHostEngine.js).
 */
export async function engineStep(roomId, s) {
  const { room, round, members, membersLoaded, clues, votes, acks, presence } = s;
  if (!membersLoaded || !room || room.status !== 'IN_GAME' || !round || round.id !== room.currentRoundId || round.result?.matchOver) return;
  const now = Date.now();
  const ids = new Set(members.map((m) => m.id));
  const gone = round.alive.filter((u) => !round.left.includes(u) && !ids.has(u));
  if (gone.length) { await handleDeparture(roomId, gone); return; }
  const alive = effectiveAlive(round);

  if (round.phase === 'ROLE_REVEAL') {
    if (acks.filter((u) => alive.includes(u)).length >= alive.length || now >= toMs(round.phaseEndsAt)) await startClueFromReveal(roomId);
  } else if (round.phase === 'CLUE') {
    const cur = round.turnOrder[round.currentTurnIndex];
    if (clues.some((c) => c.uid === cur)) { await advanceTurn(roomId, round.currentTurnIndex, null); return; }
    const offline = presence[cur] === false && now - toMs(round.turnStartedAt) > OFFLINE_SKIP_MS;
    if (!ids.has(cur) || round.left.includes(cur) || offline || now >= toMs(round.turnEndsAt) + GRACE_MS) {
      await advanceTurn(roomId, round.currentTurnIndex, cur);
    }
  } else if (round.phase === 'DISCUSSION') {
    if (now >= toMs(round.phaseEndsAt)) await startVoting(roomId);
  } else if (round.phase === 'VOTING') {
    const attemptVotes = votes.filter((v) => v.attempt === round.voteAttempt && alive.includes(v.uid));
    const voted = [...new Set(attemptVotes.map((v) => v.uid))];
    if (engine.allVoted(alive, voted) || now >= toMs(round.phaseEndsAt) + GRACE_MS) await closeVoting(roomId, round.voteAttempt, attemptVotes, voted);
    else if (voted.length !== round.voted.length || voted.some((u) => !round.voted.includes(u))) await syncVoted(roomId, round.voteAttempt, voted);
  }
}
