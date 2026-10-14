import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/lib/engine.js';
import { BANK, pickWords } from '../src/lib/words.js';
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
  for (const entries of Object.values(BANK)) for (const [word, hint] of entries) assert.equal(hint.toLowerCase().includes(word.toLowerCase()), false, `${word} / ${hint}`);
  const tea = pickWords({ category: 'FOOD', recent: BANK.FOOD.map((_, i) => `FOOD:${i}`).filter((id) => id !== 'FOOD:0') });
  assert.equal(tea.word, 'Tea');
  assert.equal(tea.hint, 'A hot drink made from leaves');
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
