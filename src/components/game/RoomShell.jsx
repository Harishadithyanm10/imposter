import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, WifiOff } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import { useRoom } from '../../contexts/RoomContext.jsx';
import Reactions from './Reactions.jsx';

export default function RoomShell({ children }) {
  const { room } = useRoom();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <header className="border-b border-ink-800 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          <Logo to="/dashboard" className="!text-lg" />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden max-w-[12rem] truncate text-ink-300 sm:block">{room.roomName}</span>
            <span className="rounded-lg bg-ink-800 px-2.5 py-1 font-display font-bold tracking-widest">{room.roomCode}</span>
            <span className={online ? 'text-emerald-400' : 'text-hot-400'} role="status" title={online ? 'Connected' : 'Offline'}>
              {online ? <Wifi className="h-4 w-4" aria-label="Connected" /> : <WifiOff className="h-4 w-4" aria-label="Offline" />}
            </span>
          </div>
        </div>
      </header>
      {!online && <p role="alert" className="bg-hot-600/20 px-4 py-2 text-center text-sm text-hot-400">You are offline. The game will resync when you reconnect.</p>}
      <main className="mx-auto min-w-0 max-w-5xl px-4 py-4 pb-28 sm:py-8 sm:pb-8">{children}</main>
      <Reactions />
    </div>
  );
}
