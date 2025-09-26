"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Menu, X, User, ShoppingCart, Heart, Search } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { totalItems: cartCount } = useCart();
  const { wishlistItems } = useWishlist();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navigationItems = [
    { href: '/', label: 'الرئيسية' },
    { href: '/products', label: 'المنتجات' },
    { href: '/wishlist', label: 'المفضلة' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Main Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-100' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Image
                  src="/assets/images/logo.png"
                  alt="Taqa Business Logo"
                  width={60}
                  height={60}
                  className="h-15 w-15 transition-all duration-300 group-hover:scale-110"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
                    isActive(item.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <div className="absolute inset-0 bg-primary/5 rounded-full -z-10"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Wishlist */}
              <Link 
                href="/wishlist" 
                className="relative p-2 text-gray-600 hover:text-primary transition-colors duration-200"
              >
                <Heart className="h-5 w-5" />
                {wishlistItems.size > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium leading-none pt-1">
                    {wishlistItems.size}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link 
                href="/cart" 
                className="relative p-2 text-gray-600 hover:text-primary transition-colors duration-200"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium leading-none pt-1">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Profile */}
              {status === 'authenticated' ? (
                <Link 
                  href="/profile" 
                  className="p-2 text-gray-600 hover:text-primary transition-colors duration-200"
                >
                  <User className="h-5 w-5" />
                </Link>
              ) : (
                <Link 
                  href="/login"
                  className="px-6 py-2 text-sm font-medium text-primary border border-primary rounded-full hover:bg-primary hover:text-white transition-all duration-300"
                >
                  تسجيل الدخول
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-primary transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Image
                src="/assets/images/logo.png"
                alt="Taqa Business Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-bold text-xl text-gray-900">Taqa</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              {status === 'authenticated' ? (
                <Link
                  href="/profile"
                  className="block w-full px-4 py-3 text-center text-base font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  الملف الشخصي
                </Link>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block w-full px-4 py-3 text-center text-base font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full px-4 py-3 text-center text-base font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-20"></div>
    </>
  );
}