import { Link } from 'react-router-dom';
import { cx } from '../../utils/cx.js';
import { tap } from '../../haptics.js';
import { Spinner } from './Spinner.jsx';

const VARIANTS = {
  primary: 'bg-gradient-to-r from-brand-600 to-hot-500 text-white shadow-lg shadow-brand-600/20 hover:brightness-110',
  secondary: 'bg-ink-700 text-ink-100 hover:bg-ink-600',
  ghost: 'text-ink-300 hover:bg-ink-800 hover:text-ink-100',
  danger: 'bg-hot-600/15 text-hot-400 ring-1 ring-hot-500/40 hover:bg-hot-600/25',
};
const SIZES = { sm: 'min-h-9 px-3 py-1.5 text-sm', md: 'min-h-11 px-5 py-2.5 text-sm', lg: 'min-h-12 px-7 py-3.5 text-base' };

export default function Button({ variant = 'primary', size = 'md', loading = false, disabled, to, className, children, onClick, ...rest }) {
  const cls = cx(
    'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition duration-100 focus-visible:outline-2 active:scale-[0.97] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant], SIZES[size], className,
  );
  // a light vibration on every tap inside the Android / iOS apps
  const press = (e) => { tap(); onClick?.(e); };
  if (to) return <Link to={to} className={cls} onClick={press} {...rest}>{children}</Link>;
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} onClick={press} {...rest}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
