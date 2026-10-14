export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-700 px-6 py-10 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-ink-400" aria-hidden />}
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-ink-300">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
