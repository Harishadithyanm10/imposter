import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import * as authService from '../services/authService.js';
import { subscribeProfile } from '../services/profileService.js';
import { syncMyLeaderboard } from '../services/leaderboardService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const registering = useRef(false);
  const synced = useRef('');

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setAuthReady(true);
    if (!u) { setProfile(null); setProfileReady(true); } else setProfileReady(false);
  }), []);

  // Live profile (stats update in real time after a game ends).
  useEffect(() => {
    if (!user) return undefined;
    let healTimer;
    const unsub = subscribeProfile(user.uid, (p) => {
      setProfile(p);
      setProfileReady(true);
      if (p) { // keep this player's public leaderboard entry present and current
        const sig = `${p.id}|${p.displayName}|${p.avatar}|${p.gamesPlayed}|${p.gamesWon}`;
        if (synced.current !== sig) { synced.current = sig; syncMyLeaderboard(p.id, p).catch(() => { synced.current = ''; }); }
      }
      clearTimeout(healTimer);
      // Self-heal: signed in but no profile (e.g. interrupted first Google sign-in).
      if (!p && !registering.current) healTimer = setTimeout(() => { if (!registering.current) authService.ensureProfile(auth.currentUser).catch(() => {}); }, 1500);
    }, () => setProfileReady(true));
    return () => { clearTimeout(healTimer); unsub(); };
  }, [user]);

  const signUp = useCallback(async (values) => {
    registering.current = true;
    try { return await authService.registerWithEmail(values); } finally { registering.current = false; }
  }, []);

  const value = useMemo(() => ({
    user, profile,
    loading: !authReady || (!!user && !profileReady),
    signUp,
    login: authService.loginWithEmail,
    loginWithGoogle: authService.loginWithGoogle,
    logout: authService.logout,
    resetPassword: authService.resetPassword,
    reauthenticate: (password) => authService.reauthenticate(auth.currentUser, password),
  }), [user, profile, authReady, profileReady, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
