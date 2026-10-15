import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Avatar from '../common/Avatar.jsx';

const FLY_MS = 3200; // the player tumbles across the screen
const TEXT_MS = 2400; // then the verdict is typed out

function Typewriter({ text, className }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((x) => (x >= text.length ? x : x + 1)), 38);
    return () => clearInterval(t);
  }, [text]);
  return <p className={className} aria-live="polite">{text.slice(0, n)}<span className="opacity-60">{n < text.length ? '▌' : ''}</span></p>;
}

/**
 * Among Us style ejection. For each eliminated player: they spin off into space, then the verdict
 * ("X was an Imposter." / "X was not an Imposter.") is typed out. Tap Skip any time.
 * items: [{ name, avatar, role: 'IMPOSTER' | 'NORMAL' }]   remaining: imposters still hiding (optional)
 */
export default function EjectionScene({ items, remaining = null, onDone }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [stage, setStage] = useState(reduce ? 'text' : 'fly');
  const stars = useMemo(() => Array.from({ length: 46 }, () => ({ x: Math.random() * 100, y: Math.random() * 100, s: 1 + Math.random() * 2.2, d: 2 + Math.random() * 4 })), []);
  const item = items[i];

  useEffect(() => { setStage(reduce ? 'text' : 'fly'); }, [i, reduce]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (stage === 'fly') setStage('text');
      else if (i + 1 < items.length) setI(i + 1);
      else onDone();
    }, stage === 'fly' ? FLY_MS : TEXT_MS);
    return () => clearTimeout(t);
  }, [stage, i, items.length, onDone]);

  if (!item) return null;
  const imp = item.role === 'IMPOSTER';
  const verdict = `${item.name} ${imp ? 'was an Imposter.' : 'was not an Imposter.'}`;
  const left = remaining == null ? null : `${remaining} Imposter${remaining === 1 ? '' : 's'} remain${remaining === 1 ? 's' : ''}.`;

  return (
    <motion.div role="dialog" aria-modal="true" aria-label="Player eliminated" className="fixed inset-0 z-[70] overflow-hidden bg-black"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {stars.map((s, k) => (
        <motion.span key={k} className="absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }}
          animate={reduce ? undefined : { opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: s.d }} />
      ))}
      <button onClick={onDone} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 min-h-11 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20">Skip</button>

      <AnimatePresence mode="wait">
        {stage === 'fly' ? (
          <motion.div key={`fly-${i}`} className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
            initial={{ x: '-70vw', y: 30, rotate: 0, scale: 1.8 }} animate={{ x: '70vw', y: -50, rotate: 980, scale: 0.5 }}
            transition={{ duration: FLY_MS / 1000, ease: 'linear' }}>
            <Avatar name={item.name} avatar={item.avatar} size="lg" className="!h-20 !w-20 !text-2xl shadow-[0_0_40px_rgba(255,255,255,0.25)]" />
          </motion.div>
        ) : (
          <motion.div key={`text-${i}`} className="absolute inset-0 grid place-items-center px-5 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="max-w-xl">
              <Typewriter text={verdict} className={`font-display text-2xl font-extrabold sm:text-5xl ${imp ? 'text-emerald-300' : 'text-white'}`} />
              {left && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-4 text-base text-ink-300 sm:text-xl">{left}</motion.p>}
              {items.length > 1 && <p className="mt-6 text-xs text-ink-400">{i + 1} of {items.length}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
