import { CATEGORY_LABELS } from '../lib/words.js';

export const GAME_MODES = [
  { value: 'CLASSIC', label: 'Classic Imposter', hint: 'The crew share one word. The imposter only gets a vague clue about it (never the word, never an opposite).' },
  { value: 'CUSTOM', label: 'Custom Words', hint: 'You choose the secret word and the clue the imposter gets.' },
];
export const CATEGORIES = [
  { value: 'RANDOM', label: 'Random topic (picked automatically)' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];
export const DIFFICULTIES = [
  { value: 'ANY', label: 'Any' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];
export const DEFAULT_SETTINGS = {
  roomName: '', maxPlayers: 8, imposters: 1, rounds: 3, subRounds: 3, clueTimer: 30, discussionTimer: 120, votingTimer: 45,
  typedClues: false, mrWhite: false, lastStand: false, extraHint: false, randomEvents: false, reactions: true, guessTimer: 15, gameMode: 'CLASSIC', category: 'RANDOM', difficulty: 'ANY', customWord: '', customImposterWord: '', hasCustomWords: false,
};
// Mirrors the server rule so the UI can guide hosts. The server is the authority.
export const MAX_PLAYERS = 30;
export const MAX_IMPOSTERS = 10;
export const maxImposters = (n) => Math.min(MAX_IMPOSTERS, Math.max(1, Math.floor((n - 1) / 2)));
export const labelOf = (list, value) => (list.find((x) => x.value === value) || {}).label || value;
