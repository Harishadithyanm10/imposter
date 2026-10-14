import { useCountdown } from '../../hooks/useCountdown.js';

/** Animated circular timer. `endsAtMs` comes from the server-written phase end time. */
export default function CountdownRing({ endsAtMs, total = 30, size = 72 }) {
  const secs = useCountdown(endsAtMs);
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, secs / Math.max(1, total));
  const urgent = secs <= 5;
  const mm = Math.floor(secs / 60);
  const label = mm > 0 ? `${mm}:${String(secs % 60).padStart(2, '0')}` : `${secs}`;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="timer" aria-label={`${secs} seconds remaining`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2b2b3a" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          stroke={urgent ? '#ff3b5c' : '#8b5cf6'} strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 0.4s linear, stroke 0.3s' }} />
      </svg>
      <span className={`absolute font-display text-lg font-bold tabular-nums ${urgent ? 'text-hot-400' : ''}`}>{label}</span>
    </div>
  );
}
