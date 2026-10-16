import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Lock, Swords } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import PhaseHeader from '../components/game/PhaseHeader.jsx';
import { useRoom } from '../contexts/RoomContext.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { db } from '../services/firebase.js';
import { submitGuess } from '../services/gameService.js';

/**
 * Final word guess ("last stand"). Everyone sees the same neutral screen so nobody learns WHO is guessing;
 * only an eligible player (listed in round.guessers) gets the input. The guess is one private,
 * create-only document, so it cannot be changed or repeated, and only the host reads it.
 */
export default function GuessPage() {
  const { roomId, room, round, role, uid } = useRoom();
  const eligible = (round.guessers || []).includes(uid);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [run, busy] = useAsyncAction();

  useEffect(() => {
    setSent(false);
    if (!eligible) return undefined;
    return onSnapshot(doc(db, 'rooms', roomId, 'rounds', round.id, 'guesses', uid), (s) => setSent(s.exists()), () => {});
  }, [roomId, round.id, uid, eligible]);

  const white = role?.role === 'WHITE';
  return (
    <div className="mx-auto max-w-xl">
      <PhaseHeader title="Last stand" subtitle={eligible ? 'One chance. Guess the secret word.' : 'Someone is making a final guess…'} total={room.settings.guessTimer ?? 15} />
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={eligible ? 'border-hot-500/60 shadow-2xl shadow-hot-500/20' : ''}>
          {eligible ? (
            sent ? (
              <div className="space-y-3 text-center">
                <Lock className="mx-auto h-9 w-9 text-brand-300" aria-hidden />
                <p className="font-display text-2xl font-bold">Guess locked in</p>
                <p className="text-sm text-ink-300">It cannot be changed. The result is revealed to everyone in a moment.</p>
              </div>
            ) : (
              <form className="space-y-4" noValidate onSubmit={async (e) => { e.preventDefault(); await run(() => submitGuess(roomId, round.id, uid, text)); }}>
                <div className="text-center">
                  <Swords className="mx-auto h-9 w-9 text-hot-400" aria-hidden />
                  <p className="mt-2 font-display text-2xl font-bold">{white ? 'You were Mr. White!' : 'You were caught!'}</p>
                  <p className="mt-1 text-sm text-ink-300">Guess the crew's secret word and you steal the round for the hidden team.</p>
                  {role?.topic && <p className="mt-2 text-xs uppercase tracking-wide text-ink-400">Topic: {role.topic}</p>}
                </div>
                <Input label="Your one guess" value={text} maxLength={40} autoComplete="off" autoCapitalize="none" enterKeyHint="send" onChange={(e) => setText(e.target.value)} />
                <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!text.trim()}>Lock in my guess</Button>
              </form>
            )
          ) : (
            <div className="space-y-3 text-center">
              <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-hot-600/20 text-2xl" aria-hidden>🎯</motion.div>
              <p className="font-display text-2xl font-bold">A last-stand guess is happening</p>
              <p className="text-sm text-ink-300">Eliminated hidden players get one private try at the secret word. The result is revealed in a moment.</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
