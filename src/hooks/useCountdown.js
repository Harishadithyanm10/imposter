import { useEffect, useState } from 'react';

/** Seconds remaining until `endsAtMs` (display only; the server decides when phases end). */
export function useCountdown(endsAtMs) {
  const calc = () => (endsAtMs ? Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000)) : 0);
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    setSecs(calc());
    if (!endsAtMs) return undefined;
    const id = setInterval(() => setSecs(calc()), 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAtMs]);
  return secs;
}
