import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Plus, Smartphone, Trophy, Users } from 'lucide-react';
import Avatar from '../components/common/Avatar.jsx';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import HistoryRow from '../components/common/HistoryRow.jsx';
import { SkeletonRows } from '../components/common/Skeleton.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { tap } from '../haptics.js';
import { computeStats, getHistory } from '../services/profileService.js';
import { formatDate } from '../utils/time.js';

const clean = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

function Tile({ to, Icon, title, text, tone }) {
  return (
    <Link to={to} onClick={tap} className="flex flex-col gap-3 rounded-3xl border border-ink-700/70 bg-ink-900/80 p-4 transition active:scale-[0.97]">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" aria-hidden /></span>
      <span><span className="block font-bold">{title}</span><span className="mt-0.5 block text-xs text-ink-400">{text}</span></span>
    </Link>
  );
}

/** Home screen of the phone app: your card, one big action, quick join, and shortcuts. */
export default function AppHome() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [recent, setRecent] = useState(null);
  const [code, setCode] = useState('');
  const stats = computeStats(profile);

  useEffect(() => { getHistory(user.uid, 4).then(setRecent).catch(() => setRecent([])); }, [user.uid]);

  return (
    <div className="space-y-5">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-brand-600/30 via-ink-900 to-hot-600/20 p-5 ring-1 ring-ink-700">
        <div className="flex items-center gap-3.5">
          <Avatar name={profile.displayName} avatar={profile.avatar} size="lg" />
          <div className="min-w-0">
            <p className="text-sm text-ink-300">{stats.played ? 'Welcome back' : 'Welcome'}</p>
            <p className="truncate font-display text-2xl font-extrabold">{profile.displayName}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[['Played', stats.played], ['Wins', stats.wins], ['Win rate', `${stats.winRate}%`]].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-ink-950/50 px-2 py-2.5"><p className="font-display text-2xl font-bold tabular-nums">{v}</p><p className="text-[11px] text-ink-400">{l}</p></div>
          ))}
        </div>
      </motion.section>

      <Button to="/create" size="lg" className="h-16 w-full !rounded-2xl text-lg"><Plus className="h-6 w-6" aria-hidden />Create a room</Button>

      <form onSubmit={(e) => { e.preventDefault(); if (code.length === 6) { tap(); navigate(`/join/${code}`); } }}
        className="flex items-center gap-2 rounded-3xl border border-ink-700/70 bg-ink-900/80 p-2.5 pl-4">
        <Users className="h-5 w-5 shrink-0 text-ink-400" aria-hidden />
        <input value={code} onChange={(e) => setCode(clean(e.target.value))} placeholder="Room code" aria-label="Room code" autoComplete="off" autoCapitalize="characters" spellCheck={false} enterKeyHint="go"
          className="min-w-0 flex-1 bg-transparent py-2 text-base font-bold uppercase tracking-[0.25em] text-ink-100 placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-400 focus:outline-none" />
        <button type="submit" disabled={code.length !== 6} aria-label="Join room" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white transition active:scale-90 disabled:bg-ink-700 disabled:text-ink-400">
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
      </form>

      <div className="grid grid-cols-2 gap-3">
        <Tile to="/pass-and-play" Icon={Smartphone} title="Pass the phone" text="One phone, whole group" tone="bg-sky-500/15 text-sky-300" />
        <Tile to="/leaderboard" Icon={Trophy} title="Leaderboard" text="Who is the best?" tone="bg-amber-500/15 text-amber-300" />
      </div>
      <Link to="/how-to-play" onClick={tap} className="flex items-center gap-3 rounded-3xl border border-ink-700/70 bg-ink-900/80 p-4 transition active:scale-[0.98]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300"><BookOpen className="h-5 w-5" aria-hidden /></span>
        <span className="min-w-0 flex-1"><span className="block font-bold">How to play</span><span className="block text-xs text-ink-400">Rules, sub-rounds and points</span></span>
        <ArrowRight className="h-5 w-5 text-ink-400" aria-hidden />
      </Link>

      <section aria-label="Recent games">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Recent games</h2>{recent?.length > 0 && <Link to="/history" className="text-sm font-semibold text-brand-300">See all</Link>}</div>
        {recent === null ? <SkeletonRows rows={3} />
          : recent.length === 0 ? <EmptyState icon={Trophy} title="No games yet">Your results appear here after you finish a game.</EmptyState>
          : <div className="space-y-2">{recent.map((g) => <HistoryRow key={g.id} game={g} formatDate={formatDate} />)}</div>}
      </section>
    </div>
  );
}
