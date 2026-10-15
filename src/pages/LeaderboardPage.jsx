import { useEffect, useMemo, useState } from 'react';
import { Crown, Medal, Search, Trophy } from 'lucide-react';
import Avatar from '../components/common/Avatar.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getLeaderboard, syncMyLeaderboard } from '../services/leaderboardService.js';
import { cx } from '../utils/cx.js';

const MEDAL = ['text-amber-300', 'text-slate-300', 'text-orange-400'];

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        await syncMyLeaderboard(user.uid, profile).catch(() => {});
        const list = await getLeaderboard();
        if (on) setRows(list);
      } catch {
        if (on) { setError('Could not load the leaderboard. Check your connection and that the latest Firestore rules are deployed.'); setRows([]); }
      }
    })();
    return () => { on = false; };
  }, [user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const me = rows?.find((r) => r.id === user.uid);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? (rows || []).filter((r) => String(r.displayName).toLowerCase().includes(needle)) : rows || [];
  }, [rows, q]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold sm:text-4xl"><Trophy className="h-8 w-8 text-amber-300" aria-hidden />Leaderboard</h1>
        <p className="mt-1 text-ink-300">Every player, ranked all-time by wins, then win rate.</p>
      </div>

      {rows === null ? <div className="flex justify-center py-12 text-ink-400"><Spinner /></div>
        : error ? <p role="alert" className="rounded-2xl bg-hot-600/10 p-4 text-hot-400 ring-1 ring-hot-500/30">{error}</p>
        : rows.length === 0 ? <EmptyState icon={Trophy} title="No players yet">Players appear here as soon as they sign up.</EmptyState>
        : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="!p-4"><p className="text-sm text-ink-400">Your rank</p><p className="font-display text-3xl font-bold">{me ? `#${me.rank}` : '–'}</p><p className="text-xs text-ink-400">{me ? `${me.gamesWon} wins · ${me.winRate}% win rate` : 'Not ranked yet'}</p></Card>
              <Card className="!p-4"><p className="text-sm text-ink-400">Players</p><p className="font-display text-3xl font-bold tabular-nums">{rows.length}</p><p className="text-xs text-ink-400">ranked in total</p></Card>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a player" aria-label="Find a player" autoComplete="off"
                className="w-full rounded-xl border border-ink-600 bg-ink-800 py-3 pl-10 pr-3.5 text-base text-ink-100 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 sm:py-2.5 sm:text-sm" />
            </div>

            <ol className="space-y-2" aria-label="All players ranked">
              {shown.map((r) => (
                <li key={r.id} className={cx('flex items-center gap-3 rounded-2xl border px-3 py-3 sm:gap-4 sm:px-4', r.id === user.uid ? 'border-brand-500/60 bg-brand-600/10' : 'border-ink-700/70 bg-ink-900/80')}>
                  <span className={cx('grid w-8 shrink-0 place-items-center font-display text-lg font-bold tabular-nums sm:w-10', r.rank <= 3 ? MEDAL[r.rank - 1] : 'text-ink-400')}>
                    {r.rank === 1 ? <Crown className="h-6 w-6" aria-label="Rank 1" /> : r.rank <= 3 ? <Medal className="h-6 w-6" aria-label={`Rank ${r.rank}`} /> : r.rank}
                  </span>
                  <Avatar name={r.displayName} avatar={r.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.displayName}{r.id === user.uid && <span className="ml-2 text-xs text-brand-300">you</span>}</p>
                    <p className="text-xs text-ink-400">{r.gamesPlayed} played · {r.winRate}% win rate</p>
                  </div>
                  <div className="shrink-0 text-right"><p className="font-display text-2xl font-bold tabular-nums">{r.gamesWon}</p><p className="text-xs text-ink-400">wins</p></div>
                </li>
              ))}
              {shown.length === 0 && <li className="rounded-2xl bg-ink-900/80 p-4 text-center text-sm text-ink-300">No player matches “{q}”.</li>}
            </ol>
          </>
        )}
    </div>
  );
}
