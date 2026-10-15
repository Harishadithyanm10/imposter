import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, MessageSquare, Smartphone, Swords, Trophy, Users, Vote } from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Logo from '../components/common/Logo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const FLOW = [
  { Icon: Eye, title: '1. Secret roles', text: 'Everyone sees the same secret word, except the imposters. An imposter only gets the topic and a short, vague clue about the word (never the word itself).' },
  { Icon: MessageSquare, title: '2. Clue turns', text: 'Players take turns, each with a timer. In "timer only" games you say your clue out loud and tap Done. If the host chose typed clues, you type one short clue (up to three words). Never say the secret word.' },
  { Icon: Users, title: '3. Discussion', text: 'Compare clues and argue. Whose clue sounded off? Who seemed to be guessing?' },
  { Icon: Vote, title: '4. Vote', text: 'Everyone votes in secret. You pick as many players as there are imposters: with 3 imposters you pick 3 different players.' },
  { Icon: Swords, title: '5. Result', text: 'The players with the most votes are eliminated and their roles are revealed (with an ejection animation). Eliminated players watch as spectators for the rest of the round. Then the round ends, or the same word continues into the next sub-round.' },
];

const WINS = [
  ['The crew wins the round', 'EVERY imposter has been caught (voted out). It can take several sub-rounds: catching only one of two imposters does not win the round.'],
  ['The imposters win the round', 'At least one imposter is still hiding after the last sub-round, OR the imposters match or outnumber the players still in the game.'],
];

