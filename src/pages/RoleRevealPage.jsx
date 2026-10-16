import { useState } from 'react';
import { motion } from 'framer-motion';
import { EyeOff, Ghost, ShieldCheck, Skull } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import PhaseHeader from '../components/game/PhaseHeader.jsx';
import { useRoom } from '../contexts/RoomContext.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { ackReveal } from '../services/gameService.js';

export default function RoleRevealPage() {
  const { roomId, round, role, uid, alive, acks } = useRoom();
  const [flipped, setFlipped] = useState(false);
  const [run, busy] = useAsyncAction();
  const acked = acks.includes(uid);
  const imposter = role?.role === 'IMPOSTER';
  const white = role?.role === 'WHITE';

  return (
    <div className="mx-auto max-w-md">
      <PhaseHeader title="Your secret role" subtitle="Tap the card, memorise it, then hide your screen." total={30} />
      {!role ? (
        <div className="flex justify-center py-20 text-ink-400"><Spinner className="h-8 w-8" /></div>
      ) : (
        <>
          <div className="perspective">
            <motion.button type="button" onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Hide your role' : 'Reveal your role'}
              className="relative block h-[22rem] w-full [transform-style:preserve-3d] sm:h-96" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
              <div className="backface-hidden absolute inset-0 grid place-items-center rounded-3xl border border-brand-500/40 bg-gradient-to-br from-ink-800 to-ink-900 p-6 text-center shadow-2xl shadow-brand-600/20">
                <div><EyeOff className="mx-auto h-10 w-10 text-brand-300" aria-hidden /><p className="mt-4 font-display text-2xl font-bold">Tap to reveal</p><p className="mt-1 text-sm text-ink-400">Make sure nobody is peeking.</p></div>
              </div>
              <div className={`backface-hidden absolute inset-0 grid place-items-center rounded-3xl border p-6 text-center shadow-2xl [transform:rotateY(180deg)] ${white ? 'border-slate-300/60 bg-gradient-to-br from-slate-200/20 to-ink-900 shadow-white/10' : imposter ? 'border-hot-500/60 bg-gradient-to-br from-hot-600/30 to-ink-900 shadow-hot-500/20' : 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-ink-900'}`}>
                <div>
                  {white ? <Ghost className="mx-auto h-9 w-9 text-slate-200" aria-hidden /> : imposter ? <Skull className="mx-auto h-9 w-9 text-hot-400" aria-hidden /> : <ShieldCheck className="mx-auto h-9 w-9 text-emerald-300" aria-hidden />}
                  <p className="mt-3 text-sm font-semibold text-ink-300">{imposter ? 'You are the' : 'You are'}</p>
                  <p className={`font-display text-4xl font-extrabold ${white ? 'text-slate-100' : imposter ? 'text-hot-400' : 'text-emerald-300'}`}>{white ? 'MR. WHITE' : imposter ? 'IMPOSTER' : 'CREW'}</p>
                  {role.topic && <p className="mt-4 text-xs uppercase tracking-wide text-ink-400">Topic: {role.topic}</p>}
                  {white ? <p className="mt-3 font-display text-xl font-bold text-slate-100">No word. No clue.</p> : (
                    <>
                      <p className="mt-3 text-sm text-ink-300">{role.isClue ? 'Your clue (not the real word)' : 'Your word'}</p>
                      <p className="font-display text-2xl font-bold sm:text-3xl">{role.secretWord}</p>
                    </>
                  )}
                  <p className="mx-auto mt-5 max-w-[16rem] text-xs text-ink-300">
                    {white ? 'Listen to everyone else and bluff a clue. If you are voted out, you get one private guess at the secret word.'
                      : imposter ? 'Everyone else has one secret word. You only have a clue about it. Listen, work out the word, and blend in.' : 'Give clues that show you know the word without saying it.'}
                  </p>
                </div>
              </div>
            </motion.button>
          </div>
          <Button className="mt-6 w-full" size="lg" disabled={!flipped || acked} loading={busy} onClick={() => run(() => ackReveal(roomId, round.id, uid))}>
            {acked ? `Waiting for others (${acks.length}/${alive.length})` : 'Continue'}
          </Button>
          {!flipped && !acked && <p className="mt-2 text-center text-xs text-ink-400">Reveal your card first.</p>}
        </>
      )}
    </div>
  );
}
