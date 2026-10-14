import { useCallback, useState } from 'react';
import { useToast } from '../contexts/ToastContext.jsx';
import { errMsg } from '../utils/errors.js';

/** Runs an async action with a busy flag and an error toast. */
export function useAsyncAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, successMsg) => {
    setBusy(true);
    try {
      const result = await fn();
      if (successMsg) toast.success(successMsg);
      return { ok: true, result };
    } catch (e) {
      toast.error(errMsg(e));
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }, [toast]);
  return [run, busy];
}