const TABLE = [
  ['Finish a round on the winning side', '+1 win and +1 game played'],
  ['Finish a round on the losing side', '+0 wins, +1 game played'],
  ['Win rate', 'wins ÷ games played'],
  ['Leaderboard rank', '1) most wins, 2) best win rate, 3) fewer games played. Equal numbers share a rank.'],
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-3 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function HowToPlayPage() {
  const { user, loading } = useAuth();
  const authed = !loading && !!user;
  return (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Logo to={authed ? '/dashboard' : '/'} />
        <Link to={authed ? '/dashboard' : '/'} className="flex items-center gap-2 text-sm font-semibold text-ink-300 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden />Back</Link>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-4 pb-20 pt-4">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">How to play</h1>
          <p className="mt-3 text-lg text-ink-300">A word game of bluffing and deduction for 3 to 30 players. Most of you know a secret word. A few of you are faking it. Find the fakes before they blend in.</p>
        </div>

        <Section id="goal" title="The goal">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="!p-4"><p className="font-bold text-emerald-300">Crew</p><p className="mt-1 text-sm text-ink-300">You know the word. Prove it with clues that are clear to your friends but not too obvious, then catch an imposter.</p></Card>
            <Card className="!p-4"><p className="font-bold text-hot-400">Imposters</p><p className="mt-1 text-sm text-ink-300">You only have a clue. Listen carefully, work out the word, blend in, and survive every vote.</p></Card>
          </div>
        </Section>

        <Section id="rounds" title="Rounds and sub-rounds">
          <p className="text-ink-300">A game is made of <strong className="text-ink-100">rounds</strong> (the host picks 1 to 10). Every round has its own secret word and new roles. Each round is split into <strong className="text-ink-100">sub-rounds</strong> (default 3): the same word and the same roles, but a fresh set of clues, discussion and voting each time.</p>
          <ol className="mt-5 space-y-3">
            {FLOW.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-2xl border border-ink-700/70 bg-ink-900/80 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600/20 text-brand-300"><Icon className="h-5 w-5" aria-hidden /></span>
                <div className="min-w-0"><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-ink-300">{text}</p></div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="voting" title="How voting and elimination work">
          <ul className="list-disc space-y-2 pl-5 text-ink-300">
            <li>Each player picks <strong className="text-ink-100">one player per imposter still hiding</strong> (2 imposters left = 2 picks, 1 left = 1 pick). You cannot vote for yourself or pick the same player twice.</li>
            <li>The players with the <strong className="text-ink-100">most votes</strong> are eliminated, as many as there are imposters. Players with zero votes are never eliminated.</li>
            <li>If players are <strong className="text-ink-100">tied for the last spot</strong>, only those tied players get one revote. Players who were already clearly voted out stay out. If the revote is tied again, the tied players are spared.</li>
            <li>The same word continues in the next sub-round. Eliminated players cannot speak or vote any more in that round, but they keep watching. When the round ends, <strong className="text-ink-100">everyone plays again</strong> in the next round, with a new word and new imposters.</li>
          </ul>
        </Section>

        <Section id="winning" title="Who wins a round?">
          <div className="space-y-3">
            {WINS.map(([t, d], i) => (
              <Card key={t} className={`!p-4 ${i === 0 ? 'border-emerald-500/40' : 'border-hot-500/40'}`}><p className={`font-bold ${i === 0 ? 'text-emerald-300' : 'text-hot-400'}`}>{t}</p><p className="mt-1 text-sm text-ink-300">{d}</p></Card>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-300">The moment a round is decided, the secret word, the clue and the imposters are revealed. Then the next round begins with a new word and new roles for everyone, including players who were eliminated.</p>
        </Section>

        <Section id="points" title="The points system">
          <p className="text-ink-300">There are two levels of scoring: <strong className="text-ink-100">the game score</strong> (shared by the room) and <strong className="text-ink-100">your personal stats</strong> (for the leaderboard).</p>

          <Card className="mt-4 space-y-3">
            <h3 className="flex items-center gap-2 font-bold"><Trophy className="h-5 w-5 text-amber-300" aria-hidden />Game score (per room)</h3>
            <p className="text-sm text-ink-300">After every round, <strong className="text-emerald-300">1 point goes to the crew</strong> if they won it, or <strong className="text-hot-400">1 point goes to the imposters</strong> if they won it. After the last round the side with more round points wins the game. Equal points is a draw.</p>
          </Card>

          <Card className="mt-3 space-y-3">
            <h3 className="font-bold">Your personal stats and the leaderboard</h3>
            <p className="text-sm text-ink-300">Every finished round counts as one game for you. You win it if your side won, whichever role you had that round.</p>
            <dl className="divide-y divide-ink-700/70 text-sm">
              {TABLE.map(([k, v]) => <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4"><dt className="font-semibold">{k}</dt><dd className="text-ink-300">{v}</dd></div>)}
            </dl>
            <p className="text-xs text-ink-400">Your stats cannot be edited: the server only accepts a result for a round the host really finished, with your real role. Pass the phone games are played offline on one device and do not count towards the leaderboard.</p>
          </Card>

          <Card className="mt-3">
            <h3 className="font-bold">Example</h3>
            <p className="mt-2 text-sm text-ink-300">10 players, 2 imposters, 3 sub-rounds. <strong className="text-ink-100">Sub-round 1:</strong> everyone picks 2 players. The 2 most voted are out: one was an imposter, one was innocent. One imposter is still hiding, so the round continues with the same word and 8 players (the 2 eliminated players watch). <strong className="text-ink-100">Sub-round 2:</strong> everyone still in picks 1 player and the last imposter is caught. Every imposter is caught, so the <strong className="text-emerald-300">crew wins the round</strong>: the crew gets 1 point, each crew member gets +1 win and +1 game, and the imposters get +1 game and no win. <strong className="text-ink-100">Round 2</strong> then starts with a new word and new imposters, and all 10 players take part again. If the last imposter had survived all 3 sub-rounds, the imposters would have won the round instead.</p>
          </Card>
        </Section>

        <Section id="tips" title="Tips">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="!p-4"><p className="font-bold text-emerald-300">If you are crew</p><ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-300"><li>Give a clue that fits the word but does not make it obvious.</li><li>Watch for clues that are too vague or copy someone else.</li><li>Use every sub-round: your first vote is rarely your last chance.</li></ul></Card>
            <Card className="!p-4"><p className="font-bold text-hot-400">If you are an imposter</p><ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-300"><li>Use your topic and clue to guess the word, then blend in.</li><li>Listen to the first clues before you speak if you can.</li><li>Point at someone else when you are accused, calmly.</li></ul></Card>
          </div>
        </Section>

        <Section id="modes" title="Ways to play">
          <ul className="list-disc space-y-2 pl-5 text-ink-300">
            <li><strong className="text-ink-100">Online room:</strong> create a room, share the 6-character code, and everyone joins from their own phone. The host chooses players (up to 30), imposters, rounds, sub-rounds, timers, topic and difficulty, and whether clues are spoken or typed.</li>
            <li><strong className="text-ink-100 inline-flex items-center gap-1.5"><Smartphone className="h-4 w-4" aria-hidden />Pass the phone:</strong> one phone for the whole group. No account and no room. Pass it around to see your role and to vote in secret.</li>
          </ul>
        </Section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button to={authed ? '/create' : '/register'} size="lg">{authed ? 'Create a room' : 'Create an account'}</Button>
          <Button to="/pass-and-play" variant="secondary" size="lg"><Smartphone className="h-5 w-5" aria-hidden />Play on one phone</Button>
          {authed && <Button to="/leaderboard" variant="ghost" size="lg"><Trophy className="h-5 w-5" aria-hidden />Leaderboard</Button>}
        </div>
      </main>
    </div>
  );
}
