'use client';
import React, { ReactNode } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { AdminLoadingSpinner } from './AdminLoadingSpinner';
import { AdminErrorDisplay } from './AdminErrorDisplay';

interface AdminPageWrapperProps {
  children: ReactNode;
  title?: string;
  loadingMessage?: string;
  requireAdmin?: boolean;
  redirectTo?: string;
  className?: string;
}

export function AdminPageWrapper({
  children,
  title,
  loadingMessage = 'جاري التحميل...',
  requireAdmin = true,
  redirectTo = '/login',
  className = ''
}: AdminPageWrapperProps) {
  const { isLoading, isAuthenticated, isAdmin } = useAdminAuth({
    requireAdmin,
    redirectTo
  });

  if (isLoading) {
    return <AdminLoadingSpinner message={loadingMessage} className={className} />;
  }

  if (!isAuthenticated) {
    return (
      <AdminErrorDisplay 
        title="خطأ في المصادقة"
        message="يجب تسجيل الدخول لعرض هذه الصفحة"
        className={className}
      />
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <AdminErrorDisplay 
        title="غير مصرح"
        message="ليس لديك الأذونات اللازمة للوصول إلى هذه الصفحة"
        className={className}
      />
    );
  }

  return (
    <div className={`w-full min-h-screen bg-gray-50 ${className}`} dir="rtl">
      <div className="container mx-auto px-4 py-6">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}