import { useState } from 'react';
import { Check, Mic, SkipForward } from 'lucide-react';
import Avatar from '../components/common/Avatar.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import PhaseHeader from '../components/game/PhaseHeader.jsx';
import MyWord from '../components/game/Myword.jsx';
import { useRoom } from '../contexts/RoomContext.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { markSpoke, submitClue, SPOKE_MARK } from '../services/gameService.js';
import { hostSkipTurn } from '../lib/hostGame.js';
import EventSplash, { EventChip } from '../components/game/EventSplash.jsx';
import { clueSeconds } from '../lib/engine.js';
import { cx } from '../utils/cx.js';

export default function CluePhasePage() {
  const { roomId, room, round, clues, uid, isHost, isAlive, playerOf, role } = useRoom();
  const typed = room.settings.typedClues === true; // false = timer only (speak out loud)
  const [clue, setClue] = useState('');
  const [error, setError] = useState('');
  const [run, busy] = useAsyncAction();
  const currentUid = round.turnOrder[round.currentTurnIndex];
  const myTurn = currentUid === uid && isAlive;
  const byUid = Object.fromEntries(clues.map((c) => [c.uid, c]));
  const current = playerOf(currentUid);

  async function send(e) {
    e.preventDefault();
    const text = clue.trim();
    if (!text) { setError('Type a clue first.'); return; }
    if (text.split(/\s+/).length > 3) { setError('Three words or fewer.'); return; }
    setError('');
    const out = await run(() => submitClue(roomId, round.id, uid, text, role?.secretWord, round.currentTurnIndex));
    if (out.ok) setClue('');
  }

  const subtitle = myTurn ? (typed ? 'Your turn. Give one short clue.' : 'Your turn. Say a clue out loud.') : `${current.displayName} is ${typed ? 'thinking…' : 'speaking…'}`;

  return (
    <div className="min-w-0">
      {round.event && <EventSplash type={round.event.type} roundId={round.id} />}
      <PhaseHeader title="Clue time" subtitle={subtitle} total={clueSeconds(room.settings, round.event?.type)} />
      {round.event && <div className="mb-3"><EventChip type={round.event.type} /></div>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <section className="order-2 min-w-0 space-y-4 lg:order-1">
          {myTurn && (
            <div className="scroll-mt-28">
              <Card className="border-brand-500/50 ring-2 ring-brand-500/20">
                {typed ? (
                  <form onSubmit={send} noValidate className="space-y-3">
                    <Input label="Your clue" value={clue} maxLength={40} autoComplete="off" autoCapitalize="none" enterKeyHint="send" onChange={(e) => setClue(e.target.value)} error={error}
                      onFocus={(e) => { const el = e.target; setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300); }}
                      hint="Up to three words. Do not say your secret word." />
                    <Button type="submit" size="lg" loading={busy} className="w-full">Submit clue</Button>
                  </form>
                ) : (
                  <div className="space-y-3 text-center">
                    <Mic className="mx-auto h-8 w-8 text-brand-300" aria-hidden />
                    <p className="font-display text-xl font-bold">It’s your turn!</p>
                    <p className="text-sm text-ink-300">Say one short clue out loud before the timer ends. Don’t say your secret word.</p>
                    <Button size="lg" loading={busy} className="w-full" onClick={() => run(() => markSpoke(roomId, round.id, uid, round.currentTurnIndex))}><Check className="h-5 w-5" />I’m done</Button>
                  </div>
                )}
              </Card>
            </div>
          )}
          <Card>
            <h2 className="mb-3 text-lg font-bold">Speaking order{round.event?.type === 'REVERSE' && <span className="ml-2 text-sm font-semibold text-sky-300">(reversed)</span>}</h2>
            <ol className="space-y-2">
              {round.turnOrder.map((u, i) => {
                const p = playerOf(u); const done = byUid[u]; const active = i === round.currentTurnIndex;
                const spoke = done && (done.clue === SPOKE_MARK || (!typed && done.skipped));
                return (
                  <li key={u} aria-current={active ? 'step' : undefined} className={cx('flex items-start gap-3 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3', active ? 'bg-brand-600/20 ring-1 ring-brand-500/60' : 'bg-ink-800/60')}>
                    <span className="w-5 shrink-0 pt-2 text-center text-xs font-bold text-ink-400">{i + 1}</span>
                    <Avatar name={p.displayName} avatar={p.avatar} size="sm" />
                    {/* on phones the player's word/clue sits UNDER their name; on wider screens it moves to the right */}
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-3">
                      <p className="truncate font-semibold">{p.displayName}{u === uid && ' (you)'}</p>
                      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm sm:mt-0 sm:max-w-[55%] sm:justify-end sm:text-right">
                        {done ? (spoke ? <><Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden /><span className="text-ink-300">done</span></>
                          : done.skipped ? <span className="italic text-ink-400">skipped</span>
                            : <><Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden /><span className="min-w-0 break-words font-display text-base font-bold sm:text-lg">{done.clue}</span></>)
                          : active ? <span className="text-brand-300">{typed ? 'giving clue…' : 'speaking…'}</span> : <span className="text-ink-400">waiting</span>}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </section>
        <aside className="order-1 min-w-0 space-y-3 lg:order-2">
          <MyWord />
          {!isAlive && <p className="rounded-2xl bg-ink-800 p-4 text-sm text-ink-300">You were voted out. You can keep watching.</p>}
          {isHost && <Button variant="secondary" className="w-full" loading={busy} onClick={() => run(() => hostSkipTurn(roomId, round.currentTurnIndex, currentUid))}><SkipForward className="h-4 w-4" />{typed ? `Skip ${current.displayName}’s turn` : 'Next speaker'}</Button>}
        </aside>
      </div>
    </div>
  );
}
