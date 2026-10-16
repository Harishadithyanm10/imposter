import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Avatar from '../common/Avatar.jsx';

const FLY_MS = 3600; // the player tumbles across the whole screen
const TEXT_MS = 2600; // then the verdict is typed out

function Typewriter({ text, className }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((x) => (x >= text.length ? x : x + 1)), 38);
    return () => clearInterval(t);
  }, [text]);
  return <p className={className} aria-live="polite">{text.slice(0, n)}<span className="opacity-60">{n < text.length ? '▌' : ''}</span></p>;
}

const VERDICT = {
  IMPOSTER: { text: (n) => `${n} was an Imposter.`, tone: 'text-emerald-300' },
  WHITE: { text: (n) => `${n} was Mr. White.`, tone: 'text-emerald-300' },
  NORMAL: { text: (n) => `${n} was not an Imposter.`, tone: 'text-white' },
};

/**
 * Among Us style ejection that takes over the WHOLE screen (rendered in a portal on document.body, so
 * no parent layout can shrink it). Each eliminated player spins off into space, then the verdict is typed
 * out. Page scrolling is locked while it plays. Tap Skip any time.
 * items: [{ name, avatar, role: 'IMPOSTER' | 'WHITE' | 'NORMAL' }]   remaining: hidden players still in (optional)
 */
export default function EjectionScene({ items, remaining = null, onDone }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [stage, setStage] = useState(reduce ? 'text' : 'fly');
  const stars = useMemo(() => Array.from({ length: 90 }, () => ({ x: Math.random() * 100, y: Math.random() * 100, s: 1 + Math.random() * 2.6, d: 1.5 + Math.random() * 4 })), []);
  const item = items[i];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
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
  const v = VERDICT[item.role] || VERDICT.NORMAL;
  const left = remaining == null ? null : remaining === 0 ? 'No hidden players remain.' : `${remaining} hidden player${remaining === 1 ? '' : 's'} remain${remaining === 1 ? 's' : ''}.`;
  const size = 'min(52vw, 15rem)';

  return createPortal(
    <motion.div role="dialog" aria-modal="true" aria-label="Player eliminated"
      className="fixed left-0 top-0 z-[100] overflow-hidden bg-black" style={{ width: '100vw', height: '100dvh' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(76,29,149,0.35),transparent_65%)]" />
      {stars.map((s, k) => (
        <motion.span key={k} className="absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }}
          animate={reduce ? undefined : { opacity: [0.15, 1, 0.15], x: [0, -14] }} transition={{ repeat: Infinity, duration: s.d, ease: 'linear' }} />
      ))}
      <button onClick={onDone} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 min-h-11 rounded-xl bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20">Skip</button>

      {stage === 'fly' ? (
        <motion.div key={`fly-${i}`} className="absolute left-1/2 top-1/2" style={{ width: size, height: size, marginLeft: `calc(${size} / -2)`, marginTop: `calc(${size} / -2)` }}
          initial={{ x: '-75vw', y: '32dvh', rotate: 0, scale: 1 }} animate={{ x: '75vw', y: '-34dvh', rotate: 1260, scale: 0.35 }}
          transition={{ duration: FLY_MS / 1000, ease: 'easeIn' }}>
          <Avatar name={item.name} avatar={item.avatar} size="lg" className="!h-full !w-full !text-6xl shadow-[0_0_60px_rgba(255,255,255,0.25)] sm:!text-7xl" />
        </motion.div>
      ) : (
        <motion.div key={`text-${i}`} className="absolute inset-0 grid place-items-center px-5 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-full max-w-2xl">
            <Typewriter text={v.text(item.name)} className={`break-words font-display text-3xl font-extrabold sm:text-6xl ${v.tone}`} />
            {left && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-5 text-lg text-ink-300 sm:text-2xl">{left}</motion.p>}
            {items.length > 1 && <p className="mt-8 text-xs text-ink-400">{i + 1} of {items.length}</p>}
          </div>
        </motion.div>
      )}
    </motion.div>,
    document.body,
  );
}
