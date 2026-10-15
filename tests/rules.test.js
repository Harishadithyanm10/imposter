// Run with: npm run test:rules   (starts the Firestore emulator)
import test, { before, after, beforeEach } from 'node:test';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, deleteField, setDoc, updateDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';

const ROOM = 'room1234567890';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-imposter',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
  });
});
after(async () => { await env.cleanup(); });

const as = (uid) => env.authenticatedContext(uid).firestore();
const member = (uid, ready = false) => ({ uid, displayName: uid, avatar: 'violet', isReady: ready, joinedAt: serverTimestamp() });
const admin = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

beforeEach(async () => {
  await env.clearFirestore();
  await admin(async (db) => {
    for (const u of ['alice', 'bob', 'carol']) await setDoc(doc(db, `users/${u}`), { uid: u, displayName: u, displayNameLower: u, avatar: 'violet', gamesPlayed: 0, gamesWon: 0 });
    await setDoc(doc(db, `rooms/${ROOM}`), { hostUid: 'alice', status: 'IN_GAME', roomCode: 'ABC234', settings: { maxPlayers: 4, imposters: 1 }, memberCount: 2, currentPhase: 'CLUE', currentRoundId: 'r1' });
    await setDoc(doc(db, `rooms/${ROOM}/members/alice`), { uid: 'alice', displayName: 'alice', isReady: true });
    await setDoc(doc(db, `rooms/${ROOM}/members/bob`), { uid: 'bob', displayName: 'bob', isReady: false });
    await setDoc(doc(db, `rooms/${ROOM}/privateRoles/alice`), { uid: 'alice', role: 'IMPOSTER', secretWord: 'Tea', matchId: 'm1' });
    await setDoc(doc(db, `rooms/${ROOM}/privateRoles/bob`), { uid: 'bob', role: 'NORMAL', secretWord: 'Coffee', matchId: 'm1' });
    await setDoc(doc(db, `rooms/${ROOM}/rounds/r1`), { matchId: 'm1', phase: 'CLUE', turnOrder: ['bob', 'alice'], currentTurnIndex: 0, alive: ['alice', 'bob'], left: [], voteAttempt: 1, voteCandidates: ['alice', 'bob'], voteSlots: 1, result: null });
    await setDoc(doc(db, `rooms/${ROOM}/secrets/m1`), { word: 'Coffee', roles: { alice: 'IMPOSTER', bob: 'NORMAL' } });
    await setDoc(doc(db, 'roomCodes/ABC234'), { roomId: ROOM, hostUid: 'alice' });
    await setDoc(doc(db, 'usernames/alice'), { uid: 'alice' });
  });
});

test('signed-out users cannot read private data', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, `rooms/${ROOM}`)));
  await assertFails(getDoc(doc(db, 'users/alice')));
});

test('non-members cannot list members or read rounds/clues', async () => {
  await assertFails(getDocs(collection(as('carol'), `rooms/${ROOM}/members`)));
  await assertFails(getDoc(doc(as('carol'), `rooms/${ROOM}/rounds/r1`)));
  await assertSucceeds(getDocs(collection(as('bob'), `rooms/${ROOM}/members`)));
});

test('roles: owner-only reads, host-only writes', async () => {
  await assertSucceeds(getDoc(doc(as('bob'), `rooms/${ROOM}/privateRoles/bob`)));
  await assertFails(getDoc(doc(as('bob'), `rooms/${ROOM}/privateRoles/alice`)));
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}/privateRoles/bob`), { role: 'IMPOSTER' }));
  await assertSucceeds(setDoc(doc(as('alice'), `rooms/${ROOM}/privateRoles/bob`), { uid: 'bob', role: 'NORMAL', secretWord: 'X', matchId: 'm2' }));
});

test('secrets are host-only', async () => {
  await assertFails(getDoc(doc(as('bob'), `rooms/${ROOM}/secrets/m1`)));
  await assertSucceeds(getDoc(doc(as('alice'), `rooms/${ROOM}/secrets/m1`)));
});

test('only the host can change room state, rounds and results', async () => {
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}`), { hostUid: 'bob' }));
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}`), { settings: { maxPlayers: 30, imposters: 1 } }));
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1`), { result: { winner: 'IMPOSTER' } }));
  await assertSucceeds(updateDoc(doc(as('alice'), `rooms/${ROOM}/rounds/r1`), { currentTurnIndex: 1 }));
});

