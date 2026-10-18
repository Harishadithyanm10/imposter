import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const STYLES = {
  success: { Icon: CheckCircle2, cls: 'border-emerald-500/40 text-emerald-200' },
  error: { Icon: AlertTriangle, cls: 'border-hot-500/50 text-hot-400' },
  info: { Icon: Info, cls: 'border-brand-500/40 text-brand-300' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-3" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => {
            const { Icon, cls } = STYLES[t.type];
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-ink-800/95 px-4 py-3 text-sm shadow-xl backdrop-blur ${cls}`}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p className="flex-1 text-ink-100">{t.message}</p>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-ink-400 hover:text-ink-100"><X className="h-4 w-4" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
