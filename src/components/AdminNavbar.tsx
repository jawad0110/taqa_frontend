'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Users, ShoppingCart, Star, Settings, LogOut, Menu, X, Truck, ChevronRight, BadgePercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

const navItems = [
  {
    name: 'لوحة التحكم',
    href: '/admin_dashboard',
    icon: LayoutDashboard,
    description: 'نظرة عامة على النشاط'
  },
  {
    name: 'المنتجات',
    href: '/admin_dashboard/products',
    icon: Package,
    description: 'إدارة المنتجات والمخزون'
  },
  {
    name: 'الخصومات',
    href: '/admin_dashboard/discounts',
    icon: BadgePercent,
    description: 'إنشاء وإدارة العروض'
  },
  {
    name: 'الطلبات',
    href: '/admin_dashboard/orders',
    icon: ShoppingCart,
    description: 'متابعة حالة الطلبات'
  },
  {
    name: 'أسعار الشحن',
    href: '/admin_dashboard/shipping-rates',
    icon: Truck,
    description: 'إعدادات الشحن والتوصيل'
  },
  {
    name: 'العملاء',
    href: '/admin_dashboard/users',
    icon: Users,
    description: 'إدارة حسابات العملاء'
  },
  {
    name: 'التقييمات',
    href: '/admin_dashboard/reviews',
    icon: Star,
    description: 'مراجعة تقييمات العملاء'
  },
  {
    name: 'الإعدادات',
    href: '/admin_dashboard/settings',
    icon: Settings,
    description: 'إعدادات النظام العامة'
  }
];

function NavItem({ item, isActive, onClick, showDescription = false }: { 
  item: typeof navItems[0], 
  isActive: boolean, 
  onClick: () => void,
  showDescription?: boolean 
}) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start gap-3 px-4 py-3 text-left min-h-[52px] touch-manipulation transition-all duration-200 group relative overflow-hidden',
        'flex-row rounded-xl',
        isActive 
          ? 'bg-gradient-to-l from-primary/20 to-primary/10 text-primary shadow-sm border-l-2 border-primary' 
          : 'hover:bg-gradient-to-l hover:from-muted/80 hover:to-muted/40 hover:shadow-sm',
        'focus:ring-2 focus:ring-primary/20 focus:outline-none'
      )}
      onClick={onClick}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
      )}

      <div className="flex items-center gap-3 flex-1">
        <div className="flex flex-col items-start flex-1">
          <span className={cn(
            "text-sm font-medium transition-colors",
            isActive ? "text-primary" : "text-foreground"
          )}>
            {item.name}
          </span>
          {showDescription && (
            <span className="text-xs text-muted-foreground mt-0.5 leading-tight">
              {item.description}
            </span>
          )}
        </div>

        {/* Icon on the right */}
        <item.icon className={cn(
          "h-5 w-5 flex-shrink-0 transition-transform duration-200",
          isActive ? "scale-110" : "group-hover:scale-105"
        )} />
      </div>

      {/* Hover chevron */}
      <ChevronRight className={cn(
        "h-4 w-4 transition-all duration-200 opacity-0 group-hover:opacity-60",
        "transform translate-x-2 group-hover:translate-x-0"
      )} />
    </Button>
  );
}

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isDesktop && isMobileMenuOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
          setIsMobileMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen, isDesktop]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  const currentPage = navItems.find(item => 
    pathname === item.href || 
    (item.href !== '/admin_dashboard' && pathname?.startsWith(item.href))
  ) || navItems[0];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 right-0 left-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-40 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "mobile-menu-button flex items-center justify-center rounded-xl transition-all duration-200",
              "min-h-[44px] min-w-[44px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/20",
              isMobileMenuOpen 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label="القائمة"
          >
            <div className="relative w-6 h-6">
              <Menu className={cn(
                "absolute inset-0 transition-all duration-200",
                isMobileMenuOpen ? "opacity-0 rotate-180" : "opacity-100 rotate-0"
              )} />
              <X className={cn(
                "absolute inset-0 transition-all duration-200",
                isMobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"
              )} />
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            <currentPage.icon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text text-transparent">
              {currentPage?.name}
            </h1>
          </div>
          
          <div className="w-11"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {!isDesktop && isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden mt-16"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-background/95 backdrop-blur-sm md:hidden mobile-menu overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Mobile menu header */}
              <div className="px-4 py-6 border-b border-border/50">
                <h2 className="text-xl font-bold bg-gradient-to-l from-primary to-primary/80 bg-clip-text text-transparent">
                  لوحة التحكم
                </h2>
                <p className="text-sm text-muted-foreground mt-1">إدارة المتجر الإلكتروني</p>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <nav className="space-y-2 px-4 py-4">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/admin_dashboard' && pathname?.startsWith(item.href));
                    
                    return (
                      <NavItem 
                        key={item.href}
                        item={item}
                        isActive={isActive}
                        showDescription={true}
                        onClick={() => router.push(item.href)}
                      />
                    );
                  })}
                </nav>
              </div>
              
              {/* Mobile menu footer */}
              <div className="border-t border-border/50 p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 px-4 py-3 text-left text-destructive hover:bg-destructive/10 hover:text-destructive min-h-[52px] touch-manipulation rounded-xl transition-all duration-200 group"
                  onClick={handleSignOut}
                >
                  <span className="text-sm font-medium flex-1 text-left">تسجيل الخروج</span>
                  <LogOut className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col border-l border-border/50 bg-gradient-to-b from-background to-muted/20 min-h-screen w-72 fixed right-0 top-0 rtl shadow-sm">
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-20 items-center border-b border-border/50 px-6 justify-start bg-gradient-to-l from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-xl font-bold bg-gradient-to-l from-primary to-primary/80 bg-clip-text text-transparent">
                  لوحة التحكم
                </h1>
                <p className="text-xs text-muted-foreground">إدارة المتجر</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="space-y-2 px-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin_dashboard' && pathname?.startsWith(item.href));
                
                return (
                  <NavItem 
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    showDescription={true}
                    onClick={() => router.push(item.href)}
                  />
                );
              })}
            </nav>
          </div>
          
          {/* Sidebar Footer */}
          <div className="border-t border-border/50 p-4 bg-gradient-to-r from-muted/30 to-transparent">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-3 text-left text-destructive hover:bg-destructive/10 hover:text-destructive min-h-[52px] touch-manipulation rounded-xl transition-all duration-200 group"
              onClick={handleSignOut}
            >
              <div className="flex flex-col items-start flex-1">
                <span className="text-sm font-medium">تسجيل الخروج</span>
                <span className="text-xs text-muted-foreground">إنهاء الجلسة</span>
              </div>
              <LogOut className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-105" />
              <ChevronRight className="h-4 w-4 transition-all duration-200 opacity-0 group-hover:opacity-60 transform -translate-x-2 group-hover:translate-x-0" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
