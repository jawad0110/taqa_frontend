'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { errorHandler } from '@/lib/error-handler';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // التحقق من تطابق كلمات المرور
    if (formData.password !== formData.confirmPassword) {
      errorHandler.error("كلمات المرور غير متطابقة", "خطأ في كلمة المرور");
      setError('كلمات المرور غير متطابقة');
      setLoading(false);
      return;
    }

    // التحقق من طول اسم المستخدم
    if (formData.username.length > 8) {
      errorHandler.error("يجب أن لا يتجاوز اسم المستخدم 8 أحرف", "خطأ في التحقق");
      setError('يجب أن لا يتجاوز اسم المستخدم 8 أحرف');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      errorHandler.success("يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب", "تم إنشاء الحساب بنجاح");
      setSuccess('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.error || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.';
      errorHandler.error(errorMessage, "خطأ في إنشاء الحساب");
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-sans">
            إنشاء حساب جديد
          </h2>
        </div>
        
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700 font-sans">{success}</div>
          </div>
        )}
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700 font-sans">{error}</div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <input
                  type="text"
                  name="first_name"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                  placeholder="الاسم الأول"
                  value={formData.first_name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <input
                  type="text"
                  name="last_name"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                  placeholder="الاسم الأخير"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="mb-3">
              <input
                type="text"
                name="username"
                required
                maxLength={8}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                placeholder="اسم المستخدم (بحد أقصى 8 أحرف)"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-3">
              <input
                type="email"
                name="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                placeholder="البريد الإلكتروني"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-3">
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                placeholder="كلمة المرور (6 أحرف على الأقل)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <input
                type="password"
                name="confirmPassword"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm font-sans"
                placeholder="تأكيد كلمة المرور"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="text-sm text-right">
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 font-sans">
              لديك حساب بالفعل؟ تسجيل الدخول
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-sans disabled:bg-primary/60"
            >
              {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}