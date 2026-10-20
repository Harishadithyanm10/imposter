import { NavLink, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, History, Home, Play, Trophy, User } from 'lucide-react';
import Avatar from '../common/Avatar.jsx';
import { LogoMark } from '../common/Logo.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { tap } from '../../haptics.js';
import { cx } from '../../utils/cx.js';

const TABS = [
  { to: '/dashboard', label: 'Home', Icon: Home },
  { to: '/leaderboard', label: 'Ranks', Icon: Trophy },
  { to: '/create', label: 'Play', Icon: Play, center: true },
  { to: '/history', label: 'History', Icon: History },
  { to: '/profile', label: 'Profile', Icon: User },
];
const TITLES = { '/create': 'New game', '/join': 'Join room', '/leaderboard': 'Leaderboard', '/history': 'History', '/profile': 'Profile' };

/** The phone-app frame: slim top bar, page transitions and a bottom tab bar with a raised Play button. */
export default function AppShell() {
  const location = useLocation();
  const outlet = useOutlet();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const base = `/${location.pathname.split('/')[1]}`;
  const isTab = TABS.some((t) => t.to === location.pathname);
  const title = TITLES[base];

  return (
    <div className="min-h-dvh" style={{ paddingBottom: 'var(--tabbar-h)' }}>
      <header className="sticky top-[env(safe-area-inset-top)] z-40 border-b border-ink-800/80 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-3">
          {isTab || !title ? (
            <div className="flex min-w-0 items-center gap-2.5 pl-1">
              <LogoMark className="h-8 w-8 shrink-0" />
              <span className="truncate font-display text-lg font-extrabold">{title || 'Imposter'}</span>
            </div>
          ) : (
            <button onClick={() => { tap(); navigate(-1); }} aria-label="Back" className="flex min-w-0 items-center gap-1 rounded-full py-2 pl-1 pr-3 active:bg-ink-800">
              <ChevronLeft className="h-6 w-6 shrink-0" aria-hidden /><span className="truncate font-display text-lg font-extrabold">{title}</span>
            </button>
          )}
          {base !== '/profile' && (
            <button onClick={() => { tap(); navigate('/profile'); }} aria-label="Your profile" className="shrink-0 rounded-full p-0.5 active:scale-95">
              <Avatar name={profile?.displayName} avatar={profile?.avatar} size="sm" />
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-6 pt-4">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
          {outlet}
        </motion.div>
      </main>

      <nav data-tabbar aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid h-[4.25rem] max-w-md grid-cols-5 items-center px-1">
          {TABS.map(({ to, label, Icon, center }) => (
            <NavLink key={to} to={to} onClick={tap} aria-label={label}
              className={({ isActive }) => cx('relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors', center ? '' : 'h-full', !center && (isActive ? 'text-brand-300' : 'text-ink-400'))}>
              {({ isActive }) => center ? (
                <span className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-hot-500 text-white shadow-lg shadow-brand-600/40 ring-4 ring-ink-950 transition active:scale-90">
                  <Icon className="h-6 w-6 fill-current" aria-hidden />
                </span>
              ) : (
                <>
                  {isActive && <motion.span layoutId="tab-pill" className="absolute top-1.5 h-8 w-14 rounded-full bg-brand-600/20" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                  <Icon className="relative h-5 w-5" aria-hidden />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
