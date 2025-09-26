'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { errorHandler } from '@/lib/error-handler';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // التحقق من تطابق كلمات المرور
    if (formData.newPassword !== formData.confirmNewPassword) {
      errorHandler.error('كلمات المرور غير متطابقة', 'خطأ');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/password-reset-confirm/${token}`, {
        new_password: formData.newPassword,
        confirm_new_password: formData.confirmNewPassword
      });
      
      errorHandler.success('تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.', 'تم بنجاح');
      
      // التوجيه إلى صفحة تسجيل الدخول بعد 3 ثوانٍ
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      errorHandler.error(error.response?.data?.detail || 'حدث خطأ أثناء إعادة تعيين كلمة المرور. قد يكون الرابط غير صالح أو منتهي الصلاحية.', 'خطأ');
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-sans">
            إعادة تعيين كلمة المرور
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-sans">
            أدخل كلمة المرور الجديدة لحسابك
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-3">
              <input
                type="password"
                name="newPassword"
                required
                minLength={6}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <input
                type="password"
                name="confirmNewPassword"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                placeholder="تأكيد كلمة المرور الجديدة"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/login" className="font-medium text-primary hover:text-primary/80 font-sans">
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-sans disabled:bg-primary/60"
            >
              {isLoading ? 'جاري المعالجة...' : 'إعادة تعيين كلمة المرور'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}