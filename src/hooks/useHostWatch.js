import { useEffect } from 'react';
import { claimHost, clearHostGone, markHostGone } from '../services/roomService.js';
import { pickNewHost } from '../lib/engine.js';
import { tsMs } from '../utils/time.js';

/**
 * Host handover. Any member flags a host whose presence went offline; 30 server-seconds later the
 * deterministic successor (earliest-joined connected player) claims host. Rules enforce the delay.
 */
export function useHostWatch(roomId, room, members, presence, uid) {
  const isHost = room?.hostUid === uid;
  const flaggedAt = tsMs(room?.hostDisconnectedAt);
  const hostOffline = room ? presence[room.hostUid] === false : false;

  useEffect(() => {
    if (!room) return undefined;
    if (isHost) { if (flaggedAt) clearHostGone(roomId).catch(() => {}); return undefined; }
    if (!hostOffline) return undefined;
    if (!flaggedAt) {
      const t = setTimeout(() => markHostGone(roomId).catch(() => {}), 3000 + Math.random() * 1500);
      return () => clearTimeout(t);
    }
    const list = members.map((m) => ({ uid: m.id, connectionStatus: m.connectionStatus, joinedAtMs: tsMs(m.joinedAt) }));
    if (pickNewHost(list, room.hostUid, { onlineOnly: true }) !== uid) return undefined;
    const t = setTimeout(() => claimHost(roomId, uid).catch(() => {}), Math.max(0, flaggedAt + 31000 - Date.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, room?.hostUid, isHost, hostOffline, flaggedAt, members.length]);
}
