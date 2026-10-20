import { useEffect, useState } from 'react';
import { BookOpen, DoorOpen, Gamepad2, Plus, Smartphone, Trophy } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { computeStats, getHistory } from '../services/profileService.js';
import { formatDate } from '../utils/time.js';
import { isApp } from '../native.js';
import AppHome from './AppHome.jsx';
import { SkeletonRows } from '../components/common/Skeleton.jsx';
import HistoryRow from '../components/common/HistoryRow.jsx';

function Stat({ label, value }) {
  return (
    <Card className="!p-4">
      <p className="text-sm text-ink-400">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</p>
    </Card>
  );
}

export default function DashboardPage() {
  return isApp ? <AppHome /> : <WebDashboard />;
}

function WebDashboard() {
  const { user, profile } = useAuth();
  const [recent, setRecent] = useState(null);
  const stats = computeStats(profile);

  useEffect(() => { getHistory(user.uid, 5).then(setRecent).catch(() => setRecent([])); }, [user.uid]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Welcome, {profile.displayName}</h1>
          <p className="mt-1 text-ink-300">{stats.played ? 'Ready for another round?' : 'Start a room or join your friends to play your first game.'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button to="/create" size="lg"><Plus className="h-5 w-5" aria-hidden />Create room</Button>
          <Button to="/join" variant="secondary" size="lg"><DoorOpen className="h-5 w-5" aria-hidden />Join room</Button>
          <Button to="/pass-and-play" variant="secondary" size="lg"><Smartphone className="h-5 w-5" aria-hidden />Pass the phone</Button>
          <Button to="/leaderboard" variant="ghost" size="lg"><Trophy className="h-5 w-5" aria-hidden />Leaderboard</Button>
          <Button to="/how-to-play" variant="ghost" size="lg"><BookOpen className="h-5 w-5" aria-hidden />How to play</Button>
        </div>
      </div>

      {stats.played > 0 && (
        <section aria-label="Your stats" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Games played" value={stats.played} />
          <Stat label="Wins" value={stats.wins} />
          <Stat label="Losses" value={stats.losses} />
          <Stat label="Win rate" value={`${stats.winRate}%`} />
        </section>
      )}

      <section aria-label="Recent games">
        <h2 className="mb-3 text-xl font-bold">Recent games</h2>
        {recent === null ? <SkeletonRows rows={3} />
          : recent.length === 0 ? (
            <EmptyState icon={Gamepad2} title="No games yet" action={<Button to="/create">Create your first room</Button>}>
              Your results and win rate will show up here after you finish a game.
            </EmptyState>
          ) : (
            <div className="space-y-2">{recent.map((g) => <HistoryRow key={g.id} game={g} formatDate={formatDate} />)}</div>
          )}
        {recent?.length > 0 && <p className="mt-3 flex items-center gap-2 text-sm text-ink-400"><Trophy className="h-4 w-4" aria-hidden />Full list on the History page.</p>}
      </section>
    </div>
  );
}
