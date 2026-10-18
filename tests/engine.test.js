import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/lib/engine.js';
import { BANK, pickWords } from '../src/lib/word.jsx';
import { roomCode, shuffle } from '../src/lib/random.js';

test('maxImposters keeps normals as the majority', () => {
  assert.equal(e.maxImposters(3), 1);
  assert.equal(e.maxImposters(5), 2);
  assert.equal(e.maxImposters(7), 3);
});

test('tallyVotes counts only valid candidates', () => {
  const t = e.tallyVotes([{ targetUid: 'b' }, { targetUid: 'b' }, { targetUid: 'zzz' }], ['a', 'b', 'c']);
  assert.deepEqual(t.counts, { a: 0, b: 2, c: 0 });
  assert.deepEqual(t.leaders, ['b']);
});

test('ties trigger one revote, then eliminate nobody', () => {
  const t = e.tallyVotes([{ targetUid: 'a' }, { targetUid: 'b' }], ['a', 'b', 'c']);
  assert.equal(e.resolveTally(t, 1).needRevote, true);
  const second = e.resolveTally(t, 2);
  assert.equal(second.needRevote, false);
  assert.equal(second.eliminated, null);
  assert.equal(second.tie, true);
});

test('no votes eliminates nobody', () => {
  const r = e.resolveTally(e.tallyVotes([], ['a', 'b']), 1);
  assert.equal(r.eliminated, null);
  assert.equal(r.needRevote, false);
});

test('multi-vote: voters back several players and tallyVotes counts each once', () => {
  const t = e.tallyVotes([{ targetUids: ['a', 'b'] }, { targetUids: ['a', 'c'] }, { targetUids: ['a', 'a'] }, { targetUid: 'c' }], ['a', 'b', 'c', 'd']);
  assert.deepEqual(t.counts, { a: 3, b: 1, c: 2, d: 0 });
});

test('resolveVotes eliminates the top N, never zero-vote players', () => {
  const tally = (counts) => ({ counts });
  // 3 imposters, clear top three
  assert.deepEqual(e.resolveVotes(tally({ a: 5, b: 4, c: 3, d: 1, f: 0 }), { slots: 3, attempt: 1 }).eliminated.sort(), ['a', 'b', 'c']);
  // fewer than N players received votes: only those are eliminated
  assert.deepEqual(e.resolveVotes(tally({ a: 2, b: 0, c: 0 }), { slots: 3, attempt: 1 }).eliminated, ['a']);
  // nobody voted
  assert.deepEqual(e.resolveVotes(tally({ a: 0, b: 0 }), { slots: 2, attempt: 1 }).eliminated, []);
});

test('resolveVotes: a tie for the last slot gets one revote, then spares the tied players', () => {
  const first = e.resolveVotes({ counts: { a: 5, b: 3, c: 3, d: 1 } }, { slots: 2, attempt: 1 });
  assert.equal(first.needRevote, true);
  assert.deepEqual(first.revoteCandidates.sort(), ['b', 'c']);
  assert.equal(first.revoteSlots, 1);
  assert.deepEqual(first.sure, ['a']);
  const second = e.resolveVotes({ counts: { b: 2, c: 2 } }, { slots: 1, attempt: 2, sure: first.sure });
  assert.equal(second.needRevote, false);
  assert.deepEqual(second.eliminated, ['a']); // tied players are spared, the clear one still goes
  assert.equal(second.tie, true);
  const decided = e.resolveVotes({ counts: { b: 3, c: 1 } }, { slots: 1, attempt: 2, sure: first.sure });
  assert.deepEqual(decided.eliminated.sort(), ['a', 'b']);
});

test('single imposter keeps the classic one-vote behaviour', () => {
  assert.deepEqual(e.resolveVotes({ counts: { a: 2, b: 1 } }, { slots: 1, attempt: 1 }).eliminated, ['a']);
  const tie = e.resolveVotes({ counts: { a: 1, b: 1, c: 0 } }, { slots: 1, attempt: 1 });
  assert.equal(tie.needRevote, true);
});

