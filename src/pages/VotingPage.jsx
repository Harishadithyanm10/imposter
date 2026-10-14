import { useState } from 'react';
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
  const [target, setTarget] = useState(null);
  const [run, busy] = useAsyncAction();
  const [votedAttempt, setVotedAttempt] = useState(null);
  const hasVoted = round.voted.includes(uid) || votedAttempt === round.voteAttempt;
  const candidates = round.voteCandidates.filter((u) => u !== uid && !round.left.includes(u));
  const canVote = isAlive && !hasVoted;

  return (
    <div>
      <PhaseHeader title={round.voteAttempt === 2 ? 'Revote' : 'Vote'} total={room.settings.votingTimer}
        subtitle={round.voteAttempt === 2 ? 'It was a tie. Vote again between the tied players.' : 'Who is the imposter? Votes stay secret until everyone has voted.'} />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:gap-6">
        <section>
          <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3" aria-label="Players to vote for">
            {candidates.map((u) => {
              const p = playerOf(u); const selected = target === u;
              return (
                <li key={u}>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={!canVote} onClick={() => setTarget(u)} aria-pressed={selected}
                    className={cx('flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                      selected ? 'border-hot-500 bg-hot-600/15 ring-2 ring-hot-500/40' : 'border-ink-700 bg-ink-900 hover:border-ink-500')}>
                    <Avatar name={p.displayName} avatar={p.avatar} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{p.displayName}</span>
                    {selected && <Check className="h-5 w-5 text-hot-400" aria-hidden />}
                  </motion.button>
                </li>
              );
            })}
          </ul>
          <div className="sticky bottom-3 z-10 mt-5 rounded-2xl bg-ink-950/80 p-1 backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            {hasVoted ? <p role="status" className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-200 ring-1 ring-emerald-500/30">Vote locked in. Waiting for the others…</p>
              : !isAlive ? <p className="rounded-2xl bg-ink-800 p-4 text-ink-300">You were voted out, so you cannot vote. Watch how it ends.</p>
              : <Button size="lg" className="w-full sm:w-auto" disabled={!target} loading={busy} onClick={async () => { const out = await run(() => submitVote(roomId, round.id, uid, round.voteAttempt, target)); if (out.ok) setVotedAttempt(round.voteAttempt); }}><Vote className="h-5 w-5" />Lock in vote</Button>}
          </div>
        </section>
        <aside className="space-y-4">
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
