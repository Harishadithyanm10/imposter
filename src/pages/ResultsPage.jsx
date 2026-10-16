import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Skull, Trophy } from 'lucide-react';
import Avatar from '../components/common/Avatar.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { ConfirmDialog } from '../components/common/Modal.jsx';
import EjectionScene from '../components/game/EjectionScene.jsx';
import Confetti from '../components/game/Confetti.jsx';
import { isHidden } from '../lib/engine.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useRoom } from '../contexts/RoomContext.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { nextRound } from '../lib/hostGame.js';
import { leaveRoom, returnToLobby } from '../services/roomService.js';
import { computeStats } from '../services/profileService.js';

function Counts({ title, counts, playerOf }) {
  const list = Object.entries(counts || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...list.map(([, n]) => n));
  return (
    <Card>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <ul className="space-y-2">
        {list.map(([u, n]) => (
          <li key={u} className="flex items-center gap-3">
            <span className="w-20 truncate text-sm sm:w-28">{playerOf(u).displayName}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-800"><motion.div initial={{ width: 0 }} animate={{ width: `${(n / max) * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-brand-500 to-hot-500" /></div>
            <span className="w-6 text-right font-bold tabular-nums">{n}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ResultsPage() {
  const { roomId, room, round, uid, isHost, playerOf, members, role } = useRoom();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [run, busy] = useAsyncAction();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const r = round.result;
  const stats = computeStats(profile);
  const subRounds = room.settings.subRounds ?? 3;
  const gameRound = r.gameRound ?? room.gameRound ?? 1;
  const eliminated = r.eliminated ?? (r.eliminatedUid ? [{ uid: r.eliminatedUid, role: r.eliminatedRole }] : []);
  const [animDone, setAnimDone] = useState(eliminated.length === 0);
  useEffect(() => { setAnimDone(eliminated.length === 0); }, [round.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // imposters still hiding after this vote (caught ones are revealed, so this number is public)
  const remaining = r.impostersLeft ?? (r.matchOver
    ? (r.imposters || []).filter((u) => !eliminated.some((e) => e.uid === u) && !round.left.includes(u)).length
    : Math.max(0, room.settings.imposters - (r.caught || 0)));
  const scene = eliminated.map((e) => ({ name: playerOf(e.uid).displayName, avatar: playerOf(e.uid).avatar, role: e.role }));
  const scores = r.scores || room.scores || { crew: 0, imposters: 0 };
  const title = r.gameOver ? 'Game over' : r.matchOver ? (r.winner === 'NORMAL' ? 'The crew wins this round' : 'The imposters win this round') : `Sub-round ${round.cycle} result`;
  const hiddenWord = room.settings.mrWhite ? 'hidden player' : 'imposter';
  const iWon = r.matchOver && role && (isHidden(role.role) === (r.winner === 'IMPOSTER'));
  const nextLabel = !r.matchOver ? `Next sub-round (${round.cycle + 1}/${subRounds})` : `Next round (${gameRound + 1}/${room.settings.rounds})`;
  const overall = scores.crew === scores.imposters ? 'It is a draw!' : scores.crew > scores.imposters ? 'The crew wins the game!' : 'The imposters win the game!';

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <AnimatePresence>
        {!animDone && <EjectionScene items={scene} remaining={remaining} onDone={() => setAnimDone(true)} />}
      </AnimatePresence>
      {animDone && iWon && <Confetti tint={undefined} />}

      <div>
        <p className="text-sm font-semibold text-brand-300">Round {gameRound}/{room.settings.rounds} · Sub-round {round.cycle}/{subRounds}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {r.matchOver && <p className="mt-1 text-ink-300">{r.reason}</p>}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={eliminated.length ? (r.caught > 0 ? 'border-emerald-500/40' : 'border-hot-500/40') : ''}>
          {eliminated.length ? (
            <div>
              <p className="mb-3 text-sm text-ink-400">Eliminated</p>
              <ul className="space-y-3">
                {eliminated.map((e) => {
                  const p = playerOf(e.uid);
                  return (
                    <li key={e.uid} className="flex items-center gap-3 sm:gap-4">
                      <Avatar name={p.displayName} avatar={p.avatar} size="lg" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-xl font-bold sm:text-2xl">{p.displayName}</p>
                        <p className={isHidden(e.role) ? 'font-semibold text-emerald-300' : 'font-semibold text-hot-400'}>{e.role === 'WHITE' ? 'Was Mr. White!' : e.role === 'IMPOSTER' ? 'Was an imposter!' : 'Was NOT an imposter.'}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div><p className="font-display text-2xl font-bold">Nobody was eliminated</p><p className="text-ink-300">{r.tie ? 'The revote was tied again.' : 'No votes were cast.'}</p></div>
          )}
        </Card>
      </motion.div>

      {r.guesses?.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-bold">Last-stand guesses</h2>
          <ul className="space-y-2">
            {r.guesses.map((g, k) => (
              <motion.li key={g.uid} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 * k }}
                className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 ${g.correct ? 'bg-emerald-500/15 ring-1 ring-emerald-500/40' : 'bg-ink-800/70'}`}>
                <span className="min-w-0 truncate font-semibold">{playerOf(g.uid).displayName}</span>
                <span className={`min-w-0 break-words text-right ${g.correct ? 'font-bold text-emerald-300' : 'text-ink-300'}`}>“{g.guess}” {g.correct ? '✓ correct!' : '✗ wrong'}</span>
              </motion.li>
            ))}
          </ul>
        </Card>
      )}

      {!r.matchOver && (
        <Card className="!p-4">
          <p className="font-semibold">{r.caught > 0 ? `${r.caught} ${hiddenWord}${r.caught > 1 ? 's' : ''} caught, but ${remaining} ${remaining === 1 ? 'is' : 'are'} still hiding.` : `No ${hiddenWord} was caught.`}</p>
          <p className="mt-1 text-sm text-ink-300">The same word continues. Eliminated players now watch as spectators. The crew only wins once <strong className="text-ink-100">every</strong> {hiddenWord} is caught, and there {subRounds - round.cycle === 1 ? 'is' : 'are'} {subRounds - round.cycle} sub-round{subRounds - round.cycle === 1 ? '' : 's'} left to do it.</p>
        </Card>
      )}

      <Counts title="Vote totals" counts={r.counts} playerOf={playerOf} />
      {r.revoteCounts && <Counts title="Revote totals" counts={r.revoteCounts} playerOf={playerOf} />}

      {r.matchOver && (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Skull className="h-5 w-5 text-hot-400" aria-hidden />The reveal</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-ink-400">Imposter{r.imposters.length > 1 ? 's' : ''}{r.mrWhite ? ' and Mr. White' : ''}</p>
              <ul className="mt-1 space-y-1">
                {r.imposters.map((u) => <li key={u} className="font-semibold text-hot-400">{playerOf(u).displayName}</li>)}
                {r.mrWhite && <li className="font-semibold text-slate-200">{playerOf(r.mrWhite).displayName} <span className="text-xs text-ink-400">(Mr. White)</span></li>}
              </ul></div>
            <div className="space-y-2">
              {r.topic && <div><p className="text-sm text-ink-400">Topic</p><p className="font-semibold">{r.topic}</p></div>}
              <div><p className="text-sm text-ink-400">Crew word</p><p className="font-display text-2xl font-bold">{r.word}</p></div>
              <div><p className="text-sm text-ink-400">Imposter's clue</p><p className="font-display text-2xl font-bold text-hot-400">{r.imposterWord}</p></div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-700 pt-4 text-center">
            <div className="rounded-2xl bg-ink-800/70 p-3"><p className="text-xs text-ink-400">Crew round wins</p><p className="font-display text-3xl font-bold text-emerald-300">{scores.crew}</p></div>
            <div className="rounded-2xl bg-ink-800/70 p-3"><p className="text-xs text-ink-400">Imposter round wins</p><p className="font-display text-3xl font-bold text-hot-400">{scores.imposters}</p></div>
          </div>
          {r.gameOver && <p className="mt-3 text-center font-display text-xl font-bold">{overall}</p>}
          <p className="mt-4 flex items-center gap-2 border-t border-ink-700 pt-3 text-sm text-ink-300"><Trophy className="h-4 w-4 text-amber-300" aria-hidden />Your stats: {stats.wins} wins from {stats.played} games ({stats.winRate}%)</p>
        </Card>
      )}

      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:flex-wrap [&>button]:w-full sm:[&>button]:w-auto">
        {isHost ? (
          <>
            {!r.gameOver && <Button size="lg" loading={busy} onClick={() => run(() => nextRound(roomId, members))}>{nextLabel}</Button>}
            <Button size="lg" variant={r.gameOver ? 'primary' : 'secondary'} loading={busy} onClick={() => run(() => returnToLobby(roomId, members, uid))}>{r.gameOver ? 'Play again (back to lobby)' : 'Return to lobby'}</Button>
          </>
        ) : <p className="self-center text-ink-300">Waiting for the host to continue…</p>}
        <Button size="lg" variant="ghost" onClick={() => setConfirmLeave(true)}><LogOut className="h-4 w-4" />Leave room</Button>
      </div>
      <ConfirmDialog open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Leave this room?" message="You will stop taking part in this game." confirmLabel="Leave room" loading={busy}
        onConfirm={async () => { const out = await run(() => leaveRoom(roomId, uid, members)); if (out.ok) navigate('/dashboard', { replace: true }); }} />
    </div>
  );
}
