import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, History, Home, LogOut, Play, Trophy, User, UserCog } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import Avatar from '../common/Avatar.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { cx } from '../../utils/cx.js';

const LINKS = [
  { to: '/dashboard', label: 'Home', Icon: Home },
  { to: '/create', label: 'Play', Icon: Play },
  { to: '/leaderboard', label: 'Ranks', Icon: Trophy },
  { to: '/history', label: 'History', Icon: History },
  { to: '/profile', label: 'Profile', Icon: User },
];
const linkCls = ({ isActive }) => cx('flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition', isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white');

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo to="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map(({ to, label, Icon }) => <NavLink key={to} to={to} className={linkCls}><Icon className="h-4 w-4" aria-hidden />{label}</NavLink>)}
          </nav>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-ink-800">
              <Avatar name={profile?.displayName} avatar={profile?.avatar} size="sm" />
              <span className="hidden max-w-[8rem] truncate text-sm font-semibold sm:block">{profile?.displayName}</span>
            </button>
            {open && (
              <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl border border-ink-700 bg-ink-900 p-2 shadow-2xl">
                <div className="px-3 py-2">
                  <p className="truncate font-semibold">{profile?.displayName}</p>
                  <p className="truncate text-xs text-ink-400">{user?.email}</p>
                </div>
                <hr className="my-1 border-ink-700" />
                <button role="menuitem" onClick={() => { setOpen(false); navigate('/profile'); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-ink-800"><UserCog className="h-4 w-4" aria-hidden />Edit profile</button>
                <button role="menuitem" onClick={() => { setOpen(false); navigate('/history'); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-ink-800"><History className="h-4 w-4" aria-hidden />Game history</button>
                <button role="menuitem" onClick={() => { setOpen(false); navigate('/how-to-play'); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-ink-800"><BookOpen className="h-4 w-4" aria-hidden />How to play</button>
                <button role="menuitem" onClick={async () => { setOpen(false); await logout(); navigate('/'); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-hot-400 hover:bg-ink-800"><LogOut className="h-4 w-4" aria-hidden />Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink-800 bg-ink-950/95 backdrop-blur md:hidden" aria-label="Main mobile">
        {LINKS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cx('flex flex-col items-center gap-1 py-2.5 text-xs font-semibold', isActive ? 'text-brand-300' : 'text-ink-400')}>
            <Icon className="h-5 w-5" aria-hidden />{label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