test('joining requires member count +1 in the same batch and respects capacity', async () => {
  const db = as('carol');
  await assertFails(setDoc(doc(db, `rooms/${ROOM}/members/carol`), member('carol'))); // game running
  await admin((a) => updateDoc(doc(a, `rooms/${ROOM}`), { status: 'WAITING' }));
  await assertFails(setDoc(doc(as('carol'), `rooms/${ROOM}/members/carol`), member('carol'))); // no count update
  const ok = writeBatch(as('carol'));
  ok.set(doc(as('carol'), `rooms/${ROOM}/members/carol`), member('carol'));
  ok.update(doc(as('carol'), `rooms/${ROOM}`), { memberCount: 3 });
  await assertSucceeds(ok.commit());
  await admin((a) => updateDoc(doc(a, `rooms/${ROOM}`), { memberCount: 4, status: 'WAITING' }));
  await admin((a) => setDoc(doc(a, 'users/dave'), { uid: 'dave', displayName: 'dave', displayNameLower: 'dave', gamesPlayed: 0, gamesWon: 0 }));
  const full = writeBatch(as('dave'));
  full.set(doc(as('dave'), `rooms/${ROOM}/members/dave`), member('dave'));
  full.update(doc(as('dave'), `rooms/${ROOM}`), { memberCount: 5 });
  await assertFails(full.commit()); // over capacity
});

test('cannot join under someone else’s display name', async () => {
  await admin((a) => updateDoc(doc(a, `rooms/${ROOM}`), { status: 'WAITING' }));
  const b = writeBatch(as('carol'));
  b.set(doc(as('carol'), `rooms/${ROOM}/members/carol`), { ...member('carol'), displayName: 'alice' });
  b.update(doc(as('carol'), `rooms/${ROOM}`), { memberCount: 3 });
  await assertFails(b.commit());
});

test('ready flag: own only, lobby only; host may reset', async () => {
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}/members/bob`), { isReady: true })); // in game
  await admin((a) => updateDoc(doc(a, `rooms/${ROOM}`), { status: 'WAITING' }));
  await assertSucceeds(updateDoc(doc(as('bob'), `rooms/${ROOM}/members/bob`), { isReady: true }));
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}/members/alice`), { isReady: false }));
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}/members/bob`), { displayName: 'x' }));
  await assertSucceeds(updateDoc(doc(as('alice'), `rooms/${ROOM}/members/bob`), { isReady: false }));
});

test('clues: only the player whose turn it is, once, without their own word', async () => {
  const clue = (uid, text, order = 0) => ({ uid, clue: text, skipped: false, order, submittedAt: serverTimestamp() });
  await assertFails(setDoc(doc(as('alice'), `rooms/${ROOM}/rounds/r1/clues/alice`), clue('alice', 'warm'))); // not alice's turn
  await assertFails(setDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/clues/bob`), clue('bob', 'coffee'))); // leaks word
  await assertSucceeds(setDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/clues/bob`), clue('bob', 'morning')));
  await assertFails(setDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/clues/bob`), clue('bob', 'again'))); // no overwrite
  await assertFails(setDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/clues/alice`), clue('alice', 'forged'))); // other uid
});

test('votes: voter-only reads, one per attempt, no self vote, only in voting', async () => {
  const vote = (uid, target, attempt = 1) => ({ uid, targetUids: Array.isArray(target) ? target : [target], attempt, submittedAt: serverTimestamp() });
  await assertFails(setDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/votes/a1_bob`), vote('bob', 'alice'))); // phase is CLUE
  await admin((a) => updateDoc(doc(a, `rooms/${ROOM}/rounds/r1`), { phase: 'VOTING' }));
  await assertFails(setDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/votes/a1_bob`), vote('bob', 'bob'))); // self
  await assertFails(setDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/votes/a1_bob`), vote('bob', ['alice', 'alice']))); // more picks than imposters / duplicates
  await assertSucceeds(setDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/votes/a1_bob`), vote('bob', 'alice')));
  await assertFails(setDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/votes/a1_bob`), vote('bob', 'alice'))); // duplicate
  await assertSucceeds(getDoc(doc(as('bob'), `rooms/${ROOM}/rounds/r1/votes/a1_bob`)));
  await assertFails(getDoc(doc(as('carol'), `rooms/${ROOM}/rounds/r1/votes/a1_bob`)));
  await assertSucceeds(getDocs(collection(as('alice'), `rooms/${ROOM}/rounds/r1/votes`))); // host tallies
  await assertFails(getDocs(collection(as('bob'), `rooms/${ROOM}/rounds/r1/votes`)));
});

