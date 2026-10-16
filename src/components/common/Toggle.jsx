import { cx } from '../../utils/cx.js';

/** Accessible on/off switch with a label and a short description. */
export default function Toggle({ label, hint, checked, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className={cx('flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition disabled:opacity-50', checked ? 'border-brand-500/60 bg-brand-600/10' : 'border-ink-700 bg-ink-800/60 hover:border-ink-500')}>
      <span aria-hidden className={cx('mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition', checked ? 'bg-brand-500' : 'bg-ink-600')}>
        <span className={cx('h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0')} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-100">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-400">{hint}</span>}
      </span>
    </button>
  );
}
