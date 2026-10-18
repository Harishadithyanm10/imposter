// "Pass the phone": the whole game on ONE device, no account and no room needed.
// Everything runs locally in this component (nothing is sent to Firebase).
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Eye, Minus, Plus, Smartphone, Trophy, Vote, X } from 'lucide-react';
import Avatar from '../components/common/Avatar.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import CountdownRing from '../components/common/CountdownRing.jsx';
import Input, { Select } from '../components/common/Input.jsx';
import EjectionScene from '../components/game/EjectionScene.jsx';
import { AVATAR_KEYS } from '../constants/avatars.js';
import { CATEGORIES, DIFFICULTIES, maxImposters } from '../constants/game.js';
import * as engine from '../lib/engine.js';
import { shuffle } from '../lib/random.js';
import { pickWords } from '../lib/words.js';
import { cx } from '../utils/cx.js';

const DEFAULTS = { imposters: 1, rounds: 3, subRounds: 3, clueTimer: 30, discussionTimer: 120, category: 'RANDOM', difficulty: 'ANY' };
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || min));

// ---------- pure game steps ----------
function dealRound({ players, settings, round, scores, recent }) {
  const picked = pickWords({ category: settings.category, difficulty: settings.difficulty, recent });
  const ids = players.map((p) => p.id);
  const imposters = shuffle(ids).slice(0, settings.imposters);
  const roles = Object.fromEntries(ids.map((id) => [id, imposters.includes(id) ? 'IMPOSTER' : 'NORMAL']));
  return {
    players, settings, round, sub: 1, scores, recent: [...recent, picked.id].slice(-40),
    word: picked.word, hint: picked.hint, topic: picked.categoryLabel, roles, imposters, alive: ids,
    phase: 'DEAL', dealIdx: 0, revealed: false, result: null,
  };
}
const startClues = (g) => ({ ...g, phase: 'CLUES', turnOrder: shuffle(g.alive), turnIdx: 0, turnEndsAt: Date.now() + g.settings.clueTimer * 1000, result: null });
const startVote = (g) => ({
  ...g, phase: 'VOTE', voteAttempt: 1, voteSlots: Math.max(1, engine.countSides(g.alive, g.roles).imposters), voteCandidates: g.alive,
  pendingElim: [], firstCounts: null, voters: g.alive, voterIdx: 0, votes: [], voteStage: 'pass', revoteNotice: false,
});

/** Same rules as the online game: one pick per imposter, top picks are out, ties get one revote. */
function closeVote(g) {
  const tally = engine.tallyVotes(g.votes, g.voteCandidates);
  const res = engine.resolveVotes(tally, { slots: g.voteSlots, attempt: g.voteAttempt, sure: g.pendingElim });
  if (res.needRevote) {
    return { ...g, voteAttempt: 2, voteCandidates: res.revoteCandidates, voteSlots: res.revoteSlots, pendingElim: res.sure, firstCounts: tally.counts, votes: [], voterIdx: 0, voteStage: 'pass', revoteNotice: true };
  }
  const alive = g.alive.filter((u) => !res.eliminated.includes(u));
  const eliminated = res.eliminated.map((u) => ({ uid: u, role: g.roles[u] }));
  const caught = eliminated.filter((e) => e.role === 'IMPOSTER').length;
  const sides = engine.countSides(alive, g.roles);
  const win = engine.evaluateWin({ ...sides, cycle: g.sub, maxCycles: g.settings.subRounds });
  const scores = win ? { crew: g.scores.crew + (win.winner === 'NORMAL' ? 1 : 0), imposters: g.scores.imposters + (win.winner === 'IMPOSTER' ? 1 : 0) } : g.scores;
  return {
    ...g, alive, scores, phase: eliminated.length ? 'EJECT' : 'RESULT',
    result: { eliminated, caught, counts: g.firstCounts || tally.counts, tie: res.tie, win, remaining: sides.imposters, gameOver: !!win && g.round >= g.settings.rounds },
  };
}

