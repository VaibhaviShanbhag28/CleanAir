import { useEffect } from 'react';
import { onAuthStateChanged, auth } from '@/lib/firebase';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import type { User } from '@/types';

export function useAuth() {
  const { setUser, setAuthReady, user } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }
      const base: User = {
        uid: fbUser.uid,
        email: fbUser.email || undefined,
        displayName: fbUser.displayName || undefined,
        photoURL: fbUser.photoURL || undefined,
        role: 'citizen',
        onboarded: undefined, // unknown until /auth/me answers
      };
      setUser(base);
      try {
        const profile = await api.auth.me();
        setUser({
          ...base,
          ...profile,
          role: (profile.role as User['role']) || 'citizen',
          onboarded: profile.onboarded,
        });
      } catch {
        // Backend unreachable — keep Firebase identity, treat as onboarded
        // so the app stays usable offline/against an old backend.
        setUser({ ...base, onboarded: true });
      } finally {
        setAuthReady(true);
      }
    });
    return unsubscribe;
  }, [setUser, setAuthReady]);

  return { user };
}
