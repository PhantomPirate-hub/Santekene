'use client';

import React from 'react';
import AuthGuard from '@/components/shared/AuthGuard';

export default function MedecinLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={['MEDECIN']}>{children}</AuthGuard>;
}