// ---------- small UI pieces ----------
function PassScreen({ player, label, buttonLabel, onReady }) {
  return (
    <Card className="mx-auto max-w-md space-y-5 text-center">
      <Smartphone className="mx-auto h-8 w-8 text-brand-300" aria-hidden />
      <p className="text-sm text-ink-400">{label}</p>
      <div className="flex flex-col items-center gap-3"><Avatar name={player.name} avatar={player.avatar} size="lg" /><p className="max-w-full break-words font-display text-3xl font-extrabold">{player.name}</p></div>
      <Button size="lg" className="w-full" onClick={onReady}>{buttonLabel}</Button>
      <p className="text-xs text-ink-400">Make sure nobody else is looking at the screen.</p>
    </Card>
  );
}

function VotePick({ voter, g, onLock }) {
  const cands = g.voteCandidates.filter((u) => u !== voter.id);
  const need = Math.max(1, Math.min(g.voteSlots, cands.length));
  const [picks, setPicks] = useState([]);
  const byId = Object.fromEntries(g.players.map((p) => [p.id, p]));
  const toggle = (u) => setPicks((cur) => (cur.includes(u) ? cur.filter((x) => x !== u) : cur.length >= need ? [...cur.slice(1), u] : [...cur, u]));
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="text-center">
        <p className="text-sm text-ink-400">{voter.name}, {g.voteAttempt === 2 ? 'revote: pick from the tied players' : 'who are the imposters?'}</p>
        <p className="mt-1 font-semibold">Pick {need} · selected {picks.length}/{need}</p>
      </div>
      <ul className="grid gap-2.5">
        {cands.map((u) => {
          const p = byId[u]; const on = picks.includes(u);
          return (
            <li key={u}>
              <button onClick={() => toggle(u)} aria-pressed={on}
                className={cx('flex min-h-14 w-full items-center gap-3 rounded-2xl border p-3 text-left transition', on ? 'border-hot-500 bg-hot-600/15 ring-2 ring-hot-500/40' : 'border-ink-700 bg-ink-900 hover:border-ink-500')}>
                <Avatar name={p.name} avatar={p.avatar} /><span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>{on && <Check className="h-5 w-5 shrink-0 text-hot-400" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-3"><Button size="lg" className="w-full" disabled={picks.length !== need} onClick={() => onLock(picks)}><Vote className="h-5 w-5" aria-hidden />Lock in vote</Button></div>
    </div>
  );
}

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink-100">{label}</p>
      <div className="flex items-center justify-between rounded-xl border border-ink-600 bg-ink-800 p-1">
        <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(clamp(value - 1, min, max))} className="grid h-10 w-11 place-items-center rounded-lg hover:bg-ink-700"><Minus className="h-4 w-4" /></button>
        <span className="font-display text-lg font-bold tabular-nums">{value}</span>
        <button type="button" aria-label={`More ${label}`} onClick={() => onChange(clamp(value + 1, min, max))} className="grid h-10 w-11 place-items-center rounded-lg hover:bg-ink-700"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ---------- page ----------
export default function PassAndPlayPage() {
  const [names, setNames] = useState(['', '', '']);
  const [cfg, setCfg] = useState(DEFAULTS);
  const [error, setError] = useState('');
  const [g, setG] = useState(null);

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const capImp = maxImposters(Math.max(3, filled.length));
  const imposters = Math.min(cfg.imposters, capImp);

  function start(e) {
    e.preventDefault();
    const lower = filled.map((n) => n.toLowerCase());
    if (filled.length < 3) return setError('Enter at least 3 player names.');
    if (new Set(lower).size !== lower.length) return setError('Every player needs a different name.');
    setError('');
    const players = filled.map((name, i) => ({ id: `p${i}`, name, avatar: AVATAR_KEYS[i % AVATAR_KEYS.length] }));
    setG(dealRound({ players, settings: { ...cfg, imposters }, round: 1, scores: { crew: 0, imposters: 0 }, recent: [] }));
  }

  // timers for the speaking turns and the discussion
  useEffect(() => {
    if (!g || (g.phase !== 'CLUES' && g.phase !== 'DISCUSS')) return undefined;
    const ends = g.phase === 'CLUES' ? g.turnEndsAt : g.discEndsAt;
    const t = setTimeout(() => (g.phase === 'CLUES' ? nextTurn() : setG((p) => (p.phase === 'DISCUSS' ? startVote(p) : p))), Math.max(0, ends - Date.now()) + 80);
    return () => clearTimeout(t);
  }, [g?.phase, g?.turnIdx, g?.turnEndsAt, g?.discEndsAt]); // eslint-disable-line react-hooks/exhaustive-deps

  function nextTurn() {
    setG((p) => {
      if (p.phase !== 'CLUES') return p;
      if (p.turnIdx + 1 < p.turnOrder.length) return { ...p, turnIdx: p.turnIdx + 1, turnEndsAt: Date.now() + p.settings.clueTimer * 1000 };
      return { ...p, phase: 'DISCUSS', discEndsAt: Date.now() + p.settings.discussionTimer * 1000 };
    });
  }
  const byId = useMemo(() => Object.fromEntries((g?.players || []).map((p) => [p.id, p])), [g?.players]);
  const shell = (children) => (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <header className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-ink-300 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden />Home</Link>
        {g ? <button onClick={() => { if (window.confirm('Quit this game?')) setG(null); }} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-ink-400 hover:text-hot-400"><X className="h-4 w-4" aria-hidden />Quit</button> : <span className="text-sm text-ink-400">One phone, no account</span>}
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-2">{children}</main>
    </div>
  );

  // ----- setup -----
  if (!g) {
    return shell(
      <form onSubmit={start} noValidate className="space-y-6">
        <div><h1 className="text-3xl font-bold sm:text-4xl">Pass the phone</h1><p className="mt-1 text-ink-300">Play with friends in the same room using just this phone. Everyone takes a turn to secretly see their word.</p></div>
        <Card className="space-y-3">
          <h2 className="text-lg font-bold">Players ({filled.length})</h2>
          {names.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <Avatar name={n || `${i + 1}`} avatar={AVATAR_KEYS[i % AVATAR_KEYS.length]} size="sm" />
              <Input className="min-w-0 flex-1" aria-label={`Player ${i + 1} name`} value={n} maxLength={14} placeholder={`Player ${i + 1}`} autoComplete="off"
                onChange={(e) => setNames((cur) => cur.map((x, k) => (k === i ? e.target.value : x)))} />
              {names.length > 3 && <button type="button" aria-label={`Remove player ${i + 1}`} onClick={() => setNames((cur) => cur.filter((_, k) => k !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-400 hover:bg-ink-800 hover:text-hot-400"><X className="h-4 w-4" /></button>}
            </div>
          ))}
          {names.length < 30 && <Button type="button" variant="secondary" size="sm" onClick={() => setNames((cur) => [...cur, ''])}><Plus className="h-4 w-4" aria-hidden />Add player</Button>}
          {error && <p role="alert" className="text-sm text-hot-400">{error}</p>}
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Game rules</h2>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Imposters" value={String(imposters)} onChange={(v) => setCfg((c) => ({ ...c, imposters: Number(v) }))} options={Array.from({ length: capImp }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} />
            <Stepper label="Rounds" value={cfg.rounds} min={1} max={10} onChange={(v) => setCfg((c) => ({ ...c, rounds: v }))} />
            <Stepper label="Sub-rounds" value={cfg.subRounds} min={1} max={5} onChange={(v) => setCfg((c) => ({ ...c, subRounds: v }))} />
            <Stepper label="Seconds each" value={cfg.clueTimer} min={10} max={120} onChange={(v) => setCfg((c) => ({ ...c, clueTimer: v }))} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Topic" value={cfg.category} onChange={(v) => setCfg((c) => ({ ...c, category: v }))} options={CATEGORIES} />
            <Select label="Difficulty" value={cfg.difficulty} onChange={(v) => setCfg((c) => ({ ...c, difficulty: v }))} options={DIFFICULTIES} />
          </div>
          <p className="text-xs text-ink-400">Each round has a new word. In every sub-round players speak a clue, talk, then vote. The crew wins a round once EVERY imposter is caught (voted-out players just watch). If any imposter survives all {cfg.subRounds} sub-rounds, the imposters win. Next round, everyone plays again with new roles.</p>
        </Card>
        <Button type="submit" size="lg" className="w-full">Start game</Button>
      </form>,
    );
  }

  const label = `Round ${g.round}/${g.settings.rounds} · Sub-round ${g.sub}/${g.settings.subRounds}`;
  const head = (title, sub) => <div className="mb-4"><p className="text-xs font-semibold text-brand-300 sm:text-sm">{label}</p><h1 className="text-2xl font-bold sm:text-4xl">{title}</h1>{sub && <p className="mt-1 text-sm text-ink-300">{sub}</p>}</div>;

  // ----- deal: pass the phone, each player peeks at their card -----
  if (g.phase === 'DEAL') {
    const p = g.players[g.dealIdx]; const imp = g.roles[p.id] === 'IMPOSTER'; const last = g.dealIdx === g.players.length - 1;
    return shell(<>
      {head('Secret roles', `Player ${g.dealIdx + 1} of ${g.players.length}`)}
      {!g.revealed ? <PassScreen player={p} label="Pass the phone to" buttonLabel={`I'm ${p.name}, show my card`} onReady={() => setG((x) => ({ ...x, revealed: true }))} /> : (
        <Card className="mx-auto max-w-md space-y-4 text-center">
          <Eye className="mx-auto h-7 w-7 text-brand-300" aria-hidden />
          <p className="text-sm text-ink-400">{p.name}, you are</p>
          <p className={cx('font-display text-4xl font-extrabold', imp ? 'text-hot-400' : 'text-emerald-300')}>{imp ? 'THE IMPOSTER' : 'CREW'}</p>
          <p className="text-xs uppercase tracking-wide text-ink-400">Topic: {g.topic}</p>
          <div className="rounded-2xl bg-ink-800 p-4"><p className="text-sm text-ink-300">{imp ? 'Your clue (not the real word)' : 'Your word'}</p><p className="mt-1 break-words font-display text-3xl font-bold">{imp ? g.hint : g.word}</p></div>
          <p className="text-sm text-ink-300">{imp ? 'Everyone else shares one secret word. You only have this clue. Blend in!' : 'Say a clue that shows you know the word without giving it away.'}</p>
          <Button size="lg" className="w-full" onClick={() => setG((x) => (last ? startClues(x) : { ...x, dealIdx: x.dealIdx + 1, revealed: false }))}>{last ? 'Hide card & start' : 'Hide card & pass on'}</Button>
        </Card>
      )}
    </>);
  }

  // ----- clues: speak in turn with a timer -----
  if (g.phase === 'CLUES') {
    const cur = byId[g.turnOrder[g.turnIdx]];
    return shell(<>
      {head('Clue time', 'Say one short clue out loud when it is your turn.')}
      <Card className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3"><Avatar name={cur.name} avatar={cur.avatar} size="lg" /><div className="min-w-0"><p className="text-sm text-ink-400">Now speaking</p><p className="truncate font-display text-2xl font-bold">{cur.name}</p></div></div>
        <CountdownRing endsAtMs={g.turnEndsAt} total={g.settings.clueTimer} />
      </Card>
      <Button size="lg" className="mb-4 w-full" onClick={nextTurn}><Check className="h-5 w-5" aria-hidden />{g.turnIdx + 1 < g.turnOrder.length ? 'Done, next speaker' : 'Done, start discussion'}</Button>
      <ol className="space-y-2">{g.turnOrder.map((u, i) => <li key={u} className={cx('flex items-center gap-3 rounded-2xl px-3 py-2.5', i === g.turnIdx ? 'bg-brand-600/20 ring-1 ring-brand-500/60' : 'bg-ink-800/60')}><span className="w-5 text-center text-xs font-bold text-ink-400">{i + 1}</span><Avatar name={byId[u].name} avatar={byId[u].avatar} size="sm" /><span className="min-w-0 flex-1 truncate font-semibold">{byId[u].name}</span>{i < g.turnIdx && <Check className="h-4 w-4 text-emerald-400" aria-hidden />}</li>)}</ol>
    </>);
  }

  // ----- discussion -----
  if (g.phase === 'DISCUSS') {
    return shell(<>
      {head('Discussion', 'Talk it out. Who is bluffing? Voting starts when the timer ends.')}
      <Card className="mb-4 flex items-center justify-between gap-4"><p className="font-display text-xl font-bold">Time to talk</p><CountdownRing endsAtMs={g.discEndsAt} total={g.settings.discussionTimer} /></Card>
      <p className="mb-4 rounded-2xl bg-ink-900/80 p-4 text-sm text-ink-300 ring-1 ring-ink-700"><strong className="text-ink-100">{engine.countSides(g.alive, g.roles).imposters}</strong> imposter{engine.countSides(g.alive, g.roles).imposters === 1 ? ' is' : 's are'} still hiding among the {g.alive.length} players still in. Everyone will pick that many players.</p>
      <Button size="lg" className="w-full" onClick={() => setG((p) => startVote(p))}><Vote className="h-5 w-5" aria-hidden />Start voting now</Button>
    </>);
  }

  // ----- voting: pass the phone, each player votes in secret -----
  if (g.phase === 'VOTE') {
    const voter = byId[g.voters[g.voterIdx]];
    const lock = (picks) => setG((p) => {
      const votes = [...p.votes, { uid: voter.id, targetUids: picks }];
      return p.voterIdx + 1 < p.voters.length ? { ...p, votes, voterIdx: p.voterIdx + 1, voteStage: 'pass', revoteNotice: false } : closeVote({ ...p, votes });
    });
    return shell(<>
      {head(g.voteAttempt === 2 ? 'Revote' : 'Vote', `Voter ${g.voterIdx + 1} of ${g.voters.length}`)}
      {g.revoteNotice && g.voterIdx === 0 && g.voteStage === 'pass' && <p className="mb-4 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-200 ring-1 ring-amber-500/30">It was a tie for the last {g.voteSlots === 1 ? 'spot' : 'spots'}. Vote again, only between the tied players.</p>}
      {g.voteStage === 'pass'
        ? <PassScreen player={voter} label="Pass the phone to" buttonLabel={`I'm ${voter.name}, vote`} onReady={() => setG((p) => ({ ...p, voteStage: 'pick' }))} />
        : <VotePick key={`${g.voteAttempt}-${voter.id}`} voter={voter} g={g} onLock={lock} />}
    </>);
  }

  // ----- Among Us style ejection -----
  if (g.phase === 'EJECT') {
    return shell(<>
      {head('Votes are in')}
      <EjectionScene items={g.result.eliminated.map((e) => ({ name: byId[e.uid].name, avatar: byId[e.uid].avatar, role: e.role }))} remaining={g.result.remaining} onDone={() => setG((p) => ({ ...p, phase: 'RESULT' }))} />
    </>);
  }

  // ----- result -----
  const r = g.result; const win = r.win;
  const counts = Object.entries(r.counts || {}).sort((a, b) => b[1] - a[1]);
  const overall = g.scores.crew === g.scores.imposters ? 'It is a draw!' : g.scores.crew > g.scores.imposters ? 'The crew wins the game!' : 'The imposters win the game!';
  return shell(<div className="space-y-4">
    {head(r.gameOver ? 'Game over' : win ? (win.winner === 'NORMAL' ? 'The crew wins this round' : 'The imposters win this round') : `Sub-round ${g.sub} result`)}
    {win && <p className="-mt-2 text-ink-300">{win.reason}</p>}
    <Card>
      {r.eliminated.length ? (<><p className="mb-3 text-sm text-ink-400">Eliminated</p><ul className="space-y-3">{r.eliminated.map((e) => <li key={e.uid} className="flex items-center gap-3"><Avatar name={byId[e.uid].name} avatar={byId[e.uid].avatar} size="lg" /><div className="min-w-0"><p className="truncate font-display text-xl font-bold">{byId[e.uid].name}</p><p className={e.role === 'IMPOSTER' ? 'font-semibold text-emerald-300' : 'font-semibold text-hot-400'}>{e.role === 'IMPOSTER' ? 'Was an imposter!' : 'Was NOT an imposter.'}</p></div></li>)}</ul></>)
        : <div><p className="font-display text-2xl font-bold">Nobody was eliminated</p><p className="text-ink-300">{r.tie ? 'The revote was tied again.' : 'No votes were cast.'}</p></div>}
    </Card>
    {!win && <Card className="!p-4"><p className="font-semibold">{r.caught > 0 ? `${r.caught} imposter${r.caught > 1 ? 's' : ''} caught, but ${r.remaining} ${r.remaining === 1 ? 'is' : 'are'} still hiding.` : 'No imposter was caught.'}</p><p className="mt-1 text-sm text-ink-300">Same word, next sub-round. Eliminated players just watch. {g.settings.subRounds - g.sub} sub-round{g.settings.subRounds - g.sub === 1 ? '' : 's'} left to catch every imposter.</p></Card>}
    <Card><h2 className="mb-3 text-lg font-bold">Vote totals</h2><ul className="space-y-1.5">{counts.map(([u, n]) => <li key={u} className="flex justify-between gap-3 text-sm"><span className="truncate">{byId[u].name}</span><span className="font-bold tabular-nums">{n}</span></li>)}</ul></Card>
    {win && (
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className="text-sm text-ink-400">Imposter{g.imposters.length > 1 ? 's' : ''}</p><ul className="mt-1">{g.imposters.map((u) => <li key={u} className="font-semibold text-hot-400">{byId[u].name}</li>)}</ul></div>
          <div className="space-y-2"><div><p className="text-sm text-ink-400">Crew word</p><p className="font-display text-2xl font-bold">{g.word}</p></div><div><p className="text-sm text-ink-400">Imposter's clue</p><p className="font-display text-2xl font-bold text-hot-400">{g.hint}</p></div></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-700 pt-4 text-center">
          <div className="rounded-2xl bg-ink-800/70 p-3"><p className="text-xs text-ink-400">Crew round wins</p><p className="font-display text-3xl font-bold text-emerald-300">{g.scores.crew}</p></div>
          <div className="rounded-2xl bg-ink-800/70 p-3"><p className="text-xs text-ink-400">Imposter round wins</p><p className="font-display text-3xl font-bold text-hot-400">{g.scores.imposters}</p></div>
        </div>
        {r.gameOver && <p className="mt-3 flex items-center justify-center gap-2 text-center font-display text-xl font-bold"><Trophy className="h-5 w-5 text-amber-300" aria-hidden />{overall}</p>}
      </Card>
    )}
    <div className="flex flex-col gap-3 pb-4">
      {!win && <Button size="lg" onClick={() => setG((p) => startClues({ ...p, sub: p.sub + 1 }))}>Next sub-round ({g.sub + 1}/{g.settings.subRounds})</Button>}
      {win && !r.gameOver && <Button size="lg" onClick={() => setG((p) => dealRound({ players: p.players, settings: p.settings, round: p.round + 1, scores: p.scores, recent: p.recent }))}>Next round ({g.round + 1}/{g.settings.rounds}), new roles</Button>}
      {r.gameOver && <Button size="lg" onClick={() => setG(null)}>Play again</Button>}
      <Button size="lg" variant="ghost" to="/">Exit to home</Button>
    </div>
  </div>);
}
