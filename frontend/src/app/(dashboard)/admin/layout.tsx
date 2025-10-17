'use client';

import React from 'react';
import AuthGuard from '@/components/shared/AuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={['ADMIN']}>{children}</AuthGuard>;
}
