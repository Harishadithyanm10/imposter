import Avatar from '../common/Avatar.jsx';
import { useRoom } from '../../contexts/RoomContext.jsx';
import { SPOKE_MARK } from '../../services/gameService.js';

/** Typed clues, or (timer-only mode) just who has already spoken. */
export default function ClueList() {
  const { clues, playerOf } = useRoom();
  if (!clues.length) return <p className="text-sm text-ink-400">No clues yet.</p>;
  return (
    <ul className="space-y-2">
      {clues.map((c) => {
        const p = playerOf(c.uid);
        const spoke = c.clue === SPOKE_MARK;
        return (
          <li key={c.id} className="flex items-start gap-3 rounded-2xl bg-ink-800/70 px-3 py-2.5 sm:items-center sm:px-4 sm:py-3">
            <Avatar name={p.displayName} avatar={p.avatar} size="sm" />
            <span className="min-w-0 flex-1 truncate font-semibold">{p.displayName}</span>
            <span className={`min-w-0 max-w-[55%] break-words text-right text-base sm:text-lg ${c.skipped || spoke ? 'italic text-ink-400' : 'font-display font-bold'}`}>{spoke ? 'spoke' : c.skipped ? 'skipped' : c.clue}</span>
          </li>
        );
      })}
    </ul>
  );
}
