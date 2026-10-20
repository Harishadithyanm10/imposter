import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/common/Button.jsx';
import GoogleButton from '../components/auth/GoogleButton.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { errMsg } from '../utils/errors.js';

/** First screen of the phone app for signed-out players. Replaces the marketing landing page. */
export default function WelcomePage() {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function google() {
    setBusy(true);
    try { await loginWithGoogle(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-600/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-48 h-64 w-64 rounded-full bg-hot-600/15 blur-3xl" aria-hidden />

      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          className="relative grid h-36 w-36 place-items-center">
          <span className="boot-ring" /><span className="boot-ring r2" />
          <div className="rounded-[2rem] bg-ink-800 p-6 shadow-2xl shadow-brand-600/30 ring-1 ring-ink-600">
            <svg viewBox="0 0 64 64" className="boot-ghost !h-20 !w-20" aria-hidden>
              <path d="M32 12c-9 0-15 6-15 15v14c0 3 2 5 5 5h4l2-4 2 4h4l2-4 2 4h4c3 0 5-2 5-5V27c0-9-6-15-15-15z" fill="#8b5cf6" />
              <circle cx="26" cy="29" r="3.5" fill="#0d0d12" /><circle className="boot-eye" cx="38" cy="29" r="3.5" fill="#ff3b5c" />
            </svg>
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-10 font-display text-5xl font-extrabold">Imposter</motion.h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-3 max-w-xs text-lg text-ink-300">Trust nobody. Read everybody.</motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="relative space-y-3">
        <GoogleButton onClick={google} loading={busy} large />
        <Button to="/register" size="lg" className="w-full">Create account</Button>
        <Button to="/login" variant="secondary" size="lg" className="w-full">Log in with email</Button>
        <div className="flex justify-center gap-6 pt-3 text-sm font-semibold text-ink-300">
          <Link to="/pass-and-play" className="py-2 active:text-white">Play on one phone</Link>
          <Link to="/how-to-play" className="py-2 active:text-white">How to play</Link>
        </div>
      </motion.div>
    </div>
  );
}
