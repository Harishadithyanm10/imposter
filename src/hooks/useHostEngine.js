import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase.js';
import { engineStep } from '../lib/hostGame.js';

/**
 * Runs the game "server loop" in the HOST's browser only (free plan, no Cloud Functions).
 * Individual votes are read here and nowhere else (Security Rules: host + voter only).
 */
export function useHostEngine(roomId, state, isHost) {
  const [votes, setVotes] = useState([]);
  const latest = useRef(null);
  const busy = useRef(false);
  const roundId = state.room?.currentRoundId;

  useEffect(() => {
    setVotes([]);
    if (!isHost || !roundId) return undefined;
    return onSnapshot(collection(db, 'rooms', roomId, 'rounds', roundId, 'votes'), (s) => setVotes(s.docs.map((d) => d.data())), () => {});
  }, [isHost, roomId, roundId]);

  latest.current = { ...state, votes };

  const run = async () => {
    if (busy.current || !latest.current) return;
    busy.current = true;
    try { await engineStep(roomId, latest.current); } catch (e) { console.warn('host engine:', e.message); } finally { busy.current = false; }
  };

  useEffect(() => {
    if (!isHost) return undefined;
    run(); // react immediately to state changes
    const id = setInterval(run, 1000); // and keep timers moving
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, state.room, state.round, state.clues, state.acks, state.members, votes]);
}
