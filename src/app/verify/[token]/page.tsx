'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify/${token}`);
        setStatus('success');
        setMessage('تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.detail || 'حدث خطأ أثناء تفعيل الحساب. قد يكون الرابط غير صالح أو منتهي الصلاحية.');
        console.error('Verification error:', error);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground font-sans">
            تفعيل الحساب
          </h2>
        </div>

        {status === 'loading' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-lg font-sans">جاري التحقق من البريد الإلكتروني...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="rounded-md bg-green-50 p-6">
            <div className="text-lg text-green-700 font-sans mb-4">{message}</div>
            <Link href="/login">
              <button className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-sans">
                الانتقال إلى صفحة تسجيل الدخول
              </button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-md bg-red-50 p-6">
            <div className="text-lg text-red-700 font-sans mb-4">{message}</div>
            <Link href="/signup">
              <button className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-sans">
                العودة إلى صفحة التسجيل
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}