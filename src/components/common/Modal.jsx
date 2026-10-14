import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button.jsx';

export default function Modal({ open, onClose, title, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-end overflow-y-auto bg-black/70 sm:place-items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
            initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
            className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-ink-700 bg-ink-900 p-5 shadow-2xl focus:outline-none sm:rounded-3xl sm:p-6`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1 text-ink-400 hover:text-ink-100"><X className="h-5 w-5" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = true, loading = false, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-ink-300">{message}</p>
      {children}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
