import test from 'node:test';
import assert from 'node:assert/strict';
import * as v from '../src/lib/settings.js';

const base = {
  roomName: 'Friday Night', maxPlayers: 6, imposters: 1, rounds: 3, clueTimer: 30,
  discussionTimer: 120, votingTimer: 45, gameMode: 'CLASSIC', category: 'RANDOM', difficulty: 'ANY',
};

test('valid settings pass and never include custom words', () => {
  const { settings, custom } = v.validateSettings(base);
  assert.equal(settings.maxPlayers, 6);
  assert.equal(custom, null);
  assert.equal('customWord' in settings, false);
});

test('rejects bad numbers and too many imposters', () => {
  assert.throws(() => v.validateSettings({ ...base, maxPlayers: 2 }));
  assert.throws(() => v.validateSettings({ ...base, maxPlayers: 31 }));
  assert.throws(() => v.validateSettings({ ...base, maxPlayers: 4, imposters: 2 }));
  assert.equal(v.validateSettings({ ...base, maxPlayers: 30, imposters: 10 }).settings.maxPlayers, 30);
  assert.throws(() => v.validateSettings({ ...base, maxPlayers: 30, imposters: 11 }));
  assert.throws(() => v.validateSettings({ ...base, gameMode: 'NOPE' }));
  assert.throws(() => v.validateSettings({ ...base, category: 'NOPE' }));
});

test('custom mode requires words and keeps them out of settings', () => {
  assert.throws(() => v.validateSettings({ ...base, gameMode: 'CUSTOM' }));
  const { settings, custom } = v.validateSettings({ ...base, gameMode: 'CUSTOM', customWord: 'Sunrise', customImposterWord: 'Sunset' });
  assert.deepEqual(custom, { customWord: 'Sunrise', customImposterWord: 'Sunset' });
  assert.equal(settings.hasCustomWords, true);
  assert.throws(() => v.validateSettings({ ...base, gameMode: 'CUSTOM', customWord: 'Same', customImposterWord: 'same' }));
  assert.equal(v.validateSettings({ ...base, gameMode: 'CUSTOM' }, { existingHasCustom: true }).settings.hasCustomWords, true);
});

test('cannot shrink below current members', () => {
  assert.throws(() => v.validateSettings({ ...base, maxPlayers: 3 }, { memberCount: 5 }));
});

test('codes, names and clues', () => {
  assert.equal(v.validateCode(' abc234 '), 'ABC234');
  assert.throws(() => v.validateCode('AB'));
  assert.equal(v.validateDisplayName('Harish_A'), 'Harish_A');
  assert.throws(() => v.validateDisplayName('a b'));
  assert.equal(v.validateClue('  hot   drink '), 'hot drink');
  assert.throws(() => v.validateClue('one two three four'));
  assert.throws(() => v.validateClue('<script>'));
});

test('typedClues defaults to timer-only and only true enables typing', () => {
  assert.equal(v.validateSettings(base).settings.typedClues, false);
  assert.equal(v.validateSettings({ ...base, typedClues: true }).settings.typedClues, true);
  assert.equal(v.validateSettings({ ...base, typedClues: 'yes' }).settings.typedClues, false);
});

test('subRounds defaults to 3 and must be 1-5', () => {
  assert.equal(v.validateSettings(base).settings.subRounds, 3);
  assert.equal(v.validateSettings({ ...base, subRounds: 5 }).settings.subRounds, 5);
  assert.throws(() => v.validateSettings({ ...base, subRounds: 6 }));
  assert.throws(() => v.validateSettings({ ...base, subRounds: 0 }));
});

test('special rules default to OFF (reactions ON) and validate player counts', () => {
  const d = v.validateSettings(base).settings;
  assert.deepEqual([d.mrWhite, d.lastStand, d.extraHint, d.randomEvents, d.reactions, d.guessTimer], [false, false, false, false, true, 15]);
  const on = v.validateSettings({ ...base, maxPlayers: 8, imposters: 1, mrWhite: true, lastStand: true, extraHint: true, randomEvents: true, reactions: false, guessTimer: 20 }).settings;
  assert.deepEqual([on.mrWhite, on.lastStand, on.extraHint, on.randomEvents, on.reactions, on.guessTimer], [true, true, true, true, false, 20]);
  assert.throws(() => v.validateSettings({ ...base, maxPlayers: 4, imposters: 1, mrWhite: true })); // 2 hidden of 4
  assert.throws(() => v.validateSettings({ ...base, maxPlayers: 8, imposters: 3, mrWhite: true })); // 4 hidden of 8
  assert.throws(() => v.validateSettings({ ...base, guessTimer: 2 }));
  assert.throws(() => v.validateSettings({ ...base, guessTimer: 99 }));
});
