import { CATEGORIES } from './words.jsx';
import { maxImposters } from './engine.js';

export const MODES = ['CLASSIC', 'CUSTOM'];
export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'ANY'];
const bad = (msg) => new Error(msg);

function int(v, name, min, max) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${name} must be a whole number between ${min} and ${max}.`);
  return n;
}

function cleanText(v, name, min, max) {
  if (typeof v !== 'string') throw bad(`${name} is required.`);
  const s = v.replace(/\s+/g, ' ').trim();
  if (s.length < min || s.length > max) throw bad(`${name} must be ${min}-${max} characters.`);
  return s;
}

function validateRoomId(v) {
  if (typeof v !== 'string' || !/^[A-Za-z0-9]{10,40}$/.test(v)) throw bad('Invalid room.');
  return v;
}

function validateCode(v) {
  const code = typeof v === 'string' ? v.trim().toUpperCase() : '';
  if (!/^[A-Z0-9]{6}$/.test(code)) throw bad('Room codes are 6 letters or numbers.');
  return code;
}

function validateDisplayName(v) {
  const name = typeof v === 'string' ? v.trim() : '';
  if (!/^[\p{L}\p{N}_.-]{3,20}$/u.test(name)) {
    throw bad('Display name must be 3-20 characters: letters, numbers, dot, dash or underscore.');
  }
  return name;
}

function validateClue(v) {
  const clue = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
  if (clue.length < 1 || clue.length > 40) throw bad('A clue must be 1-40 characters.');
  if (clue.split(' ').length > 3) throw bad('Keep your clue to three words or fewer.');
  if (!/^[\p{L}\p{N}' -]+$/u.test(clue)) throw bad('Clues can only contain letters, numbers, spaces, apostrophes and dashes.');
  return clue;
}

/**
 * Validate room settings. Custom words are returned separately because they must never
 * be stored in the (member-readable) room document.
 * @param {object} input raw client settings
 * @param {{memberCount?:number, existingHasCustom?:boolean}} ctx
 */
function validateSettings(input, { memberCount = 1, existingHasCustom = false } = {}) {
  if (!input || typeof input !== 'object') throw bad('Settings are required.');
  const maxPlayers = int(input.maxPlayers, 'Maximum players', 3, 30);
  if (maxPlayers < memberCount) throw bad(`Maximum players cannot be below the ${memberCount} players already in the room.`);
  const imposters = int(input.imposters, 'Imposters', 1, 10);
  const mrWhite = input.mrWhite === true;
  // Mr. White counts as one more hidden player, so the crew still has to be the majority.
  if (imposters + (mrWhite ? 1 : 0) > maxImposters(maxPlayers)) {
    throw bad(mrWhite
      ? `With ${maxPlayers} players, Mr. White mode allows at most ${Math.max(0, maxImposters(maxPlayers) - 1)} imposter(s). Raise the player limit or lower the imposters.`
      : `With ${maxPlayers} players you can have at most ${maxImposters(maxPlayers)} imposter(s).`);
  }
  const gameMode = input.gameMode;
  if (!MODES.includes(gameMode)) throw bad('Unknown game mode.');
  const category = input.category === 'RANDOM' ? 'RANDOM' : input.category;
  if (category !== 'RANDOM' && !CATEGORIES.includes(category)) throw bad('Unknown word category.');
  const difficulty = input.difficulty;
  if (!DIFFICULTIES.includes(difficulty)) throw bad('Unknown difficulty.');

  let custom = null;
  if (gameMode === 'CUSTOM' && (input.customWord || input.customImposterWord)) {
    const word = cleanText(input.customWord, 'Secret word', 2, 30);
    const imposterWord = cleanText(input.customImposterWord, 'Imposter clue', 2, 40);
    if (word.toLowerCase() === imposterWord.toLowerCase()) throw bad('The clue must be different from the secret word.');
    custom = { customWord: word, customImposterWord: imposterWord };
  }
  const hasCustomWords = gameMode === 'CUSTOM' && (!!custom || existingHasCustom);
  if (gameMode === 'CUSTOM' && !hasCustomWords) throw bad('Custom mode needs a secret word and a clue for the imposter.');

  const settings = {
    roomName: cleanText(input.roomName, 'Room name', 3, 30),
    maxPlayers,
    imposters,
    rounds: int(input.rounds, 'Rounds', 1, 10), // rounds = words per game
    subRounds: int(input.subRounds ?? 3, 'Sub-rounds', 1, 5), // chances to catch the imposter per word
    clueTimer: int(input.clueTimer, 'Clue timer', 15, 120),
    discussionTimer: int(input.discussionTimer, 'Discussion timer', 30, 600),
    votingTimer: int(input.votingTimer, 'Voting timer', 15, 180),
    typedClues: input.typedClues === true, // false = timer only (players speak), true = players type clues
    // optional rule sets (all OFF by default, except spectator reactions)
    mrWhite, // one extra hidden player with no word and no clue
    lastStand: input.lastStand === true, // an eliminated imposter gets one private guess at the word
    extraHint: input.extraHint === true, // each imposter may reveal one extra hint per round
    randomEvents: input.randomEvents === true, // Reverse order / Panic mode between sub-rounds
    reactions: input.reactions !== false, // eliminated players can send emoji reactions
    guessTimer: int(input.guessTimer ?? 15, 'Guess timer', 5, 60),
    gameMode,
    category,
    difficulty,
    hasCustomWords,
  };
  return { settings, custom };
}

export { validateSettings, validateRoomId, validateCode, validateDisplayName, validateClue };
