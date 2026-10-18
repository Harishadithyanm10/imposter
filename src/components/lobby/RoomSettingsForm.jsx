import { useState } from 'react';
import Input, { Select } from '../common/Input.jsx';
import Button from '../common/Button.jsx';
import Toggle from '../common/Toggle.jsx';
import { CATEGORIES, DEFAULT_SETTINGS, DIFFICULTIES, GAME_MODES, MAX_PLAYERS, maxImposters } from '../../constants/game.js';
import { validateRoomSettings } from '../../utils/validators.js';

const num = (v, min, max) => Math.min(max, Math.max(min, Number(v) || min));

// Dropdown helpers. Number inputs were unusable on phones: every keystroke was clamped to the minimum,
// so you could not clear the box to type a new value. Dropdowns always work and are touch friendly.
const seq = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const fmtSec = (s) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)} min ${s % 60} sec` : `${s} sec`);
/** Options for a list of values; keeps the current value selectable even if it is not in the preset list. */
const opts = (values, current, label = String) => {
  const all = values.includes(current) || current == null ? values : [...values, current].sort((x, y) => x - y);
  return all.map((v) => ({ value: String(v), label: label(v) }));
};
const CLUE_SECS = [15, 20, 30, 45, 60, 90, 120];
const DISCUSSION_SECS = [30, 45, 60, 90, 120, 180, 240, 300, 420, 600];
const VOTING_SECS = [15, 20, 30, 45, 60, 90, 120, 180];
const GUESS_SECS = [5, 10, 15, 20, 30, 45, 60];

/** Shared by Create Room and the host's "Change settings" dialog. */
export default function RoomSettingsForm({ initial, onSubmit, submitLabel, loading, minPlayers = 3 }) {
  const [s, setS] = useState({ ...DEFAULT_SETTINGS, ...initial });
  const [errors, setErrors] = useState({});
  const cap = Math.max(1, maxImposters(s.maxPlayers) - (s.mrWhite ? 1 : 0)); // Mr. White takes one hidden slot
  const imposters = Math.min(s.imposters, cap);
  const whiteImpossible = s.mrWhite && maxImposters(s.maxPlayers) < 2; // needs 5+ players for 1 imposter + Mr. White
  const mode = GAME_MODES.find((m) => m.value === s.gameMode);

  const up = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const setPlayers = (v) => {
    const n = num(v, Math.max(3, minPlayers), MAX_PLAYERS);
    setS((x) => ({ ...x, maxPlayers: n, imposters: Math.min(x.imposters, Math.max(1, maxImposters(n) - (x.mrWhite ? 1 : 0))) }));
  };

  function submit(e) {
    e.preventDefault();
    const found = validateRoomSettings(s);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (whiteImpossible) { setErrors({ ...found, mrWhite: 'Mr. White mode needs a player limit of at least 5.' }); return; }
    onSubmit({ ...s, imposters, roomName: s.roomName.trim() });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Input label="Room name" value={s.roomName} maxLength={30} onChange={(e) => up('roomName', e.target.value)} error={errors.roomName} placeholder="Friday night crew" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={`Maximum players (3-${MAX_PLAYERS})`} value={String(s.maxPlayers)} onChange={setPlayers}
          options={opts(seq(Math.max(3, minPlayers), MAX_PLAYERS), s.maxPlayers)} />
        <Select label="Imposters" value={String(imposters)} onChange={(v) => up('imposters', Number(v))}
          options={Array.from({ length: cap }, (_, i) => i + 1).map((n) => ({ value: String(n), label: String(n) }))}
          hint={`Up to ${cap} with ${s.maxPlayers} players${s.mrWhite ? ' (one hidden slot is used by Mr. White)' : ''}.`} />
        <Select label="Rounds (1-10)" value={String(s.rounds)} onChange={(v) => up('rounds', Number(v))} options={opts(seq(1, 10), s.rounds)}
          hint="Each round has its own secret word and fresh roles." />
        <Select label="Sub-rounds per round (1-5)" value={String(s.subRounds)} onChange={(v) => up('subRounds', Number(v))} options={opts(seq(1, 5), s.subRounds)}
          hint={`Same word, up to ${s.subRounds} vote${s.subRounds === 1 ? '' : 's'}. Voted-out players watch. The crew wins once EVERY imposter is caught; if any imposter survives all ${s.subRounds}, the imposters win.`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Time per player" value={String(s.clueTimer)} onChange={(v) => up('clueTimer', Number(v))} options={opts(CLUE_SECS, s.clueTimer, fmtSec)} />
        <Select label="Discussion" value={String(s.discussionTimer)} onChange={(v) => up('discussionTimer', Number(v))} options={opts(DISCUSSION_SECS, s.discussionTimer, fmtSec)} />
        <Select label="Voting" value={String(s.votingTimer)} onChange={(v) => up('votingTimer', Number(v))} options={opts(VOTING_SECS, s.votingTimer, fmtSec)} />
      </div>

      <Select label="How are clues given?" value={s.typedClues ? 'typed' : 'timer'} onChange={(v) => up('typedClues', v === 'typed')}
        options={[{ value: 'timer', label: 'Timer only: players say their clue out loud' }, { value: 'typed', label: 'Players type their clue' }]}
        hint={s.typedClues ? 'Each player types a short clue on their turn. Everyone sees it.' : 'No typing. Each player gets a timer to speak (in person or on a call) and taps Done.'} />

      <Select label="Game mode" value={s.gameMode} onChange={(v) => up('gameMode', v)} options={GAME_MODES} hint={mode?.hint} />

      {s.gameMode === 'CUSTOM' ? (
        <div className="grid gap-4 rounded-2xl bg-ink-800/60 p-4 sm:grid-cols-2">
          <Input label="Secret word" value={s.customWord} onChange={(e) => up('customWord', e.target.value)} error={errors.customWord} maxLength={30}
            placeholder={s.hasCustomWords ? 'Leave blank to keep current' : 'Tea'} />
          <Input label="Clue for the imposter" value={s.customImposterWord} onChange={(e) => up('customImposterWord', e.target.value)} error={errors.customImposterWord} maxLength={40}
            placeholder={s.hasCustomWords ? 'Leave blank to keep current' : 'A hot drink made from leaves'} />
          <p className="text-xs text-ink-400 sm:col-span-2">Words are stored privately on the server and are not visible to other players until the game ends.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Topic" value={s.category} onChange={(v) => up('category', v)} options={CATEGORIES} />
          <Select label="Difficulty" value={s.difficulty} onChange={(v) => up('difficulty', v)} options={DIFFICULTIES} />
        </div>
      )}

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold text-ink-100">Special rules <span className="font-normal text-ink-400">(all optional)</span></legend>
        <Toggle label="Mr. White" checked={!!s.mrWhite} onChange={(v) => up('mrWhite', v)}
          hint="One extra hidden player gets NO word and NO clue. If voted out, they get one private guess at the word. Needs 5+ players; the crew must stay the majority." />
        {errors.mrWhite && <p role="alert" className="text-xs text-hot-400">{errors.mrWhite}</p>}
        <Toggle label="Last stand" checked={!!s.lastStand} onChange={(v) => up('lastStand', v)}
          hint="An imposter who is voted out gets one private, timed guess at the secret word. A correct guess steals the round for the imposters." />
        {(s.lastStand || s.mrWhite) && (
          <Select label="Guess time" value={String(s.guessTimer)} onChange={(v) => up('guessTimer', Number(v))} options={opts(GUESS_SECS, s.guessTimer, fmtSec)} hint="How long an eliminated player has for their one guess." />
        )}
        <Toggle label="One more hint" checked={!!s.extraHint} onChange={(v) => up('extraHint', v)}
          hint="Each imposter can reveal one extra private hint per round (first letter and length of the word), during the discussion only." />
        <Toggle label="Random events" checked={!!s.randomEvents} onChange={(v) => up('randomEvents', v)}
          hint="Between sub-rounds there may be Reverse Order (the speaking order flips) or Panic Mode (half the clue time). One at a time, never the same twice in a row." />
        <Toggle label="Spectator reactions" checked={s.reactions !== false} onChange={(v) => up('reactions', v)}
          hint="Eliminated players can send emoji reactions while they watch." />
      </fieldset>

      <Button type="submit" size="lg" className="w-full" loading={loading}>{submitLabel}</Button>
    </form>
  );
}
