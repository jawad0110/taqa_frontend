"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { errorHandler } from "@/lib/error-handler";
import { useEffect, useState } from "react";
import Link from "next/link";

interface UserProfile {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  created_at: string;
}

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  // Auth handling
  useEffect(() => {
    if (status === "unauthenticated") {
      errorHandler.error("يجب عليك تسجيل الدخول لعرض الصفحة الشخصية", "الرجاء تسجيل الدخول");
      router.push('/login');
    } else if (status === "authenticated" && session?.user?.accessToken) {
      fetchProfileData();
    }
  }, [status, router, session]);

  // Handle token changes
  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchProfileData();
    }
  }, [session?.user?.accessToken]);

  const fetchProfileData = async () => {
    if (!session?.user?.accessToken) {
      errorHandler.error("لم يتم العثور على رمز الوصول", "خطأ في المصادقة");
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfileData(data);
    } catch (err) {
      errorHandler.error("حدث خطأ أثناء تحميل البيانات الشخصية", "خطأ");
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return <div className="flex justify-center py-8">جاري التحميل...</div>;
  }

  if (!profileData) {
    return <div className="text-center py-8">الرجاء تسجيل الدخول</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Sidebar */}
        <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
            <h2 className="text-xl font-bold">
              {profileData.first_name || ''} {profileData.last_name || ''}
            </h2>
            <p className="text-gray-600">@{profileData.username || ''}</p>
            <p className="text-gray-600">{profileData.email || ''}</p>
          </div>
          
          <nav className="space-y-2">
            <Link 
              href="/profile" 
              className="block p-3 rounded hover:bg-gray-100 font-medium"
            >
              معلومات الحساب
            </Link>
            <Link 
              href="/profile/orders" 
              className="block p-3 rounded hover:bg-gray-100 font-medium"
            >
              الطلبات
            </Link>
            <Link 
              href="/profile/settings" 
              className="block p-3 rounded hover:bg-gray-100 font-medium"
            >
              الإعدادات
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">معلومات الحساب</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-500">الاسم الأول</h3>
              <p className="mt-1">{profileData.first_name || ''}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-500">الاسم الأخير</h3>
              <p className="mt-1">{profileData.last_name || ''}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-500">اسم المستخدم</h3>
              <p className="mt-1">@{profileData.username || ''}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-500">البريد الإلكتروني</h3>
              <p className="mt-1">{profileData.email || ''}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-500">حالة الحساب</h3>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-sm ${profileData.is_verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {profileData.is_verified ? "مفعل" : "غير مفعل"}
                </span>
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-500">تاريخ الإنشاء</h3>
              <p className="mt-1">{new Date(profileData.created_at).toLocaleDateString('ar-SA')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;