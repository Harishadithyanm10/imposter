import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const COLORS = ['#8b5cf6', '#ff3b5c', '#34d399', '#fbbf24', '#38bdf8'];

/** One-shot particle burst for victories. Purely decorative: ignores pointer events and respects reduced motion. */
export default function Confetti({ count = 48, tint }) {
  const reduce = useReducedMotion();
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (Math.random() - 0.5) * 120, d: 1.6 + Math.random() * 1.6, delay: Math.random() * 0.4, r: Math.random() * 720 - 360,
    c: tint || COLORS[i % COLORS.length], w: 6 + Math.random() * 6,
  })), [count, tint]);
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-dvh overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <motion.span key={i} className="absolute top-0 block rounded-sm" style={{ left: '50%', width: b.w, height: b.w * 1.6, background: b.c }}
          initial={{ x: 0, y: -20, rotate: 0, opacity: 1 }} animate={{ x: `${b.x}vw`, y: '100dvh', rotate: b.r, opacity: [1, 1, 0] }}
          transition={{ duration: b.d + 1.2, delay: b.delay, ease: 'easeIn' }} />
      ))}
    </div>
  );
}
