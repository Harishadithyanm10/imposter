import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { db } from '../../services/firebase.js';
import { REACTIONS, sendReaction } from '../../services/gameService.js';
import { useRoom } from '../../contexts/RoomContext.jsx';
import { cx } from '../../utils/cx.js';

/**
 * Spectator emoji reactions. Everyone sees them float up; only eliminated players get the picker.
 * Reactions are just an emoji + a name: they carry no role or secret information, and Security Rules
 * enforce the emoji list, spectator-only sending and a 2 second rate limit.
 */
export default function Reactions() {
  const { roomId, room, round, uid, isAlive, playerOf } = useRoom();
  const reduce = useReducedMotion();
  const [floats, setFloats] = useState([]);
  const [cool, setCool] = useState(false);
  const first = useRef(true);
  const enabled = room.status === 'IN_GAME' && room.settings.reactions !== false;

  useEffect(() => {
    if (!enabled) return undefined;
    first.current = true;
    return onSnapshot(collection(db, 'rooms', roomId, 'reactions'), (s) => {
      if (first.current) { first.current = false; return; } // ignore what happened before we arrived
      s.docChanges().forEach((ch) => {
        if (ch.type === 'removed' || ch.doc.metadata.hasPendingWrites) return;
        const d = ch.doc.data();
        const id = `${ch.doc.id}-${d.at?.toMillis?.() || Date.now()}`;
        setFloats((f) => [...f.slice(-14), { id, emoji: d.emoji, uid: d.uid, x: 8 + Math.random() * 80 }]);
        setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 3800);
      });
    }, () => {});
  }, [enabled, roomId]);

  if (!enabled) return null;
  const spectator = !!round && !isAlive;
  const send = async (emoji) => {
    if (cool) return;
    setCool(true); setTimeout(() => setCool(false), 2100);
    try { await sendReaction(roomId, uid, emoji); } catch { /* rate limited: ignore */ }
  };

  return createPortal(
    <>
      <div className="pointer-events-none fixed left-0 top-0 z-50 h-dvh w-screen overflow-hidden" aria-hidden>
        <AnimatePresence>
          {floats.map((f) => (
            <motion.div key={f.id} className="absolute bottom-24 text-center" style={{ left: `${f.x}%` }}
              initial={{ y: 0, opacity: 0, scale: 0.6 }} animate={reduce ? { opacity: 1 } : { y: '-55dvh', opacity: [0, 1, 1, 0], scale: [0.6, 1.3, 1.1, 1] }} exit={{ opacity: 0 }} transition={{ duration: 3.4, ease: 'easeOut' }}>
              <div className="text-4xl sm:text-5xl">{f.emoji}</div>
              <div className="mx-auto mt-0.5 max-w-[6rem] truncate rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">{playerOf(f.uid).displayName}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {spectator && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur" role="group" aria-label="Spectator reactions">
          <p className="mb-1 text-center text-[11px] text-ink-400">You are watching. React!</p>
          <div className="mx-auto flex max-w-md justify-between gap-1">
            {REACTIONS.map((e) => (
              <button key={e} onClick={() => send(e)} disabled={cool} aria-label={`React ${e}`}
                className={cx('grid h-11 w-11 place-items-center rounded-xl text-2xl transition active:scale-90', cool ? 'opacity-40' : 'hover:bg-ink-800')}>{e}</button>
            ))}
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