test('round rules: crew wins only when EVERY imposter is caught; a survivor after the last sub-round = imposters win', () => {
  // 2 imposters, one caught in sub-round 1: the round goes on with the same word
  assert.equal(e.evaluateWin({ imposters: 1, normals: 7, cycle: 1, maxCycles: 3 }), null);
  // the last one is caught in sub-round 2: crew wins
  assert.equal(e.evaluateWin({ imposters: 0, normals: 7, cycle: 2, maxCycles: 3 }).winner, 'NORMAL');
  // an imposter is still hiding after the final sub-round: imposters win
  assert.equal(e.evaluateWin({ imposters: 1, normals: 6, cycle: 3, maxCycles: 3 }).winner, 'IMPOSTER');
  assert.equal(e.evaluateWin({ imposters: 3, normals: 6, cycle: 2, maxCycles: 3 }), null);
});

test('victory conditions', () => {
  assert.equal(e.evaluateWin({ imposters: 0, normals: 3, cycle: 1, maxCycles: 3 }).winner, 'NORMAL');
  assert.equal(e.evaluateWin({ imposters: 2, normals: 2, cycle: 1, maxCycles: 3 }).winner, 'IMPOSTER');
  assert.equal(e.evaluateWin({ imposters: 1, normals: 3, cycle: 1, maxCycles: 3 }), null);
  assert.equal(e.evaluateWin({ imposters: 1, normals: 3, cycle: 3, maxCycles: 3 }).winner, 'IMPOSTER');
});

test('countSides ignores players who left', () => {
  assert.deepEqual(e.countSides(['a', 'b', 'c'], { a: 'IMPOSTER', b: 'NORMAL', c: 'NORMAL' }, ['c']), { imposters: 1, normals: 1 });
});

test('host transfer is deterministic and prefers connected, earliest-joined', () => {
  const m = [
    { uid: 'h', joinedAtMs: 1, connectionStatus: 'offline' }, { uid: 'x', joinedAtMs: 5, connectionStatus: 'online' },
    { uid: 'y', joinedAtMs: 3, connectionStatus: 'online' }, { uid: 'z', joinedAtMs: 2, connectionStatus: 'offline' },
  ];
  assert.equal(e.pickNewHost(m, 'h'), 'y');
  const allOff = m.map((x) => ({ ...x, connectionStatus: 'offline' }));
  assert.equal(e.pickNewHost(allOff, 'h'), 'z');
  assert.equal(e.pickNewHost(allOff, 'h', { onlineOnly: true }), null);
});

test('clue cannot contain own secret word', () => {
  assert.equal(e.clueLeaksWord('hot Coffee', 'coffee'), true);
  assert.equal(e.clueLeaksWord('morning brew', 'coffee'), false);
});

test('word bank: clue never contains the word, many topics, recent words avoided, topics rotate', () => {
  assert.ok(Object.keys(BANK).length >= 12);
  for (const entries of Object.values(BANK)) for (const [word, hint] of entries) { assert.equal(hint.toLowerCase().includes(word.toLowerCase()), false, `${word} / ${hint}`); assert.ok(hint.trim().split(/\s+/).length <= 2, `hint too long: ${hint}`); }
  assert.equal(Object.values(BANK).flat().length, 500);
  const tea = pickWords({ category: 'FOOD', recent: BANK.FOOD.map((_, i) => `FOOD:${i}`).filter((id) => id !== 'FOOD:0') });
  assert.equal(tea.word, 'Tea');
  assert.equal(tea.hint, BANK.FOOD[0][1]);
  assert.equal(tea.hint, 'Steeped');
  assert.equal(tea.imposterWord, tea.hint); // imposter gets a clue about Tea, never Coffee
  let prev = null;
  for (let i = 0; i < 60; i += 1) { const r = pickWords({ category: 'RANDOM', recent: prev ? [prev.id] : [] }); if (prev) assert.notEqual(r.category, prev.category); prev = r; }
  const recent = BANK.FOOD.slice(1).map((_, i) => `FOOD:${i + 1}`);
  for (let i = 0; i < 20; i += 1) assert.equal(pickWords({ category: 'FOOD', recent }).id, 'FOOD:0');
});

