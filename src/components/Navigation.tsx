'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';

export function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  const isAdminPage = pathname?.startsWith('/admin_dashboard');

  return (
    <>
      {children}
      {!isAuthPage && !isAdminPage && <Footer />}
    </>
  );
}
