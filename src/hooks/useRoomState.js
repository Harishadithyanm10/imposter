import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase.js';

// A member is "offline" when their lastSeen heartbeat has not changed for this long (as observed
// on THIS device's clock, so wrong device clocks cannot break it).
const STALE_MS = 35000;

/** All real-time listeners for one room. Every listener is unsubscribed on unmount or change. */
export function useRoomState(roomId, uid) {
  const [room, setRoom] = useState(null);
  const [rawMembers, setRawMembers] = useState([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [round, setRound] = useState(null);
  const [clues, setClues] = useState([]);
  const [acks, setAcks] = useState([]);
  const [role, setRole] = useState(null);
  const [presence, setPresence] = useState({});
  const seen = useRef({}); // uid -> { stamp, at }
  const [status, setStatus] = useState('loading'); // loading | ready | denied | error
  const [error, setError] = useState(null);

  const onErr = (e) => {
    if (e.code === 'permission-denied') setStatus('denied');
    else { setStatus('error'); setError(e); }
  };

  useEffect(() => {
    setStatus('loading'); setRoom(null); setRawMembers([]); setMembersLoaded(false); setRound(null); setClues([]); setAcks([]); setRole(null);
    const unsubs = [
      onSnapshot(doc(db, 'rooms', roomId), (s) => {
        if (!s.exists()) { setStatus('denied'); return; }
        setRoom({ id: s.id, ...s.data() }); setStatus('ready');
      }, onErr),
      onSnapshot(collection(db, 'rooms', roomId, 'members'), (s) => {
        const list = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.joinedAt?.toMillis?.() || 0) - (b.joinedAt?.toMillis?.() || 0));
        const now = Date.now();
        list.forEach((m) => {
          const stamp = m.lastSeen?.toMillis?.() || 0;
          const prev = seen.current[m.id];
          if (!prev || prev.stamp !== stamp) seen.current[m.id] = { stamp, at: now };
        });
        setRawMembers(list);
        setMembersLoaded(true);
      }, onErr),
    ];
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Recompute who is online every few seconds from the observed heartbeats.
  useEffect(() => {
    seen.current = {};
    setPresence({});
    const tick = () => {
      const now = Date.now();
      const next = {};
      Object.entries(seen.current).forEach(([id, v]) => { next[id] = id === uid || now - v.at < STALE_MS; });
      setPresence((prev) => {
        const keys = Object.keys(next);
        return keys.length === Object.keys(prev).length && keys.every((k) => prev[k] === next[k]) ? prev : next;
      });
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [roomId, uid]);

  const roundId = room?.currentRoundId;
  useEffect(() => {
    setRound(null); setClues([]); setAcks([]);
    if (!roundId) return undefined;
    const base = ['rooms', roomId, 'rounds', roundId];
    const unsubs = [
      onSnapshot(doc(db, ...base), (s) => setRound(s.exists() ? { id: s.id, ...s.data() } : null), onErr),
      onSnapshot(collection(db, ...base, 'clues'), (s) => setClues(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.order - b.order)), onErr),
      onSnapshot(collection(db, ...base, 'acks'), (s) => setAcks(s.docs.map((d) => d.id)), onErr),
    ];
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roundId]);

  // Private role: Security Rules only let a player read their own document.
  const matchId = room?.matchId;
  useEffect(() => {
    setRole(null);
    if (!matchId) return undefined;
    return onSnapshot(doc(db, 'rooms', roomId, 'privateRoles', uid), (s) => {
      const data = s.exists() ? s.data() : null;
      setRole(data && data.matchId === matchId ? data : null);
    }, onErr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, uid, matchId]);

  const members = useMemo(
    () => rawMembers.map((m) => ({ ...m, connectionStatus: presence[m.id] === false ? 'offline' : 'online' })),
    [rawMembers, presence],
  );
  return { room, members, membersLoaded, round, clues, acks, role, presence, status, error };
}
