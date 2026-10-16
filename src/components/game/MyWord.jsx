import { useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useRoom } from '../../contexts/RoomContext.jsx';
import { useExtraHint } from '../../hooks/useExtraHint.js';

/** Tap-to-peek reminder of the player's own word. Reads only their private role document. */
export default function MyWord() {
  const { roomId, room, role, uid } = useRoom();
  const [show, setShow] = useState(false);
  const { text: extra } = useExtraHint(roomId, uid, room.matchId, room.settings.extraHint === true && role?.role === 'IMPOSTER');
  if (!role) return null;
  const white = role.role === 'WHITE';
  return (
    <div className="space-y-2">
      <button onClick={() => setShow((s) => !s)} className="flex max-w-full items-center gap-2 rounded-xl bg-ink-800 px-3 py-2 text-left text-sm text-ink-300 hover:text-ink-100" aria-pressed={show}>
        {show ? <EyeOff className="h-4 w-4 shrink-0" aria-hidden /> : <Eye className="h-4 w-4 shrink-0" aria-hidden />}
        {show
          ? (white ? <span><strong className="text-ink-100">Mr. White</strong> (no word, no clue)</span>
            : <span className="min-w-0 break-words"><strong className="text-ink-100">{role.secretWord}</strong> ({role.role === 'IMPOSTER' ? 'imposter clue' : 'crew'})</span>)
          : 'Show my word'}
      </button>
      {show && extra && <p className="flex items-center gap-2 rounded-xl bg-hot-600/10 px-3 py-2 text-sm text-hot-400 ring-1 ring-hot-500/30"><Sparkles className="h-4 w-4 shrink-0" aria-hidden />Extra hint: {extra}</p>}
    </div>
  );
}
