import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#1d1d27" />
      <path d="M32 12c-9 0-15 6-15 15v14c0 3 2 5 5 5h4l2-4 2 4h4l2-4 2 4h4c3 0 5-2 5-5V27c0-9-6-15-15-15z" fill="#8b5cf6" />
      <circle cx="26" cy="29" r="3.5" fill="#0d0d12" />
      <circle cx="38" cy="29" r="3.5" fill="#ff3b5c" />
    </svg>
  );
}

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight ${className}`} aria-label="Imposter home">
      <LogoMark />
      <span>Imposter</span>
    </Link>
  );
}
