import { cx } from '../../utils/cx.js';

/** Grey pulsing placeholder shown while data loads (nicer than a spinner: the layout does not jump). */
export function Skeleton({ className }) {
  return <div aria-hidden className={cx('animate-pulse rounded-2xl bg-ink-800/80', className)} />;
}

export function SkeletonRows({ rows = 4, className = 'h-[4.25rem]' }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-2.5">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className={className} />)}
    </div>
  );
}
