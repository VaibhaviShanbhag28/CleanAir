import { useEffect } from 'react';
import { onAuthStateChanged, auth } from '@/lib/firebase';
import { useAppStore } from '@/store';
import type { User } from '@/types';

export function useAuth() {
  const { setUser, user } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (fbUser) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || undefined,
            displayName: fbUser.displayName || undefined,
            photoURL: fbUser.photoURL || undefined,
            role: 'citizen',
          } as User);
        } else {
          setUser(null);
        }
      }
    );
    return unsubscribe;
  }, [setUser]);

  return { user };
}
