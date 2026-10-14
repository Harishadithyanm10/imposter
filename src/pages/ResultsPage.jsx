import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Skull, Trophy } from 'lucide-react';
import Avatar from '../components/common/Avatar.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { ConfirmDialog } from '../components/common/Modal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useRoom } from '../contexts/RoomContext.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { nextRound } from '../lib/hostGame.js';
import { leaveRoom, returnToLobby } from '../services/roomService.js';
import { computeStats } from '../services/profileService.js';
import { useState } from 'react';

export default function ResultsPage() {
  const { roomId, room, round, uid, isHost, playerOf, members } = useRoom();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [run, busy] = useAsyncAction();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const r = round.result;
  const stats = computeStats(profile);
  const counts = Object.entries(r.counts || {}).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(1, ...counts.map(([, n]) => n));
  const elim = r.eliminatedUid ? playerOf(r.eliminatedUid) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-300">Round {round.cycle} of {room.settings.rounds}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">{r.matchOver ? (r.winner === 'NORMAL' ? 'The crew wins' : 'The imposters win') : 'Round result'}</h1>
        {r.matchOver && <p className="mt-1 text-ink-300">{r.reason}</p>}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={elim ? (r.eliminatedRole === 'IMPOSTER' ? 'border-emerald-500/40' : 'border-hot-500/40') : ''}>
          {elim ? (
            <div className="flex items-center gap-4">
              <Avatar name={elim.displayName} avatar={elim.avatar} size="lg" />
              <div>
                <p className="text-sm text-ink-400">Eliminated</p>
                <p className="font-display text-2xl font-bold">{elim.displayName}</p>
                <p className={r.eliminatedRole === 'IMPOSTER' ? 'font-semibold text-emerald-300' : 'font-semibold text-hot-400'}>
                  {r.eliminatedRole === 'IMPOSTER' ? 'Was an imposter!' : 'Was NOT an imposter.'}
                </p>
              </div>
            </div>
          ) : (
            <div><p className="font-display text-2xl font-bold">Nobody was eliminated</p><p className="text-ink-300">{r.tie ? 'The revote was tied again.' : 'No votes were cast.'}</p></div>
          )}
        </Card>
      </motion.div>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Vote totals</h2>
        <ul className="space-y-2">
          {counts.map(([u, n]) => (
            <li key={u} className="flex items-center gap-3">
              <span className="w-20 truncate text-sm sm:w-28">{playerOf(u).displayName}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-800"><motion.div initial={{ width: 0 }} animate={{ width: `${(n / maxCount) * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-brand-500 to-hot-500" /></div>
              <span className="w-6 text-right font-bold tabular-nums">{n}</span>
            </li>
          ))}
        </ul>
      </Card>

      {r.matchOver && (
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Skull className="h-5 w-5 text-hot-400" aria-hidden />The reveal</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-ink-400">Imposter{r.imposters.length > 1 ? 's' : ''}</p>
              <ul className="mt-1 space-y-1">{r.imposters.map((u) => <li key={u} className="font-semibold text-hot-400">{playerOf(u).displayName}</li>)}</ul></div>
            <div className="space-y-2">
              <div><p className="text-sm text-ink-400">Crew word</p><p className="font-display text-2xl font-bold">{r.word}</p></div>
              <div><p className="text-sm text-ink-400">Imposter's clue</p><p className="font-display text-2xl font-bold text-hot-400">{r.imposterWord}</p></div>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 border-t border-ink-700 pt-3 text-sm text-ink-300"><Trophy className="h-4 w-4 text-amber-300" aria-hidden />Your stats: {stats.wins} wins from {stats.played} games ({stats.winRate}%)</p>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>button]:w-full sm:[&>button]:w-auto">
        {isHost ? (
          <>
            <Button size="lg" loading={busy} onClick={() => run(() => nextRound(roomId, members))}>{r.matchOver ? 'Next round (new roles)' : 'Next round'}</Button>
            <Button size="lg" variant="secondary" loading={busy} onClick={() => run(() => returnToLobby(roomId, members, uid))}>Return to lobby</Button>
          </>
        ) : <p className="self-center text-ink-300">Waiting for the host to continue…</p>}
        <Button size="lg" variant="ghost" onClick={() => setConfirmLeave(true)}><LogOut className="h-4 w-4" />Leave room</Button>
      </div>
      <ConfirmDialog open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Leave this room?" message="You will stop taking part in this game." confirmLabel="Leave room" loading={busy}
        onConfirm={async () => { const out = await run(() => leaveRoom(roomId, uid, members)); if (out.ok) navigate('/dashboard', { replace: true }); }} />
    </div>
  );
}
