import { useEffect, useState } from 'react';
import CountdownRing from '../common/CountdownRing.jsx';
import { useRoom } from '../../contexts/RoomContext.jsx';
import { tsMs } from '../../utils/time.js';

/** Round number, phase title and the animated server-driven countdown. Sticks to the top on phones so the timer is always visible. */
export default function PhaseHeader({ title, subtitle, total }) {
  const { room, round } = useRoom();
  const [small, setSmall] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const on = () => setSmall(window.innerWidth < 640);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-ink-800/60 bg-ink-950/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-brand-300 sm:text-sm">Round {round?.cycle ?? 1} of {room.settings.rounds}</p>
        <h1 className="text-2xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-300 sm:mt-1 sm:text-base">{subtitle}</p>}
      </div>
      {round?.phaseEndsAt && <CountdownRing endsAtMs={tsMs(round.phaseEndsAt)} total={total} size={small ? 60 : 72} />}
    </div>
  );
}