test('room codes use the safe alphabet', () => {
  for (let i = 0; i < 200; i += 1) assert.match(roomCode(), /^[2-9A-HJKMNP-Z]{6}$/);
  assert.equal(shuffle([1, 2, 3, 4]).length, 4);
});

test('Mr. White counts as hidden; roles must leave the crew a majority', () => {
  const roles = { a: 'IMPOSTER', b: 'WHITE', c: 'NORMAL', d: 'NORMAL', f: 'NORMAL' };
  assert.deepEqual(e.countSides(['a', 'b', 'c', 'd', 'f'], roles), { imposters: 2, normals: 3 });
  assert.equal(e.isHidden('WHITE'), true);
  assert.equal(e.isHidden('NORMAL'), false);
  assert.equal(e.rolesFit(5, 1, true), true);
  assert.equal(e.rolesFit(4, 1, true), false); // 2 hidden of 4 is not a crew majority
  assert.equal(e.rolesFit(3, 1, false), true);
  assert.equal(e.rolesFit(3, 1, true), false);
});

test('final guess: trimmed, case-insensitive, exactly one credited winner', () => {
  assert.equal(e.isCorrectGuess('  tEa ', 'Tea'), true);
  assert.equal(e.isCorrectGuess('ice   cream', 'Ice cream'), true);
  assert.equal(e.isCorrectGuess('', 'Tea'), false);
  assert.equal(e.isCorrectGuess('coffee', 'Tea'), false);
  const out = e.resolveGuesses([
    { uid: 'b', guess: 'tea', at: 200 }, { uid: 'a', guess: 'TEA', at: 100 }, { uid: 'c', guess: 'wrong', at: 50 }, { uid: 'a', guess: 'second try', at: 300 },
  ], 'Tea');
  assert.equal(out.winnerUid, 'a'); // earliest correct guess is credited, once
  assert.equal(out.entries.length, 3); // a second guess from the same player is ignored
  assert.equal(e.resolveGuesses([{ uid: 'c', guess: 'nope' }], 'Tea').winnerUid, null);
});

test('extra hint never contains the word', () => {
  for (const w of ['Tea', 'Ice cream', 'Auto rickshaw', 'Cat']) {
    const h = e.buildExtraHint(w);
    assert.equal(h.toLowerCase().includes(w.toLowerCase()), false, h);
  }
  assert.equal(e.buildExtraHint('Tea'), 'Starts with “T” · 3 letters');
});

test('random events: one at a time, never the same twice in a row, panic halves time (min 5s)', () => {
  assert.equal(e.pickEvent({ enabled: [], rand: () => 0 }), null);
  assert.equal(e.pickEvent({ rand: () => 0.99 }), null); // no event this time
  for (let i = 0; i < 40; i += 1) assert.notEqual(e.pickEvent({ last: 'REVERSE', rand: () => 0.1 + (i % 5) * 0.01 }), 'REVERSE');
  assert.equal(e.pickEvent({ enabled: ['PANIC'], last: 'PANIC', rand: () => 0 }), 'PANIC'); // only one available
  assert.equal(e.clueSeconds({ clueTimer: 30 }, 'PANIC'), 15);
  assert.equal(e.clueSeconds({ clueTimer: 15 }, 'PANIC'), 7);
  assert.equal(e.clueSeconds({ clueTimer: 8 }, 'PANIC'), 5);
  assert.equal(e.clueSeconds({ clueTimer: 30 }, 'REVERSE'), 30);
  assert.equal(e.clueSeconds({ clueTimer: 30 }, null), 30);
});
