import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-screen place-items-center" role="status">
      <div className="flex flex-col items-center gap-3 text-ink-300">
        <Spinner className="h-8 w-8 text-brand-400" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}
