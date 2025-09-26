"use client";

import { usePathname } from 'next/navigation';

export default function UserDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <main className="font-sans flex-grow container mx-auto px-4 py-8">
      {children}
    </main>
  );
}
