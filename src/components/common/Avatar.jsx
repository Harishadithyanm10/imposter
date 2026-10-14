import { AVATARS } from '../../constants/avatars.js';
import { cx } from '../../utils/cx.js';

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-xl' };

export default function Avatar({ name = '?', avatar = 'violet', size = 'md', status, className }) {
  const initials = name.trim().slice(0, 2).toUpperCase();
  return (
    <span className={cx('relative inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white', AVATARS[avatar] || AVATARS.violet, SIZES[size], className)} aria-hidden>
      {initials}
      {status && (
        <span className={cx('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-900', status === 'online' ? 'bg-emerald-400' : 'bg-ink-400')} />
      )}
    </span>
  );
}
