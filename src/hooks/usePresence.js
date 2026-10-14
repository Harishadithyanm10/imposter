import { useEffect } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase.js';

export const HEARTBEAT_MS = 12000;

/**
 * Firestore-only presence (no Realtime Database needed): while the room is open, the player
 * stamps `lastSeen` on their own member document every few seconds. Other clients treat a member
 * whose stamp stops changing as offline (see useRoomState). updateDoc (not setDoc) is used so a
 * player who left or was kicked is never re-created by a late heartbeat.
 */
export function usePresence(roomId, uid) {
  useEffect(() => {
    if (!roomId || !uid) return undefined;
    const ref = doc(db, 'rooms', roomId, 'members', uid);
    const beat = () => { updateDoc(ref, { lastSeen: serverTimestamp() }).catch(() => {}); };
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') beat(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [roomId, uid]);
}
