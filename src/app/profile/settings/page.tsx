
"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { errorHandler } from "@/lib/error-handler"
import { useEffect, useState } from "react"
import Link from "next/link"

interface UserProfile {
  username: string
  email: string
  first_name: string
  last_name: string
  is_verified: boolean
  created_at: string
}

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const userEmail = session?.user?.email as string | undefined

  useEffect(() => {
    if (status === "unauthenticated") {
      errorHandler.error("يجب عليك تسجيل الدخول لعرض الإعدادات", "الرجاء تسجيل الدخول")
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.accessToken) {
      fetchProfileData()
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchProfileData()
    }
  }, [session?.user?.accessToken])

  const fetchProfileData = async () => {
    if (!session?.user?.accessToken) return
    try {
      setLoading(true)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
      )
      if (!res.ok) throw new Error("Failed to fetch profile")
      const data = await res.json()
      setProfileData(data)
    } catch (err) {
      errorHandler.error("حدث خطأ أثناء تحميل البيانات الشخصية", "خطأ")
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!userEmail) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: [userEmail] })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "فشل إرسال رابط التفعيل")
      }
      errorHandler.success("تم إرسال رابط التفعيل إلى بريدك الإلكتروني", "تم الإرسال")
    } catch (err: any) {
      errorHandler.error(err.message || "حدث خطأ أثناء إرسال رابط التفعيل", "خطأ")
    }
  }

  const handlePasswordReset = async () => {
    if (!userEmail) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/password-reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "فشل إرسال رسالة إعادة تعيين كلمة المرور")
      }
      errorHandler.success("تم إرسال رسالة إعادة تعيين كلمة المرور", "تم الإرسال")
    } catch (err: any) {
      errorHandler.error(err.message || "حدث خطأ أثناء طلب إعادة تعيين كلمة المرور", "خطأ")
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
              <h2 className="text-xl font-bold">جاري التحميل...</h2>
            </div>
            <nav className="space-y-2">
              <Link href="/profile" className="block p-3 rounded hover:bg-gray-100 font-medium">معلومات الحساب</Link>
              <Link href="/profile/orders" className="block p-3 rounded hover:bg-gray-100 font-medium">الطلبات</Link>
              <Link href="/profile/settings" className="block p-3 rounded bg-gray-100 font-medium">الإعدادات</Link>
            </nav>
          </div>
          <div className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>
            <div className="flex justify-center py-8">جاري تحميل الإعدادات...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
              <h2 className="text-xl font-bold">المستخدم</h2>
              {userEmail && <p className="text-gray-600">{userEmail}</p>}
            </div>
            <nav className="space-y-2">
              <Link href="/profile" className="block p-3 rounded hover:bg-gray-100 font-medium">معلومات الحساب</Link>
              <Link href="/profile/orders" className="block p-3 rounded hover:bg-gray-100 font-medium">الطلبات</Link>
              <Link href="/profile/settings" className="block p-3 rounded bg-gray-100 font-medium">الإعدادات</Link>
            </nav>
          </div>
          <div className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>
            <p className="text-gray-500">لا يمكن تحميل بيانات المستخدم حالياً.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
            <h2 className="text-xl font-bold">{profileData.first_name || ''} {profileData.last_name || ''}</h2>
            <p className="text-gray-600">{profileData.email || ''}</p>
          </div>
          <nav className="space-y-2">
            <Link href="/profile" className="block p-3 rounded hover:bg-gray-100 font-medium">معلومات الحساب</Link>
            <Link href="/profile/orders" className="block p-3 rounded hover:bg-gray-100 font-medium">الطلبات</Link>
            <Link href="/profile/settings" className="block p-3 rounded bg-gray-100 font-medium">الإعدادات</Link>
          </nav>
        </div>

        <div className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>

          <div className="grid grid-cols-1 gap-6">
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">حالة الحساب</h2>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-sm ${profileData.is_verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {profileData.is_verified ? "مفعل" : "غير مفعل"}
                </span>
                {!profileData.is_verified && (
                  <button onClick={handleResendVerification} className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">
                    إعادة إرسال رابط التفعيل
                  </button>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">أمان الحساب</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">تغيير كلمة المرور</p>
                  <p className="text-sm text-gray-500">سنرسل بريد إلكتروني لإعادة تعيين كلمة المرور</p>
                </div>
                <button onClick={handlePasswordReset} className="px-3 py-2 text-sm rounded bg-gray-900 text-white hover:bg-gray-800">
                  إرسال بريد إعادة التعيين
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">معلومات الحساب</h2>
              <p className="text-sm text-gray-500 mb-4">عرض بياناتك الحالية</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">الاسم الأول</p>
                  <p className="mt-1">{profileData.first_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الاسم الأخير</p>
                  <p className="mt-1">{profileData.last_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">اسم المستخدم</p>
                  <p className="mt-1">{profileData.username || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                  <p className="mt-1">{profileData.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}