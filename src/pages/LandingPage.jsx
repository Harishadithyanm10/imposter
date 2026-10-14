import { motion } from 'framer-motion';
import { Eye, Lock, MessageSquare, Radio, Users, Vote, Zap } from 'lucide-react';
import Logo from '../components/common/Logo.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const STEPS = [
  { Icon: Eye, title: 'Get your secret', text: 'Everyone sees the same word, except the imposter, who gets a different one or only a vague clue.' },
  { Icon: MessageSquare, title: 'Give one clue each', text: 'Take turns with a short clue that proves you know the word without giving it away.' },
  { Icon: Users, title: 'Talk it out', text: 'Compare clues in person or on a call. Someone is bluffing.' },
  { Icon: Vote, title: 'Vote them out', text: 'Everyone votes in secret. Find all the imposters before they outnumber you.' },
];
const FEATURES = [
  { Icon: Lock, title: 'Private rooms', text: 'Create a room, share a six-character code or an invite link, and play only with your friends.' },
  { Icon: Radio, title: 'Live multiplayer', text: 'Lobbies, clues, votes and results update instantly for everyone, with reconnection built in.' },
  { Icon: Zap, title: 'Fair by design', text: 'Roles are dealt and votes are counted on the server, so nobody can peek at another player’s word.' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const authed = !loading && !!user;
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Account">
          {authed ? <Button to="/dashboard" size="sm">Play Now</Button> : (
            <>
              <Button to="/login" variant="ghost" size="sm">Login</Button>
              <Button to="/register" size="sm">Create Account</Button>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12 text-center sm:pt-20">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="mx-auto mb-8 w-fit">
          <div className="relative rounded-3xl bg-ink-800 p-5 ring-1 ring-ink-600">
            <svg viewBox="0 0 64 64" className="h-24 w-24" aria-hidden>
              <path d="M32 8c-11 0-19 8-19 19v18c0 4 3 7 7 7h5l2-5 3 5h4l3-5 2 5h5c4 0 7-3 7-7V27C51 16 43 8 32 8z" fill="#8b5cf6" />
              <circle cx="24" cy="29" r="4.5" fill="#0d0d12" />
              <motion.circle cx="40" cy="29" r="4.5" fill="#ff3b5c" animate={{ opacity: [1, 0.25, 1] }} transition={{ repeat: Infinity, duration: 2.4 }} />
            </svg>
          </div>
        </motion.div>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.05] sm:text-7xl">Trust Nobody. Read Everybody.</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-300">A word game of bluffing and deduction for 3 to 30 friends. One of you is faking it.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {authed ? <Button to="/dashboard" size="lg">Play Now</Button> : (
            <>
              <Button to="/register" size="lg">Create Account</Button>
              <Button to="/login" variant="secondary" size="lg">Login</Button>
            </>
          )}
        </div>
      </section>

      <section id="how-to-play" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-bold">How to play</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="rounded-3xl border border-ink-700/70 bg-ink-900/80 p-5">
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand-600/20 text-brand-300"><Icon className="h-5 w-5" aria-hidden /></span>
              <h3 className="text-lg font-bold"><span className="sr-only">Step {i + 1}: </span>{title}</h3>
              <p className="mt-2 text-sm text-ink-300">{text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 rounded-2xl bg-ink-900/80 p-4 text-sm text-ink-300 ring-1 ring-ink-700">
          Example: the crew all hold <strong className="text-ink-100">Coffee</strong>. The imposter holds <strong className="text-hot-400">Tea</strong>. Their clue has to sound right without knowing why.
        </p>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-3xl font-bold">Built for game night</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-ink-700/70 bg-gradient-to-b from-ink-800/70 to-ink-900/70 p-6">
              <Icon className="h-6 w-6 text-hot-400" aria-hidden />
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm text-ink-300">{text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-ink-800 py-8 text-center text-sm text-ink-400">Imposter · Gather your friends and find the fake.</footer>
    </div>
  );
}
