import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Repeat2, Zap } from 'lucide-react';

export const EVENTS = {
  REVERSE: { title: 'Reverse Order', text: 'The speaking order is flipped this sub-round.', Icon: Repeat2, tone: 'text-sky-300', glow: 'from-sky-500/30' },
  PANIC: { title: 'Panic Mode', text: 'Half the time to give your clue. Think fast!', Icon: Zap, tone: 'text-amber-300', glow: 'from-hot-600/40' },
};

/** Small badge that stays visible for the whole sub-round, then disappears with it (a new round doc has no event). */
export function EventChip({ type }) {
  const ev = EVENTS[type];
  const reduce = useReducedMotion();
  if (!ev) return null;
  return (
    <motion.span animate={reduce || type !== 'PANIC' ? undefined : { opacity: [1, 0.55, 1] }} transition={{ repeat: Infinity, duration: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1 text-xs font-bold ring-1 ring-ink-600 ${ev.tone}`}>
      <ev.Icon className="h-3.5 w-3.5" aria-hidden />{ev.title}
    </motion.span>
  );
}

/**
 * Full-screen announcement shown once per device per sub-round. It never blocks input
 * (pointer-events: none) and the host adds a few seconds to the first turn to cover it.
 */
export default function EventSplash({ type, roundId }) {
  const ev = EVENTS[type];
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!ev) return undefined;
    const key = `imposter-event-${roundId}`;
    try { if (sessionStorage.getItem(key)) return undefined; sessionStorage.setItem(key, '1'); } catch { /* private mode */ }
    setShow(true);
    const t = setTimeout(() => setShow(false), 2800);
    return () => clearTimeout(t);
  }, [roundId, ev]);
  if (!ev) return null;
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div key="event" className={`pointer-events-none fixed left-0 top-0 z-[60] grid h-dvh w-screen place-items-center bg-gradient-to-b ${ev.glow} to-black/80 px-6 text-center`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.6, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}>
            <ev.Icon className={`mx-auto h-16 w-16 sm:h-24 sm:w-24 ${ev.tone}`} aria-hidden />
            <p className="mt-4 font-display text-4xl font-extrabold uppercase tracking-wide sm:text-7xl">{ev.title}</p>
            <p className="mx-auto mt-3 max-w-md text-base text-ink-200 sm:text-xl">{ev.text}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
