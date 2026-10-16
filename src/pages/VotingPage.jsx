import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Vote } from 'lucide-react';
import Avatar from '../components/common/Avatar.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import ClueList from '../components/game/ClueList.jsx';
import PhaseHeader from '../components/game/PhaseHeader.jsx';
import { useRoom } from '../contexts/RoomContext.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { submitVote } from '../services/gameService.js';
import { cx } from '../utils/cx.js';

export default function VotingPage() {
  const { roomId, room, round, uid, alive, isAlive, playerOf } = useRoom();
  const [picks, setPicks] = useState([]);
  const [run, busy] = useAsyncAction();
  const [votedAttempt, setVotedAttempt] = useState(null);
  const hasVoted = round.voted.includes(uid) || votedAttempt === round.voteAttempt;
  const candidates = round.voteCandidates.filter((u) => u !== uid && !round.left.includes(u));
  const slots = Math.max(1, Math.min(round.voteSlots || 1, candidates.length)); // one pick per imposter
  const canVote = isAlive && !hasVoted;
  const revote = round.voteAttempt === 2;

  // a new sub-round or a revote starts with a clean selection
  useEffect(() => { setPicks([]); }, [round.id, round.voteAttempt]);

  const toggle = (u) => setPicks((cur) => {
    if (cur.includes(u)) return cur.filter((x) => x !== u);
    return cur.length >= slots ? [...cur.slice(1), u] : [...cur, u]; // when full, the oldest pick is replaced
  });

  const subtitle = revote
    ? `Tie for the last ${slots > 1 ? 'spots' : 'spot'}. Pick ${slots} of the tied players.`
    : room.settings.mrWhite
      ? (slots > 1 ? `${slots} hidden players (imposters and Mr. White) are still in. Pick ${slots} different players.` : 'One hidden player is still in. Who is it? Votes stay secret until everyone has voted.')
      : (slots > 1 ? `${slots} imposters are still hiding. Pick ${slots} different players.` : 'One imposter is still hiding. Who is it? Votes stay secret until everyone has voted.');

  return (
    <div>
      <PhaseHeader title={revote ? 'Revote' : 'Vote'} total={room.settings.votingTimer} subtitle={subtitle} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <section className="min-w-0">
          {canVote && (
            <p className="mb-3 flex flex-wrap items-center gap-2 text-sm text-ink-300">
              <span className="font-semibold text-ink-100">Your picks {picks.length}/{slots}</span>
              {picks.map((u) => <span key={u} className="max-w-[9rem] truncate rounded-full bg-hot-600/15 px-2.5 py-1 text-xs font-semibold text-hot-400 ring-1 ring-hot-500/40">{playerOf(u).displayName}</span>)}
            </p>
          )}
          <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3" aria-label="Players to vote for">
            {candidates.map((u) => {
              const p = playerOf(u); const selected = picks.includes(u);
              return (
                <li key={u}>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={!canVote} onClick={() => toggle(u)} aria-pressed={selected}
                    className={cx('flex min-h-14 w-full items-center gap-3 rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 sm:p-4',
                      selected ? 'border-hot-500 bg-hot-600/15 ring-2 ring-hot-500/40' : 'border-ink-700 bg-ink-900 hover:border-ink-500')}>
                    <Avatar name={p.displayName} avatar={p.avatar} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{p.displayName}</span>
                    {selected && <Check className="h-5 w-5 shrink-0 text-hot-400" aria-hidden />}
                  </motion.button>
                </li>
              );
            })}
          </ul>
          <div className="sticky bottom-3 z-10 mt-5 rounded-2xl bg-ink-950/80 p-1 backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            {hasVoted ? <p role="status" className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-200 ring-1 ring-emerald-500/30">Vote locked in. Waiting for the others…</p>
              : !isAlive ? <p className="rounded-2xl bg-ink-800 p-4 text-ink-300">You were voted out, so you cannot vote. Watch how it ends.</p>
              : <Button size="lg" className="w-full sm:w-auto" disabled={picks.length !== slots} loading={busy}
                  onClick={async () => { const out = await run(() => submitVote(roomId, round.id, uid, round.voteAttempt, picks)); if (out.ok) setVotedAttempt(round.voteAttempt); }}>
                  <Vote className="h-5 w-5" aria-hidden />{picks.length === slots ? `Lock in ${slots > 1 ? `${slots} votes` : 'vote'}` : `Pick ${slots - picks.length} more`}
                </Button>}
          </div>
        </section>
        <aside className="min-w-0 space-y-4">
          <Card className="!p-4">
            <p className="text-sm text-ink-400">Votes cast</p>
            <p className="font-display text-3xl font-bold tabular-nums">{round.voted.length}<span className="text-ink-400">/{alive.length}</span></p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Who has voted">
              {alive.map((u) => <span key={u} title={playerOf(u).displayName} className={cx('h-3 w-3 rounded-full', round.voted.includes(u) ? 'bg-emerald-400' : 'bg-ink-600')} />)}
            </div>
          </Card>
          {room.settings.typedClues === true && <Card className="!p-4"><h2 className="mb-2 font-bold">Clues</h2><ClueList /></Card>}
        </aside>
      </div>
    </div>
  );
}
