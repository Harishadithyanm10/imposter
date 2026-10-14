export default function HistoryRow({ game, formatDate }) {
  const crew = game.role === 'NORMAL';
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink-700/70 bg-ink-900/80 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-semibold">{game.roomName}</p>
        <p className="text-xs text-ink-400">{formatDate(game.completedAt)} · {game.rounds} round{game.rounds === 1 ? '' : 's'} · played as {crew ? 'crew' : 'imposter'}</p>
        <p className="mt-0.5 truncate text-xs text-ink-400">{game.winner === 'NORMAL' ? 'Crew won' : 'Imposters won'}: {game.reason}</p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${game.won ? 'bg-emerald-500/15 text-emerald-300' : 'bg-hot-600/15 text-hot-400'}`}>{game.won ? 'Win' : 'Loss'}</span>
    </div>
  );
}
