export const tsMs = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : typeof t === 'number' ? t : 0);

export function formatDate(t) {
  const ms = tsMs(t);
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
