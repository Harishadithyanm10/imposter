/** Branded full-screen loader. Identical to the launch screen in index.html, so opening the app is one smooth animation. */
export default function AppLoader({ label }) {
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[41] flex flex-col items-center justify-center gap-9 bg-ink-950">
      <div className="boot-wrap">
        <i className="boot-ring" /><i className="boot-ring r2" />
        <svg className="boot-ghost" viewBox="0 0 64 64" aria-hidden>
          <path d="M32 12c-9 0-15 6-15 15v14c0 3 2 5 5 5h4l2-4 2 4h4l2-4 2 4h4c3 0 5-2 5-5V27c0-9-6-15-15-15z" fill="#8b5cf6" />
          <circle cx="26" cy="29" r="3.5" fill="#0d0d12" /><circle className="boot-eye" cx="38" cy="29" r="3.5" fill="#ff3b5c" />
        </svg>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="boot-dots" aria-hidden><b /><b /><b /></div>
        {label ? <p className="text-sm text-ink-300">{label}</p> : <span className="sr-only">Loading</span>}
      </div>
    </div>
  );
}
