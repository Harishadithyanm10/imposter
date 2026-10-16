import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase.js';

/**
 * "One More Hint" for the current imposter. `used` flips true once their record exists; only then do
 * Security Rules allow reading the hint document, so `text` stays null until the ability is used.
 */
export function useExtraHint(roomId, uid, matchId, enabled) {
  const [used, setUsed] = useState(false);
  const [text, setText] = useState(null);
  useEffect(() => {
    setUsed(false); setText(null);
    if (!enabled || !matchId) return undefined;
    let unsubHint = null;
    const unsub = onSnapshot(doc(db, 'rooms', roomId, 'abilityUse', `${matchId}_${uid}`), (s) => {
      setUsed(s.exists());
      if (s.exists() && !unsubHint) {
        unsubHint = onSnapshot(doc(db, 'rooms', roomId, 'extraHints', uid), (h) => {
          const d = h.data();
          setText(d && d.matchId === matchId ? d.text : null);
        }, () => {});
      }
    }, () => {});
    return () => { unsub(); if (unsubHint) unsubHint(); };
  }, [roomId, uid, matchId, enabled]);
  return { used, text };
}
