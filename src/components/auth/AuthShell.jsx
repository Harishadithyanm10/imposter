import Logo from '../common/Logo.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-ink-700/70 bg-ink-900/85 p-6 shadow-2xl backdrop-blur sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-300">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-sm text-ink-300">{footer}</p>}
      </div>
    </div>
  );
}
