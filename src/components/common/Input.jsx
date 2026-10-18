import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cx } from '../../utils/cx.js';

export default function Input({ label, error, hint, type = 'text', className, inputClassName, ...rest }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-100">{label}</label>}
      <div className="relative">
        <input
          id={id}
          type={isPw && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cx(
            'w-full rounded-xl border bg-ink-800 px-3.5 py-3 text-base text-ink-100 sm:py-2.5 sm:text-sm placeholder:text-ink-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40',
            error ? 'border-hot-500' : 'border-ink-600', isPw && 'pr-11', inputClassName,
          )}
          {...rest}
        />
        {isPw && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-400 hover:text-ink-100">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-hot-400">{error}</p>
        : hint ? <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}

export function Select({ label, value, onChange, options, className, hint }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-100">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-ink-600 bg-ink-800 px-3.5 py-3 text-base text-ink-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 sm:py-2.5 sm:text-sm">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
