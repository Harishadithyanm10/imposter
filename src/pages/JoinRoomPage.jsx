import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { FullPageSpinner } from '../components/common/Spinner.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { joinRoomByCode } from '../services/roomService.js';
import { errMsg } from '../utils/errors.js';

const clean = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

export default function JoinRoomPage() {
  const { code: urlCode } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState(clean(urlCode || ''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(!!urlCode);
  const tried = useRef(false);

  async function join(c) {
    if (c.length !== 6) { setError('Room codes are 6 letters or numbers.'); return; }
    setError(''); setBusy(true);
    try {
      const { roomId } = await joinRoomByCode(c, user.uid, profile);
      navigate(`/room/${roomId}`, { replace: true });
    } catch (e) { setError(errMsg(e)); setBusy(false); }
  }

  // Invitation link: /join/ABC123 joins automatically once the user is signed in.
  useEffect(() => {
    if (urlCode && !tried.current) { tried.current = true; join(clean(urlCode)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode]);

  if (busy && urlCode && !error) return <FullPageSpinner label={`Joining room ${clean(urlCode)}…`} />;

  return (
    <div className="mx-auto max-w-md">
      <h1 data-title className="text-3xl font-bold">Join a room</h1>
      <p className="mt-1 text-ink-300">Enter the six-character code your host shared.</p>
      <Card className="mt-6">
        <form onSubmit={(e) => { e.preventDefault(); join(code); }} noValidate className="space-y-4">
          <Input label="Room code" value={code} error={error} autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false}
            inputClassName="text-center font-display text-3xl font-bold tracking-[0.35em] uppercase"
            onChange={(e) => setCode(clean(e.target.value))} onPaste={(e) => { e.preventDefault(); setCode(clean(e.clipboardData.getData('text').split('/').pop() || '')); }}
            placeholder="ABC123" />
          <Button type="submit" className="w-full" loading={busy}>Join room</Button>
        </form>
      </Card>
    </div>
  );
}