test('host takeover only after the host has been flagged for 30s', async () => {
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}`), { hostUid: 'bob' }));
  await assertSucceeds(updateDoc(doc(as('bob'), `rooms/${ROOM}`), { hostDisconnectedAt: serverTimestamp() }));
  const b1 = writeBatch(as('bob')); // too early
  b1.update(doc(as('bob'), `rooms/${ROOM}`), { hostUid: 'bob', hostDisconnectedAt: deleteField() });
  await assertFails(b1.commit());
  await admin((a) => updateDoc(doc(a, `rooms/${ROOM}`), { hostDisconnectedAt: Timestamp.fromMillis(Date.now() - 60000) }));
  await assertSucceeds(updateDoc(doc(as('bob'), `rooms/${ROOM}`), { hostUid: 'bob', hostDisconnectedAt: deleteField() }));
});

test('profile and stats cannot be forged', async () => {
  await assertSucceeds(updateDoc(doc(as('alice'), 'users/alice'), { avatar: 'teal' }));
  await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { gamesWon: 999 }));
  await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { gamesPlayed: 1, gamesWon: 1, lastMatchId: 'm9' })); // no history record
  await assertFails(getDoc(doc(as('bob'), 'users/alice')));
});

test('history: one verified result per match; stats follow it', async () => {
  await admin(async (a) => {
    await updateDoc(doc(a, `rooms/${ROOM}/rounds/r1`), { result: { matchOver: true, winner: 'NORMAL' } });
  });
  const hist = (won) => ({ matchId: 'm1', roomId: ROOM, roundId: 'r1', roomName: 'x', completedAt: serverTimestamp(), role: 'NORMAL', won, rounds: 1, winner: 'NORMAL', reason: 'r', word: 'Coffee', playerCount: 2 });
  const record = (won, gamesWon) => {
    const db = as('bob'); const b = writeBatch(db);
    b.set(doc(db, 'users/bob/history/m1'), hist(won));
    b.update(doc(db, 'users/bob'), { gamesPlayed: 1, gamesWon, lastMatchId: 'm1' });
    return b.commit();
  };
  await assertFails(record(false, 0)); // bob is NORMAL and NORMAL won, so won must be true
  await assertFails(record(true, 0)); // stats must match the history record
  await assertSucceeds(record(true, 1));
  await assertFails(record(true, 1)); // cannot count the same match twice
});

test('usernames and room codes are create-only', async () => {
  await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'usernames/alice')));
  await assertFails(setDoc(doc(as('bob'), 'usernames/alice'), { uid: 'bob' }));
  await assertFails(updateDoc(doc(as('bob'), 'roomCodes/ABC234'), { roomId: 'other' }));
  await assertFails(setDoc(doc(as('bob'), 'roomCodes/ABC234'), { roomId: 'x', hostUid: 'bob' }));
});

test('presence heartbeat: only your own lastSeen, server time only', async () => {
  await assertSucceeds(updateDoc(doc(as('bob'), `rooms/${ROOM}/members/bob`), { lastSeen: serverTimestamp() }));
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}/members/alice`), { lastSeen: serverTimestamp() }));
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}/members/bob`), { lastSeen: Timestamp.fromMillis(1) }));
  await assertFails(updateDoc(doc(as('bob'), `rooms/${ROOM}/members/bob`), { lastSeen: serverTimestamp(), isReady: true }));
});

test('leaderboard: public to read, but your entry can only mirror your real stats', async () => {
  const entry = (over = {}) => ({ uid: 'bob', displayName: 'bob', avatar: 'violet', gamesPlayed: 0, gamesWon: 0, ...over });
  await assertSucceeds(setDoc(doc(as('bob'), 'leaderboard/bob'), entry()));
  await assertFails(setDoc(doc(as('bob'), 'leaderboard/bob'), entry({ gamesPlayed: 50, gamesWon: 50 }))); // faked score
  await assertFails(setDoc(doc(as('bob'), 'leaderboard/bob'), entry({ displayName: 'someone-else' })));
  await assertFails(setDoc(doc(as('alice'), 'leaderboard/bob'), entry())); // someone else's entry
  await assertSucceeds(getDoc(doc(as('carol'), 'leaderboard/bob')));
  await assertSucceeds(getDocs(collection(as('carol'), 'leaderboard')));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'leaderboard/bob')));
  await assertSucceeds(setDoc(doc(as('bob'), 'leaderboard/bob'), entry())); // idempotent resync
  await assertSucceeds(updateDoc(doc(as('bob'), 'leaderboard/bob'), { gamesWon: 0 }));
});
