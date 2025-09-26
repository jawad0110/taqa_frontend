"use client";

import "./globals.css";
import { AuthWrapper } from '@/components/AuthWrapper';
import Navbar from '@/components/Navbar';
import { Navigation } from '@/components/Navigation';
import { Providers } from '@/components/Providers';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CartProvider } from '@/contexts/CartContext';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';

// Define system font stack
const arkanFont = 'Arkan, system-ui, sans-serif';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin_dashboard');

  if (isAdminRoute) {
    return (
      <div className="flex-grow">
        <main className="flex-grow">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex-grow">
      <Navbar />
      <Navigation>
        <main className="flex-grow">
          {children}
        </main>
      </Navigation>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="font-sans h-full flex flex-col" style={{ fontFamily: arkanFont }}>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-6YRYV2XXCK" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-6YRYV2XXCK');
            `,
          }}
        />
        {/* Cookiebot */}
        <script 
          id="Cookiebot" 
          src="https://consent.cookiebot.com/uc.js" 
          data-cbid="799ea66d-d605-4d90-9a4a-9b4cbc0700d2" 
          type="text/javascript" 
          async 
        />
        <Providers>
          <AuthWrapper>
            <WishlistProvider>
              <CartProvider>
                <PerformanceMonitor />
                <LayoutContent>
                  {children}
                </LayoutContent>
              </CartProvider>
            </WishlistProvider>
            <Toaster />
          </AuthWrapper>
        </Providers>
      </body>
    </html>
  );
}
