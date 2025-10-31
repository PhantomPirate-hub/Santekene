'use client';

import React from 'react';
import AuthGuard from '@/components/shared/AuthGuard';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={['PATIENT']}>{children}</AuthGuard>;
}
