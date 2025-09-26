"use client";

import { usePathname } from 'next/navigation';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Toaster } from '@/components/ui/toaster';

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-background">
        {children}
      </main>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="flex-1 md:mr-64 mt-16 md:mt-0">
        <div className="p-4 md:p-8 max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
