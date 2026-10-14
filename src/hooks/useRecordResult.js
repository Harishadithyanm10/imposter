import { useEffect, useRef } from 'react';
import { recordResult } from '../services/profileService.js';

/** When a match ends, each player records their own result once (Security Rules verify it). */
export function useRecordResult(roomId, room, round, role, uid) {
  const done = useRef(new Set());
  useEffect(() => {
    if (!round?.result?.matchOver || !role || role.matchId !== round.matchId || done.current.has(round.matchId)) return;
    done.current.add(round.matchId);
    recordResult({ roomId, uid, roomName: room.roomName, round, role: role.role }).catch(() => done.current.delete(round.matchId));
  }, [roomId, room, round, role, uid]);
}
