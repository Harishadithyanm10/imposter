import { Loader2 } from 'lucide-react';
import AppLoader from './AppLoader.jsx';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function FullPageSpinner({ label = 'Loading…' }) {
  return <AppLoader label={label} />;
}
