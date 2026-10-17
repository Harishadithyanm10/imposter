import { motion } from 'framer-motion';
import { MessagesSquare, Search, Sparkles } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import ClueList from '../components/game/ClueList.jsx';
import MyWord from '../components/game/MyWord.jsx';
import PhaseHeader from '../components/game/PhaseHeader.jsx';
import { useRoom } from '../contexts/RoomContext.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useExtraHint } from '../hooks/useExtraHint.js';
import { hostEndDiscussion } from '../lib/hostGame.js';
import { activateExtraHint } from '../services/gameService.js';

/** Imposter-only ability. Only the player who activates it ever receives (or sees) the hint. */
function HintAbility() {
  const { roomId, room, role, uid, isAlive } = useRoom();
  const enabled = room.settings.extraHint === true && role?.role === 'IMPOSTER';
  const { used, text } = useExtraHint(roomId, uid, room.matchId, enabled);
  const [run, busy] = useAsyncAction();
  if (!enabled || !isAlive) return null;
  if (used) {
    return text ? (
      <motion.div initial={{ opacity: 0, scale: 0.7, rotateX: -40 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 12 }}
        className="rounded-2xl border border-hot-500/60 bg-gradient-to-br from-hot-600/25 to-ink-900 p-4 shadow-lg shadow-hot-500/20">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-hot-400"><Sparkles className="h-4 w-4" aria-hidden />Secret hint · only you can see this</p>
        <p className="mt-2 font-display text-xl font-bold">{text}</p>
      </motion.div>
    ) : <div className="flex items-center gap-2 text-sm text-ink-400"><Spinner />Revealing your hint…</div>;
  }
  return (
    <Button variant="secondary" className="w-full" loading={busy} onClick={() => run(() => activateExtraHint(roomId, room.matchId, uid))}>
      <Search className="h-4 w-4" aria-hidden />One more hint (once per round)
    </Button>
  );
}

export default function DiscussionPage() {
  const { roomId, room, isHost } = useRoom();
  const typed = room.settings.typedClues === true;
  const [run, busy] = useAsyncAction();
  return (
    <div className="min-w-0">
      <PhaseHeader title="Discussion" subtitle="Talk in person or on a call. Who sounds like they are guessing?" total={room.settings.discussionTimer} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <Card className="order-2 min-w-0 lg:order-1">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><MessagesSquare className="h-5 w-5 text-brand-300" aria-hidden />{typed ? 'All clues' : 'Who spoke'}</h2>
          <ClueList />
        </Card>
        <aside className="order-1 min-w-0 space-y-3 lg:order-2">
          <MyWord />
          <HintAbility />
          {isHost ? <Button className="w-full" loading={busy} onClick={() => run(() => hostEndDiscussion(roomId))}>End discussion</Button>
            : <p className="text-sm text-ink-400">Voting starts when the timer ends or the host ends the discussion.</p>}
        </aside>
      </div>
    </div>
  );
}
