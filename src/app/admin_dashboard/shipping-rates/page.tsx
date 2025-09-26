'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { errorHandler } from '@/lib/error-handler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddShippingRateDialog } from '@/components/add-shipping-rate-dialog';
import { Plus, Pencil } from 'lucide-react';
import { EditShippingRateDialog } from '@/components/edit-shipping-rate-dialog';

// Using the types from next-auth.d.ts

// Define interface for Shipping Rate data
interface ShippingRate {
  uid: string;
  country: string;
  city?: string;
  area?: string;
  rate: number;
  price: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

const BRAND_PRIMARY = '#070B39';

export default function AdminShippingRatesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();


  const [loading, setLoading] = useState(true);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Authentication check and data fetching
  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      errorHandler.error("الرجاء تسجيل الدخول للوصول إلى لوحة الإدارة", "غير مصرح");
      router.push('/login');
      return;
    }

    // Check for admin role
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      errorHandler.error("ليس لديك الأذونات اللازمة للوصول إلى هذه الصفحة", "غير مصرح");
      router.push('/');
      return;
    }

    // Only fetch if authenticated and has admin role
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchShippingRates();
    }

    // Cleanup function
    return () => {
      // Any cleanup code if needed
    };
  }, [status, session, router]);

  const fetchShippingRates = async () => {
    setLoading(true);
    setError(null);
    // Don't proceed if there's no session or token
    if (!session?.user?.accessToken) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/shipping-rates`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.accessToken}`,
          },
          cache: 'no-store' // Prevent caching
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: ShippingRate[] = await response.json();
      setShippingRates(data);
    } catch (err: any) {
      console.error('Fetch Shipping Rates Error:', err);
      const errorMessage = err.message || "حدث خطأ أثناء جلب أسعار الشحن";
      setError(errorMessage);
      errorHandler.error(errorMessage, "خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRate = async (uid: string) => {
    if (!confirm("هل أنت متأكد أنك تريد حذف سعر الشحن هذا؟")) {
      return;
    }

    if (!session?.user?.accessToken) {
      errorHandler.error("لم يتم العثور على رمز الوصول", "خطأ");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/shipping-rates/${uid}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      errorHandler.success("تم حذف سعر الشحن بنجاح", "تم الحذف بنجاح");

      // Refresh the list after deletion
      fetchShippingRates();
    } catch (err: any) {
      console.error('Delete Shipping Rate Error:', err);
      errorHandler.error(err.message || "حدث خطأ أثناء حذف سعر الشحن", "خطأ في الحذف");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <h1 className="text-2xl font-bold mb-6">أسعار الشحن (لوحة الإدارة)</h1>
        <div className="flex items-center justify-center py-12 space-x-2">
          <div className="w-6 h-6 border-2 border-[#070B39] border-t-transparent rounded-full animate-spin"></div>
          <p>جاري تحميل بيانات الشحن...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <h1 className="text-2xl font-bold mb-6">أسعار الشحن (لوحة الإدارة)</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">خطأ: </strong>
          <span className="block sm:inline">{error}</span>
          <div className="mt-4">
            <Button 
              onClick={fetchShippingRates} 
              variant="outline" 
              className="bg-white text-red-700 hover:bg-red-50 border-red-200"
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddSuccess = () => {
    fetchShippingRates();
  };

  const handleEditSuccess = () => {
    fetchShippingRates();
    setEditingRate(null);
  };

  const handleEditClick = (rate: ShippingRate) => {
    setEditingRate(rate);
    setIsEditDialogOpen(true);
  };

  // Format price in JOD
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price) + ' JOD';
  };

  // Get the price value from rate object (fallback to 0 if not available)
  const getPriceValue = (rate: ShippingRate) => {
    return rate.price || rate.rate || 0;
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">أسعار الشحن</h1>
          <p className="text-gray-600">إدارة أسعار الشحن حسب البلد والمدينة</p>
        </div>
        <div className="w-full sm:w-auto">
          <AddShippingRateDialog onSuccess={handleAddSuccess}>
            <Button className="w-full sm:w-auto bg-[#070B39] hover:opacity-90 text-white shadow-sm transition-all duration-200">
              <Plus className="ml-2 h-4 w-4" />
              إضافة سعر شحن جديد
            </Button>
          </AddShippingRateDialog>
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">قائمة أسعار الشحن</CardTitle>
              <p className="text-sm text-gray-600 mt-1">إدارة جميع أسعار الشحن المتاحة</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm bg-white px-4 py-2 rounded-full border border-gray-200 text-gray-700 shadow-sm">
                العدد: <span className="font-semibold text-gray-900">{shippingRates.length}</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {shippingRates.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">لا توجد أسعار شحن مضافة حالياً</p>
              <Button variant="ghost" className="mt-4" onClick={() => document.getElementById('add-shipping-rate')?.click()}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة سعر شحن جديد
              </Button>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <TableRow className="grid grid-cols-12 gap-0 border-b border-gray-200">
                    <TableHead className="col-span-4 px-4 py-4 text-right text-sm font-semibold text-gray-700">
                      البلد
                    </TableHead>
                    <TableHead className="col-span-4 px-4 py-4 text-right text-sm font-semibold text-gray-700">
                      المدينة
                    </TableHead>
                    <TableHead className="col-span-2 px-4 py-4 text-right text-sm font-semibold text-gray-700">
                      السعر (JOD)
                    </TableHead>
                    <TableHead className="col-span-2 px-4 py-4 text-right text-sm font-semibold text-gray-700">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shippingRates.map((rate) => (
                    <TableRow key={rate.uid} className="grid grid-cols-12 gap-0 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0">
                      <TableCell className="col-span-4 px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900 text-right">
                          {rate.country || 'غير محدد'}
                        </div>
                      </TableCell>
                      <TableCell className="col-span-4 px-4 py-4">
                        <div className="text-sm text-gray-600 text-right">
                          {rate.city || 'الكل'}
                        </div>
                      </TableCell>
                      <TableCell className="col-span-2 px-4 py-4">
                        <div className="text-sm font-semibold" style={{ color: BRAND_PRIMARY }}>
                          {formatPrice(getPriceValue(rate))}
                        </div>
                      </TableCell>
                      <TableCell className="col-span-2 px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 text-xs border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                            onClick={() => handleEditClick(rate)}
                          >
                            <Pencil className="h-3.5 w-3.5 ml-1" />
                            <span>تعديل</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 px-3 text-xs bg-red-100 text-red-700 border-red-200 hover:bg-red-200 transition-all duration-200"
                            onClick={() => handleDeleteRate(rate.uid)}
                          >
                            <span>حذف</span>
                          </Button>
                        </div>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Shipping Rate Dialog */}
      {editingRate && (
        <EditShippingRateDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          rate={editingRate}
          onSuccess={handleEditSuccess}
          token={session?.user?.accessToken || ''}
        />
      )}
    </div>
  );
}