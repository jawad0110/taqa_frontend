'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { errorHandler } from '@/lib/error-handler';
import { Button } from '@/components/ui/button';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      errorHandler.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      errorHandler.error("البريد الإلكتروني غير صالح");
      return;
    }
  
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
  
      if (result?.error) {
        // تحليل رسالة الخطأ
        let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
        let errorCode = 'unknown_error';
        let canResendVerification = false;
        
        try {
          const errorData = JSON.parse(result.error);
          errorMessage = errorData.message || errorMessage;
          errorCode = errorData.error_code || errorCode;
          canResendVerification = errorData.can_resend || false;
        } catch (e) {
          // إذا لم تكن الرسالة بتنسيق JSON، استخدم النص كما هو
          console.error('Error parsing error message:', e);
        }
        
        // عرض رسالة الخطأ المناسبة
        let title = 'فشل تسجيل الدخول';
        
        if (errorCode === 'user_does_not_exists') {
          title = 'الحساب غير موجود';
        } else if (errorCode === 'invalid_credentials') {
          title = 'كلمة المرور خاطئة';
        } else if (errorCode === 'account_not_verified') {
          title = 'الحساب غير مفعل';
        } else if (errorCode === 'service_unavailable') {
          title = 'الخدمة غير متوفرة';
        }
        
        // Show error with action buttons for specific cases
        if (canResendVerification || errorCode === 'user_does_not_exists') {
          errorHandler.error(errorMessage, title, {
            action: (
              <div className="flex flex-col gap-2 mt-2">
                {canResendVerification && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleResendVerification()}
                    size="sm"
                  >
                    إعادة إرسال رابط التفعيل
                  </Button>
                )}
                {errorCode === 'user_does_not_exists' && (
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/signup')}
                    size="sm"
                  >
                    إنشاء حساب جديد
                  </Button>
                )}
              </div>
            )
          });
        } else {
          errorHandler.error(errorMessage, title);
        }
      } else {
        errorHandler.success('مرحبًا بك في طاقة', 'تم تسجيل الدخول بنجاح');
        router.push('/');
      }
    } catch (error) {
      errorHandler.error('حدث خطأ أثناء تسجيل الدخول', 'خطأ');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        addresses: [email]
      });
      
      errorHandler.success('يرجى التحقق من بريدك الإلكتروني للحصول على رابط التفعيل', 'تم إرسال رابط التفعيل');
    } catch (error: any) {
      errorHandler.error(error.response?.data?.detail?.message || 'فشل إرسال رابط التفعيل', 'خطأ');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground font-sans">
            تسجيل الدخول إلى حسابك
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80 font-sans">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <div className="text-sm">
              <Link href="/signup" className="font-medium text-primary hover:text-primary/80 font-sans">
                ليس لديك حساب؟ سجل الآن
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-sans disabled:bg-primary/60"
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
