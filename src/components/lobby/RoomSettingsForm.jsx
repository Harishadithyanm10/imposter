import { useState } from 'react';
import Input, { Select } from '../common/Input.jsx';
import Button from '../common/Button.jsx';
import Toggle from '../common/Toggle.jsx';
import { CATEGORIES, DEFAULT_SETTINGS, DIFFICULTIES, GAME_MODES, MAX_PLAYERS, maxImposters } from '../../constants/game.js';
import { validateRoomSettings } from '../../utils/validators.js';

const num = (v, min, max) => Math.min(max, Math.max(min, Number(v) || min));

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
        <Input label={`Maximum players (3-${MAX_PLAYERS})`} type="number" min={Math.max(3, minPlayers)} max={MAX_PLAYERS} value={s.maxPlayers} onChange={(e) => setPlayers(e.target.value)} />
        <Select label="Imposters" value={String(imposters)} onChange={(v) => up('imposters', Number(v))}
          options={Array.from({ length: cap }, (_, i) => i + 1).map((n) => ({ value: String(n), label: String(n) }))}
          hint={`Up to ${cap} with ${s.maxPlayers} players${s.mrWhite ? ' (one hidden slot is used by Mr. White)' : ''}.`} />
        <Input label="Rounds (1-10)" type="number" min={1} max={10} value={s.rounds} onChange={(e) => up('rounds', num(e.target.value, 1, 10))}
          hint="Each round has its own secret word and fresh roles." />
        <Input label="Sub-rounds per round (1-5)" type="number" min={1} max={5} value={s.subRounds} onChange={(e) => up('subRounds', num(e.target.value, 1, 5))}
          hint={`Same word, up to ${s.subRounds} vote${s.subRounds === 1 ? '' : 's'}. Voted-out players watch. The crew wins once EVERY imposter is caught; if any imposter survives all ${s.subRounds}, the imposters win.`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Time per player (sec)" type="number" min={15} max={120} value={s.clueTimer} onChange={(e) => up('clueTimer', num(e.target.value, 15, 120))} />
        <Input label="Discussion (sec)" type="number" min={30} max={600} value={s.discussionTimer} onChange={(e) => up('discussionTimer', num(e.target.value, 30, 600))} />
        <Input label="Voting (sec)" type="number" min={15} max={180} value={s.votingTimer} onChange={(e) => up('votingTimer', num(e.target.value, 15, 180))} />
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
          <Input label="Guess time (sec)" type="number" min={5} max={60} value={s.guessTimer} onChange={(e) => up('guessTimer', num(e.target.value, 5, 60))} hint="How long an eliminated player has for their one guess." />
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
