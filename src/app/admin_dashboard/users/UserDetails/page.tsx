'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { errorHandler } from '@/lib/error-handler';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner';
import { AdminErrorDisplay } from '@/components/admin/AdminErrorDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  Mail, 
  Calendar, 
  User, 
  UserCheck, 
  UserX, 
  ShoppingCart, 
  Heart, 
  Star, 
  Package,
  Phone,
  MapPin,
  Building,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserProfile {
  phone_number?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  created_at: string;
  updated_at: string;
}

interface UserDetails {
  uid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
  total_orders: number;
  total_reviews: number;
  total_cart_items: number;
  total_wishlist_items: number;
}

export default function UserDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isAuthenticated, accessToken, isAdmin } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const userUid = searchParams.get('uid');

  useEffect(() => {
    if (isAuthenticated && accessToken && isAdmin && userUid) {
      fetchUserDetails();
    }
  }, [isAuthenticated, accessToken, isAdmin, userUid]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    
    if (!accessToken || !userUid) {
      setError('No authentication token or user ID found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userUid}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: UserDetails = await response.json();
      setUser(data);
    } catch (err: any) {
      console.error('Fetch User Details Error:', err);
      const errorMessage = err.message || "حدث خطأ أثناء جلب بيانات المستخدم";
      setError(errorMessage);
      errorHandler.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async () => {
    if (!accessToken || !user) {
      errorHandler.error("لم يتم العثور على رمز الوصول أو بيانات المستخدم");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user.uid}/verification`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ is_verified: !user.is_verified })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      errorHandler.success(`تم ${!user.is_verified ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم بنجاح`);
      
      // Update local state
      setUser(prev => prev ? { ...prev, is_verified: !prev.is_verified } : null);
    } catch (err: any) {
      console.error('Toggle Verification Error:', err);
      errorHandler.error(err.message || "حدث خطأ أثناء تحديث حالة المستخدم");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ar });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير';
      case 'user': return 'مستخدم';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'user': return 'default';
      default: return 'secondary';
    }
  };

  if (!userUid) {
    return (
      <AdminPageWrapper>
        <AdminErrorDisplay 
          message="معرف المستخدم غير موجود" 
          onRetry={() => router.push('/admin_dashboard/users')}
        />
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper>
      {loading && (
        <AdminLoadingSpinner message="جاري تحميل بيانات المستخدم..." />
      )}
      {error && (
        <AdminErrorDisplay 
          message={error} 
          onRetry={fetchUserDetails}
        />
      )}
      {!loading && !error && user && (
        <div className="container mx-auto px-4 py-8" dir="rtl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin_dashboard/users')}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                العودة للمستخدمين
              </Button>
              <div>
                <h1 className="text-2xl font-bold mb-1">تفاصيل المستخدم</h1>
                <p className="text-sm text-muted-foreground">
                  عرض وإدارة معلومات المستخدم بالتفصيل
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleDisplayName(user.role)}
              </Badge>
              <Button
                variant={user.is_verified ? "destructive" : "default"}
                size="sm"
                onClick={handleToggleVerification}
                disabled={updating}
                className="flex items-center gap-2"
              >
                {user.is_verified ? (
                  <>
                    <UserX className="h-4 w-4" />
                    إلغاء التفعيل
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    تفعيل
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main User Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    المعلومات الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">الاسم الأول</label>
                      <p className="text-sm font-medium">{user.first_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">الاسم الأخير</label>
                      <p className="text-sm font-medium">{user.last_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">اسم المستخدم</label>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        {user.username}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">تاريخ التسجيل</label>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">آخر تحديث</label>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(user.updated_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information */}
              {user.profile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      معلومات الملف الشخصي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.profile.phone_number && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {user.profile.phone_number}
                          </p>
                        </div>
                      )}
                      {user.profile.address && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">العنوان</label>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {user.profile.address}
                          </p>
                        </div>
                      )}
                      {user.profile.city && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">المدينة</label>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {user.profile.city}
                          </p>
                        </div>
                      )}
                      {user.profile.country && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">البلد</label>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {user.profile.country}
                          </p>
                        </div>
                      )}
                      {user.profile.postal_code && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">الرمز البريدي</label>
                          <p className="text-sm font-medium">{user.profile.postal_code}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Statistics Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {user.is_verified ? (
                      <UserCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <UserX className="h-5 w-5 text-red-600" />
                    )}
                    حالة الحساب
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <Badge 
                      variant={user.is_verified ? "default" : "destructive"}
                      className="text-lg px-4 py-2"
                    >
                      {user.is_verified ? 'مفعل' : 'غير مفعل'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات النشاط</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">الطلبات</span>
                    </div>
                    <Badge variant="outline">{user.total_orders}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">التقييمات</span>
                    </div>
                    <Badge variant="outline">{user.total_reviews}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                      <span className="text-sm">سلة التسوق</span>
                    </div>
                    <Badge variant="outline">{user.total_cart_items}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-sm">قائمة الأمنيات</span>
                    </div>
                    <Badge variant="outline">{user.total_wishlist_items}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الحساب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">معرف المستخدم</label>
                    <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {user.uid}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">الدور</label>
                    <p className="text-sm">{getRoleDisplayName(user.role)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  );
}
