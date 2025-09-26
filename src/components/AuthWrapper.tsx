'use client';

import { SessionProvider } from 'next-auth/react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
