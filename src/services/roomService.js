import { collection, deleteField, doc, getDoc, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase.js';
import { roomCode } from '../lib/random.js';
import { pickNewHost } from '../lib/engine.js';
import { validateCode, validateSettings } from '../lib/settings.js';

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const roomRef = (roomId) => doc(db, 'rooms', roomId);
const memberFields = (uid, profile, isReady) => ({
  uid, displayName: profile.displayName, avatar: profile.avatar || 'violet', isReady, joinedAt: serverTimestamp(),
});

/** Creates the room, its unique code and the host's member record atomically. */
export async function createRoom(rawSettings, uid, profile) {
  const { settings, custom } = validateSettings(rawSettings);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = roomCode();
    const rRef = doc(collection(db, 'rooms'));
    const codeRef = doc(db, 'roomCodes', code);
    // The transaction re-reads the code, so two simultaneous creators can never share one.
    const created = await runTransaction(db, async (tx) => {
      if ((await tx.get(codeRef)).exists()) return false;
      tx.set(codeRef, { roomId: rRef.id, hostUid: uid });
      tx.set(rRef, {
        roomCode: code, roomName: settings.roomName, hostUid: uid, status: 'WAITING', settings,
        currentRound: 0, currentPhase: 'WAITING', memberCount: 1, matchCount: 0,
        createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + ROOM_TTL_MS),
      });
      tx.set(doc(rRef, 'members', uid), memberFields(uid, profile, true));
      return true;
    });
    if (created) {
      if (custom) await setDoc(doc(rRef, 'secrets', '_config'), custom); // host-only document
      return { roomId: rRef.id, roomCode: code };
    }
  }
  throw new Error('Could not allocate a room code. Please try again.');
}

export async function joinRoomByCode(rawCode, uid, profile) {
  const code = validateCode(rawCode);
  const codeSnap = await getDoc(doc(db, 'roomCodes', code));
  if (!codeSnap.exists()) throw new Error('No open room has that code. Check it and try again.');
  const { roomId } = codeSnap.data();
  return runTransaction(db, async (tx) => {
    const rRef = roomRef(roomId);
    const roomSnap = await tx.get(rRef);
    if (!roomSnap.exists()) throw new Error('That room no longer exists.');
    const room = roomSnap.data();
    if (room.status === 'CLOSED' || (room.expiresAt?.toMillis?.() || Infinity) < Date.now()) throw new Error('That room has closed or expired.');
    const mRef = doc(rRef, 'members', uid);
    if ((await tx.get(mRef)).exists()) return { roomId, rejoined: true }; // reconnect, no duplicate membership
    if (room.status !== 'WAITING') throw new Error('That game has already started.');
    if (room.memberCount >= room.settings.maxPlayers) throw new Error('That room is full.');
    tx.set(mRef, memberFields(uid, profile, false));
    tx.update(rRef, { memberCount: room.memberCount + 1 });
    return { roomId, rejoined: false };
  });
}

/** Leave (or, as host, hand over the room). `members` is the latest member list for host handover. */
export async function leaveRoom(roomId, uid, members = []) {
  await runTransaction(db, async (tx) => {
    const rRef = roomRef(roomId);
    const room = (await tx.get(rRef)).data();
    if (!room) return;
    const mRef = doc(rRef, 'members', uid);
    if (!(await tx.get(mRef)).exists()) return;
    tx.delete(mRef);
    if (room.hostUid !== uid) { tx.update(rRef, { memberCount: Math.max(0, room.memberCount - 1) }); return; }
    const rest = members.filter((m) => m.id !== uid).map((m) => ({ uid: m.id, joinedAtMs: m.joinedAt?.toMillis?.() || 0, connectionStatus: m.connectionStatus }));
    if (!rest.length) {
      tx.update(rRef, { status: 'CLOSED', currentPhase: 'CLOSED', memberCount: 0 });
      tx.delete(doc(db, 'roomCodes', room.roomCode));
    } else {
      tx.update(rRef, { hostUid: pickNewHost(rest, uid), memberCount: rest.length, hostDisconnectedAt: deleteField() });
    }
  });
}

export async function kickPlayer(roomId, targetUid) {
  await runTransaction(db, async (tx) => {
    const rRef = roomRef(roomId);
    const room = (await tx.get(rRef)).data();
    const mRef = doc(rRef, 'members', targetUid);
    if (!(await tx.get(mRef)).exists()) return;
    tx.delete(mRef);
    tx.update(rRef, { memberCount: Math.max(0, room.memberCount - 1) });
  });
}

export async function updateSettings(roomId, rawSettings, { memberCount, existingHasCustom }) {
  const { settings, custom } = validateSettings(rawSettings, { memberCount, existingHasCustom });
  if (custom) await setDoc(doc(db, 'rooms', roomId, 'secrets', '_config'), custom);
  await updateDoc(roomRef(roomId), { settings, roomName: settings.roomName });
}

export async function closeRoom(roomId, roomCodeValue) {
  const batch = writeBatch(db);
  batch.update(roomRef(roomId), { status: 'CLOSED', currentPhase: 'CLOSED' });
  batch.delete(doc(db, 'roomCodes', roomCodeValue));
  await batch.commit();
}

/** Allowed by Security Rules only for your own flag, and only in the lobby. */
export const setReady = (roomId, uid, isReady) => updateDoc(doc(db, 'rooms', roomId, 'members', uid), { isReady });

export async function returnToLobby(roomId, members, hostUid) {
  const batch = writeBatch(db);
  members.forEach((m) => batch.update(doc(db, 'rooms', roomId, 'members', m.id), { isReady: m.id === hostUid }));
  batch.update(roomRef(roomId), {
    status: 'WAITING', currentPhase: 'WAITING', currentRound: 0, currentRoundId: deleteField(), matchId: deleteField(),
  });
  await batch.commit();
}

// --- host takeover (see firestore.rules: markHostGone / claimHost) ---
export const markHostGone = (roomId) => updateDoc(roomRef(roomId), { hostDisconnectedAt: serverTimestamp() });
export const clearHostGone = (roomId) => updateDoc(roomRef(roomId), { hostDisconnectedAt: deleteField() });
export const claimHost = (roomId, uid) => updateDoc(roomRef(roomId), { hostUid: uid, hostDisconnectedAt: deleteField() });
