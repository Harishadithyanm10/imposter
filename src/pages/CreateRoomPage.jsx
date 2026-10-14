import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card.jsx';
import RoomSettingsForm from '../components/lobby/RoomSettingsForm.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { createRoom } from '../services/roomService.js';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [run, busy] = useAsyncAction();
  const { user, profile } = useAuth();

  async function onSubmit(settings) {
    const out = await run(() => createRoom(settings, user.uid, profile));
    if (out.ok) navigate(`/room/${out.result.roomId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Create a room</h1>
      <p className="mt-1 text-ink-300">Set the rules, then invite friends with a room code.</p>
      <Card className="mt-6"><RoomSettingsForm onSubmit={onSubmit} submitLabel="Create room" loading={busy} /></Card>
    </div>
  );
}
