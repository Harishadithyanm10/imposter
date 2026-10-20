import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Crown, DoorClosed, LogOut, Settings, Share2, UserMinus } from 'lucide-react';
import Avatar from '../components/common/Avatar.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Modal, { ConfirmDialog } from '../components/common/Modal.jsx';
import RoomSettingsForm from '../components/lobby/RoomSettingsForm.jsx';
import { useRoom } from '../contexts/RoomContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { CATEGORIES, DIFFICULTIES, GAME_MODES, labelOf, maxImposters } from '../constants/game.js';
import { startMatch } from '../lib/hostGame.js';
import { rolesFit } from '../lib/engine.js';
import { closeRoom, kickPlayer, leaveRoom, setReady, updateSettings } from '../services/roomService.js';
import { cx } from '../utils/cx.js';
import { nativeShare, publicOrigin } from '../native.js';

export default function LobbyPage() {
  const { roomId, room, members, uid, isHost, me } = useRoom();
  const toast = useToast();
  const navigate = useNavigate();
  const [run, busy] = useAsyncAction();
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [kick, setKick] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const s = room.settings;
  const origin = publicOrigin();
  const link = origin ? `${origin}/join/${room.roomCode}` : null; // apps need VITE_PUBLIC_URL for a shareable link

  const others = members.filter((m) => m.id !== room.hostUid);
  const readyCount = others.filter((m) => m.isReady).length;
  const enoughPlayers = members.length >= 3;
  const allReady = readyCount === others.length;
  const imposterOk = rolesFit(members.length, s.imposters, s.mrWhite === true);
  const needPlayers = 2 * (s.imposters + (s.mrWhite ? 1 : 0)) + 1;
  const canStart = enoughPlayers && allReady && imposterOk;
  const blocker = !enoughPlayers ? 'Need at least 3 players.' : !imposterOk ? `${s.imposters} imposter${s.imposters === 1 ? '' : 's'}${s.mrWhite ? ' plus Mr. White' : ''} needs at least ${needPlayers} players. Change the settings or wait for more players.`
    : !allReady ? `Waiting for ${others.length - readyCount} player(s) to be ready.` : '';

  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); toast.success(msg); } catch { toast.error('Could not copy. Select and copy it manually.'); }
  }
  async function share() {
    const msg = { title: 'Join my Imposter game', text: `Join "${room.roomName}" in Imposter with code ${room.roomCode}`, url: link };
    if (await nativeShare(msg)) return;
    if (navigator.share) { try { await navigator.share(msg.url ? msg : { title: msg.title, text: msg.text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    copy(link || `Join my Imposter game with code ${room.roomCode}`, link ? 'Invite link copied.' : 'Invite message copied.');
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
      <section className="min-w-0 space-y-4 sm:space-y-6">
        <Card>
          <p className="text-sm text-ink-400">Room code</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="font-display text-4xl font-extrabold tracking-[0.2em] sm:text-5xl sm:tracking-[0.25em]" aria-label={`Room code ${room.roomCode.split('').join(' ')}`}>{room.roomCode}</span>
            <Button variant="secondary" size="sm" onClick={() => copy(room.roomCode, 'Code copied.')}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}Copy code</Button>
            <Button variant="secondary" size="sm" onClick={share}><Share2 className="h-4 w-4" />Share invite</Button>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Players <span className="text-ink-400">{members.length}/{s.maxPlayers}</span></h2>
          </div>
          <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-ink-800/70 p-3">
                <Avatar name={m.displayName} avatar={m.avatar} status={m.connectionStatus === 'offline' ? 'offline' : 'online'} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold">{m.displayName}{m.id === uid && <span className="text-xs text-ink-400">(you)</span>}</p>
                  <p className="flex items-center gap-2 text-xs">
                    {m.id === room.hostUid && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 font-semibold text-amber-300"><Crown className="h-3 w-3" aria-hidden />Host</span>}
                    <span className={cx(m.isReady ? 'text-emerald-300' : 'text-ink-400')}>{m.isReady ? 'Ready' : 'Not ready'}</span>
                    {m.connectionStatus === 'offline' && <span className="text-ink-400">· disconnected</span>}
                  </p>
                </div>
                {isHost && m.id !== uid && (
                  <button onClick={() => setKick(m)} aria-label={`Remove ${m.displayName}`} className="rounded-lg p-2 text-ink-400 hover:bg-ink-700 hover:text-hot-400"><UserMinus className="h-4 w-4" /></button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <aside className="space-y-4 pb-20 lg:pb-0">
        <Card>
          <h2 className="mb-3 text-lg font-bold">Settings</h2>
          <dl className="space-y-1.5 text-sm">
            {[['Mode', labelOf(GAME_MODES, s.gameMode)], ['Imposters', s.imposters], ['Rounds', s.rounds], ['Sub-rounds', s.subRounds ?? 3],
              ['Clues', s.typedClues ? 'Typed' : 'Timer only (spoken)'],
            ...(s.mrWhite || s.lastStand || s.extraHint || s.randomEvents ? [['Special rules', [s.mrWhite && 'Mr. White', s.lastStand && 'Last stand', s.extraHint && 'Extra hint', s.randomEvents && 'Random events'].filter(Boolean).join(', ')]] : []), ['Time per player', `${s.clueTimer}s`], ['Discussion', `${s.discussionTimer}s`], ['Voting', `${s.votingTimer}s`],
              ...(s.gameMode === 'CUSTOM' ? [['Words', 'Custom (hidden)']] : [['Category', labelOf(CATEGORIES, s.category)], ['Difficulty', labelOf(DIFFICULTIES, s.difficulty)]])]
              .map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-ink-400">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>
        </Card>

        <Card className="space-y-3">
          {!isHost && (
            <Button className="w-full max-lg:hidden" variant={me?.isReady ? 'secondary' : 'primary'} loading={busy}
              onClick={() => run(() => setReady(roomId, uid, !me?.isReady))}>{me?.isReady ? 'I’m not ready' : 'I’m ready'}</Button>
          )}
          {isHost ? (
            <>
              <Button className="w-full max-lg:hidden" disabled={!canStart} loading={busy} onClick={() => run(() => startMatch(roomId, members))}>Start game</Button>
              {blocker && <p className="text-xs text-ink-400">{blocker}</p>}
              <Button className="w-full" variant="secondary" onClick={() => setShowSettings(true)}><Settings className="h-4 w-4" />Change settings</Button>
              <Button className="w-full" variant="danger" onClick={() => setConfirmClose(true)}><DoorClosed className="h-4 w-4" />Close room</Button>
            </>
          ) : <p className="text-sm text-ink-300">Waiting for the host to start the game.</p>}
          <Button className="w-full" variant="ghost" onClick={() => setConfirmLeave(true)}><LogOut className="h-4 w-4" />Leave room</Button>
        </Card>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-800 bg-ink-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {isHost
          ? <Button className="w-full" size="lg" disabled={!canStart} loading={busy} onClick={() => run(() => startMatch(roomId, members))}>{canStart ? 'Start game' : blocker || 'Start game'}</Button>
          : <Button className="w-full" size="lg" variant={me?.isReady ? 'secondary' : 'primary'} loading={busy} onClick={() => run(() => setReady(roomId, uid, !me?.isReady))}>{me?.isReady ? 'I’m not ready' : 'I’m ready'}</Button>}
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Room settings" wide>
        <RoomSettingsForm initial={{ ...s, customWord: '', customImposterWord: '' }} minPlayers={members.length} submitLabel="Save settings" inModal loading={busy}
          onSubmit={async (next) => { const out = await run(() => updateSettings(roomId, next, { memberCount: members.length, existingHasCustom: !!s.hasCustomWords }), 'Settings saved.'); if (out.ok) setShowSettings(false); }} />
      </Modal>
      <ConfirmDialog open={!!kick} onClose={() => setKick(null)} title={`Remove ${kick?.displayName}?`} message="They will be taken out of the room and can rejoin with the code." confirmLabel="Remove player" loading={busy}
        onConfirm={async () => { await run(() => kickPlayer(roomId, kick.id)); setKick(null); }} />
      <ConfirmDialog open={confirmClose} onClose={() => setConfirmClose(false)} title="Close this room?" message="Everyone will be disconnected and the room code stops working." confirmLabel="Close room" loading={busy}
        onConfirm={async () => { const out = await run(() => closeRoom(roomId, room.roomCode)); if (out.ok) navigate('/dashboard', { replace: true }); }} />
      <ConfirmDialog open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Leave this room?" message={isHost ? 'Host privileges will pass to another player.' : 'You can rejoin with the room code while the game has not started.'} confirmLabel="Leave room" loading={busy}
        onConfirm={async () => { const out = await run(() => leaveRoom(roomId, uid, members)); if (out.ok) navigate('/dashboard', { replace: true }); }} />
    </div>
  );
}
