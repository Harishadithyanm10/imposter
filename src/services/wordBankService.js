// Loads the editable word list from Firestore (collection "words"). Cached for the session so a
// host only pays the reads once every few minutes. Returns null (=> use built-in list) on any problem.
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';
import { buildBank } from '../lib/words.jsx';

const TTL_MS = 10 * 60 * 1000;
let cache = null;

export async function loadWordBank() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.source;
  try {
    const snap = await getDocs(collection(db, 'words'));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.active !== false);
    const source = rows.length ? buildBank(rows) : null;
    cache = { at: Date.now(), source };
    return source;
  } catch {
    return null; // rules not deployed / offline: fall back to the built-in list
  }
}