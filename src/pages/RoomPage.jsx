import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import { FullPageSpinner } from '../components/common/Spinner.jsx';
import RoomShell from '../components/game/RoomShell.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { RoomContext } from '../contexts/RoomContext.jsx';
import { usePresence } from '../hooks/usePresence.js';
import { useRoomState } from '../hooks/useRoomState.js';
import { useHostEngine } from '../hooks/useHostEngine.js';
import { useHostWatch } from '../hooks/useHostWatch.js';
import { useRecordResult } from '../hooks/useRecordResult.js';
import LobbyPage from './LobbyPage.jsx';
import RoleRevealPage from './RoleRevealPage.jsx';
import CluePhasePage from './CluePhasePage.jsx';
import DiscussionPage from './DiscussionPage.jsx';
import VotingPage from './VotingPage.jsx';
import ResultsPage from './ResultsPage.jsx';

const PHASES = { WAITING: LobbyPage, ROLE_REVEAL: RoleRevealPage, CLUE: CluePhasePage, DISCUSSION: DiscussionPage, VOTING: VotingPage, RESULT: ResultsPage };

function Notice({ title, children }) {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-ink-300">{children}</p>
        <Button className="mt-6" onClick={() => navigate('/dashboard', { replace: true })}>Back to dashboard</Button>
      </div>
    </div>
  );
}

/** One URL (/room/:roomId) renders the right screen for the server's current phase. */
export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const state = useRoomState(roomId, user.uid);
  const { room, members, round, clues, acks, role, presence, status, error } = state;
  const isHostNow = room?.hostUid === user.uid;
  usePresence(roomId, user.uid);
  useHostEngine(roomId, state, isHostNow);
  useHostWatch(roomId, room, members, presence, user.uid);
  useRecordResult(roomId, room, round, role, user.uid);

  const value = useMemo(() => {
    if (!room) return null;
    const alive = round ? round.alive.filter((u) => !round.left.includes(u)) : [];
    const playerOf = (uid) => {
      const m = members.find((x) => x.id === uid);
      return round?.players?.[uid] || (m ? { displayName: m.displayName, avatar: m.avatar } : { displayName: 'Player', avatar: 'slate' });
    };
    return {
      roomId, room, round, members, clues, acks, role, uid: user.uid, alive, playerOf,
      isHost: room.hostUid === user.uid, isAlive: alive.includes(user.uid),
      me: members.find((m) => m.id === user.uid),
    };
  }, [roomId, room, round, members, clues, acks, role, user.uid]);

  if (status === 'loading') return <FullPageSpinner label="Joining room…" />;
  if (status === 'denied') return <Notice title="You are not in this room">You may have been removed by the host, left the room, or the room no longer exists.</Notice>;
  if (status === 'error') return <Notice title="Connection problem">{error?.message || 'Could not load the room.'} Check your connection and try again.</Notice>;
  if (!room) return <FullPageSpinner />;
  if (room.status === 'CLOSED') return <Notice title="This room was closed">The host closed the room or it expired. Start a new one any time.</Notice>;

  const phase = room.currentPhase;
  const Page = PHASES[phase] || LobbyPage;
  const syncing = phase !== 'WAITING' && (!round || round.phase !== phase);
  return (
    <RoomContext.Provider value={value}>
      <RoomShell>{syncing ? <FullPageSpinner label="Syncing game…" /> : <Page />}</RoomShell>
    </RoomContext.Provider>
  );
}
