import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRoom } from '../../contexts/RoomContext.jsx';

/** Hold-to-peek reminder of the player's own word. Reads only their private role document. */
export default function MyWord() {
  const { role } = useRoom();
  const [show, setShow] = useState(false);
  if (!role) return null;
  return (
    <button onClick={() => setShow((s) => !s)} className="flex items-center gap-2 rounded-xl bg-ink-800 px-3 py-2 text-sm text-ink-300 hover:text-ink-100" aria-pressed={show}>
      {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      {show ? <span><strong className="text-ink-100">{role.secretWord}</strong> ({role.role === 'IMPOSTER' ? 'imposter' : 'crew'})</span> : 'Show my word'}
    </button>
  );
}
