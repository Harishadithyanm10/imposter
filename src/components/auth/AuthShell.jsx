import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Logo, { LogoMark } from '../common/Logo.jsx';
import { isApp } from '../../native.js';

export default function AuthShell({ title, subtitle, children, footer }) {
  // Phone app: a full-screen page with a back arrow, not a floating website card.
  if (isApp) {
    return (
      <div className="flex min-h-dvh flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex h-12 items-center">
          <Link to="/" aria-label="Back" className="-ml-2 grid h-11 w-11 place-items-center rounded-full text-ink-300 active:bg-ink-800"><ChevronLeft className="h-6 w-6" aria-hidden /></Link>
        </div>
        <div className="mt-1">
          <LogoMark className="h-12 w-12" />
          <h1 className="mt-5 text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-300">{subtitle}</p>}
        </div>
        <div className="mt-7 flex-1">{children}</div>
        {footer && <p className="mt-6 text-center text-sm text-ink-300">{footer}</p>}
      </div>
    );
  }
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-ink-700/70 bg-ink-900/85 p-6 shadow-2xl backdrop-blur sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-300">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-sm text-ink-300">{footer}</p>}
      </div>
    </div>
  );
}
