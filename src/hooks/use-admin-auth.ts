import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { errorHandler } from '@/lib/error-handler';

interface UseAdminAuthOptions {
  redirectTo?: string;
  requireAdmin?: boolean;
}

export function useAdminAuth(options: UseAdminAuthOptions = {}) {
  const { redirectTo = '/login', requireAdmin = true } = options;
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      errorHandler.error('يجب تسجيل الدخول للوصول إلى لوحة الإدارة');
      router.push(redirectTo);
      return;
    }

    if (requireAdmin && session?.user?.role !== 'admin') {
      errorHandler.error('ليس لديك الأذونات اللازمة للوصول إلى هذه الصفحة');
      router.push('/');
      return;
    }
  }, [status, session, router, redirectTo, requireAdmin]);

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isAdmin: session?.user?.role === 'admin',
    accessToken: session?.user?.accessToken,
  };
}