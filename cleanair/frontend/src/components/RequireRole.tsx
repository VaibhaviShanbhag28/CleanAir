import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';
import type { UserRole } from '@/types';

/**
 * Route guard. Signed-in users who haven't completed onboarding are sent to
 * the wizard; users lacking the required role are sent home. Signed-out
 * visitors keep the existing public browsing behavior unless roles are given.
 */
export default function RequireRole({ roles, children }: {
  roles?: UserRole[];
  children: React.ReactElement;
}) {
  const { user, authReady } = useAppStore();
  const location = useLocation();

  if (!authReady) return null; // initial auth check still settling

  if (user && user.onboarded === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }
  return children;
}
