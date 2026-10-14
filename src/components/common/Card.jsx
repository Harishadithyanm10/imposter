import { cx } from '../../utils/cx.js';

export default function Card({ className, children, as: Tag = 'div', ...rest }) {
  return <Tag className={cx('rounded-3xl border border-ink-700/70 bg-ink-900/80 p-5 backdrop-blur sm:p-6', className)} {...rest}>{children}</Tag>;
}
