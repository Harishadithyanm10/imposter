import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import HistoryRow from '../components/common/HistoryRow.jsx';
import { SkeletonRows } from '../components/common/Skeleton.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { computeStats, getHistory } from '../services/profileService.js';
import { formatDate } from '../utils/time.js';

export default function GameHistoryPage() {
  const { user, profile } = useAuth();
  const [games, setGames] = useState(null);
  const [failed, setFailed] = useState(false);
  const s = computeStats(profile);

  useEffect(() => { getHistory(user.uid, 50).then(setGames).catch(() => { setFailed(true); setGames([]); }); }, [user.uid]);

  return (
    <div className="space-y-6">
      <h1 data-title className="text-3xl font-bold">Game history</h1>
      <div className="grid grid-cols-3 gap-3">
        {[['Games played', s.played], ['Total wins', s.wins], ['Win percentage', `${s.winRate}%`]].map(([l, v]) => (
          <Card key={l} className="!p-4"><p className="text-sm text-ink-400">{l}</p><p className="mt-1 font-display text-3xl font-bold tabular-nums">{v}</p></Card>
        ))}
      </div>
      {failed && <p role="alert" className="text-sm text-hot-400">Could not load your history. Try again in a moment.</p>}
      {games === null ? <SkeletonRows rows={6} />
        : games.length === 0 ? (
          <EmptyState icon={History} title="Nothing here yet" action={<Button to="/create">Start a game</Button>}>Finished games appear here with your role and result.</EmptyState>
        ) : <div className="space-y-2">{games.map((g) => <HistoryRow key={g.id} game={g} formatDate={formatDate} />)}</div>}
    </div>
  );
}
