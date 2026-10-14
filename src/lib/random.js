// Browser/Node CSPRNG helpers (crypto.getRandomValues), unbiased.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // no 0/O/1/I/L

export function randomInt(n) {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  let x;
  do { globalThis.crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
  return x % n;
}
export const roomCode = (len = 6) => Array.from({ length: len }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const pick = (arr) => arr[randomInt(arr.length)];
