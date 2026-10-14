import { MessagesSquare } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import ClueList from '../components/game/ClueList.jsx';
import MyWord from '../components/game/MyWord.jsx';
import PhaseHeader from '../components/game/PhaseHeader.jsx';
import { useRoom } from '../contexts/RoomContext.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { hostEndDiscussion } from '../lib/hostGame.js';

export default function DiscussionPage() {
  const { roomId, room, isHost } = useRoom();
  const typed = room.settings.typedClues === true;
  const [run, busy] = useAsyncAction();
  return (
    <div>
      <PhaseHeader title="Discussion" subtitle="Talk in person or on a call. Who sounds like they are guessing?" total={room.settings.discussionTimer} />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:gap-6">
        <Card className="order-2 lg:order-1">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><MessagesSquare className="h-5 w-5 text-brand-300" aria-hidden />{typed ? 'All clues' : 'Who spoke'}</h2>
          <ClueList />
        </Card>
        <aside className="order-1 space-y-3 lg:order-2">
          <MyWord />
          {isHost ? <Button className="w-full" loading={busy} onClick={() => run(() => hostEndDiscussion(roomId))}>End discussion</Button>
            : <p className="text-sm text-ink-400">Voting starts when the timer ends or the host ends the discussion.</p>}
        </aside>
      </div>
    </div>
  );
}
