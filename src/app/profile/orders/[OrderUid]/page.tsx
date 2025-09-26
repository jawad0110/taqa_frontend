'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { errorHandler } from '@/lib/error-handler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';

interface ProductDetail {
  uid: string;
  title: string;
  main_image_url: string;
  variant_groups: {
    uid: string;
    name: string;
    choices: Array<{
      uid: string;
      name: string;
    }>;
  }[];
}

interface OrderItem {
  uid: string;
  product: ProductDetail;
  quantity: number;
  price_at_purchase: number;
  total_price: number;
  variant_choice_id?: string;
  image_url?: string;
  variant_name?: string;
}

interface ShippingAddress {
  uid: string;
  full_name: string;
  phone_number: string;
  country: string;
  city: string;
  area: string;
  street: string;
  building_number?: string;
  apartment_number?: string;
  zip_code?: string;
  notes?: string;
}

interface Order {
  uid: string;
  status: string;
  total_price: number;
  discount: number;
  shipping_price: number;
  final_price: number;
  coupon_code?: string;
  created_at: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const { OrderUid } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const processOrderItem = (item: OrderItem) => {
    try {
      const product = item.product || {};
      const variantGroups = product.variant_groups || [];
      
      let variantName = undefined;
      if (item.variant_choice_id && variantGroups.length > 0) {
        const allChoices = variantGroups.flatMap((vg: any) => vg.choices || []);
        const variantChoice = allChoices.find((vc: any) => vc.uid === item.variant_choice_id);
        variantName = variantChoice?.name;
      }
      
      return {
        ...item,
        product: {
          ...product,
          variant_groups: variantGroups
        },
        image_url: product.main_image_url || '',
        variant_name: variantName
      };
    } catch (error) {
      console.error('Error processing order item:', error);
      return {
        ...item,
        product: item.product || {
          uid: '',
          title: 'المنتج غير موجود',
          main_image_url: '',
          variant_groups: []
        },
        image_url: '',
        variant_name: ''
      };
    }
  };

  const fetchOrder = async () => {
    if (!OrderUid) {
      errorHandler.error("لم يتم توفير معرف الطلب", "خطأ");
      return;
    }

    if (!session?.user?.accessToken) {
      errorHandler.error("لم يتم العثور على رمز الوصول", "خطأ في المصادقة");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/checkouts/${OrderUid}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`خطأ ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      
      if (!data || !Array.isArray(data.items)) {
        throw new Error('تنسيق بيانات الطلب غير صالح');
      }

      // Process all order items
      const itemsWithDetails = data.items.map(processOrderItem);

      setOrder({
        ...data,
        items: itemsWithDetails
      });
    } catch (err: any) {
      console.error('API Error:', err);
      errorHandler.error(err.message || "حدث خطأ أثناء تحميل تفاصيل الطلب", "فشل تحميل تفاصيل الطلب");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">قيد الانتظار</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">قيد المعالجة</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">تم الشحن</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">تم التوصيل</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ملغي</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  const cancelOrder = async () => {
    if (!OrderUid || !session?.user?.accessToken) return;
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/checkouts/${OrderUid}`,
        { 
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.user.accessToken}` } 
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "فشل إلغاء الطلب");
      }
      
      errorHandler.success("تم إلغاء الطلب بنجاح", "تم إلغاء الطلب");
      
      // Refresh order details
      fetchOrder();
    } catch (err: any) {
      errorHandler.error(err.message || "حدث خطأ أثناء محاولة إلغاء الطلب", "خطأ في إلغاء الطلب");
    }
  };

  // Check if order is within 24 hours for cancellation
  const canCancelOrder = (createdAt: string, status: string) => {
    // Don't allow cancellation if order is already canceled or delivered
    if (status === 'canceled' || status === 'delivered') {
      return false;
    }
    
    const orderDate = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours >= 0;
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      errorHandler.error("يجب عليك تسجيل الدخول لعرض تفاصيل الطلب", "الرجاء تسجيل الدخول");
      router.push('/login');
    } else if (status === "authenticated" && session?.user?.accessToken) {
      fetchOrder();
    }
  }, [status, session, OrderUid]);

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
              <h2 className="text-xl font-bold">جاري التحميل...</h2>
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
                className="block p-3 rounded bg-gray-100 font-medium"
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
            <h1 className="text-2xl font-bold mb-6">تفاصيل الطلب</h1>
            <div className="flex justify-center py-8">جاري تحميل تفاصيل الطلب...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
              <h2 className="text-xl font-bold">
                {session?.user?.first_name || ''} {session?.user?.last_name || ''}
              </h2>
              <p className="text-gray-600">{session?.user?.email || ''}</p>
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
                className="block p-3 rounded bg-gray-100 font-medium"
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">تفاصيل الطلب</h1>
              <Button onClick={() => router.push('/profile/orders')}>العودة إلى الطلبات</Button>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">لم يتم العثور على الطلب</p>
              <Button onClick={() => router.push('/profile/orders')}>العودة إلى الطلبات</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Sidebar */}
        <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
            <h2 className="text-xl font-bold">
              {session?.user?.name || 'مستخدم'}
            </h2>
            {session?.user?.email && (
              <p className="text-gray-600">{session.user.email}</p>
            )}
            {session?.user?.role && (
              <p className="text-sm text-gray-500">
                {session.user.role === 'admin' ? 'مدير' : 'مستخدم'}
              </p>
            )}
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
              className="block p-3 rounded bg-gray-100 font-medium"
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">تفاصيل الطلب #{order.uid}</h1>
            <Button onClick={() => router.push('/profile/orders')}>العودة إلى الطلبات</Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>معلومات الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-1">رقم الطلب</p>
                  <p className="text-gray-900">{order.uid}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">تاريخ الطلب</p>
                  <p className="text-gray-900">{format(new Date(order.created_at), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">حالة الطلب</p>
                  <div className="text-gray-900">{getStatusBadge(order.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">كود الخصم</p>
                  <p className="text-gray-900">{order.coupon_code || 'لا يوجد'}</p>
                </div>
              </div>

              {canCancelOrder(order.created_at, order.status) && (
                <div className="mt-6">
                  <Button 
                    variant="destructive" 
                    onClick={cancelOrder}
                  >
                    إلغاء الطلب
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">* يمكن إلغاء الطلب خلال 24 ساعة من وقت الطلب فقط</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>معلومات الشحن</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">الاسم الكامل</p>
                  <p className="text-gray-900">{order.shipping_address.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">رقم الهاتف</p>
                  <p className="text-gray-900">{order.shipping_address.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">البلد</p>
                  <p className="text-gray-900">{order.shipping_address.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">المدينة</p>
                  <p className="text-gray-900">{order.shipping_address.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">المنطقة</p>
                  <p className="text-gray-900">{order.shipping_address.area}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">الشارع</p>
                  <p className="text-gray-900">{order.shipping_address.street}</p>
                </div>
                {order.shipping_address.building_number && (
                  <div>
                    <p className="text-sm font-medium mb-1">رقم المبنى</p>
                    <p className="text-gray-900">{order.shipping_address.building_number}</p>
                  </div>
                )}
                {order.shipping_address.apartment_number && (
                  <div>
                    <p className="text-sm font-medium mb-1">رقم الشقة</p>
                    <p className="text-gray-900">{order.shipping_address.apartment_number}</p>
                  </div>
                )}
                {order.shipping_address.zip_code && (
                  <div>
                    <p className="text-sm font-medium mb-1">الرمز البريدي</p>
                    <p className="text-gray-900">{order.shipping_address.zip_code}</p>
                  </div>
                )}
              </div>
              {order.shipping_address.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">ملاحظات</p>
                  <p className="text-gray-900">{order.shipping_address.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المنتجات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.items.map((item, index) => (
                  <div key={index} className="border-b pb-6 last:border-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col items-center justify-center">
                        {item.product?.main_image_url ? (
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_URL}/static/images/products/${item.product.uid}/${item.product.main_image_url}`}
                            alt={item.product.title}
                            className="w-32 h-32 object-cover rounded-lg"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/placeholder-product.png';
                            }}
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">لا يوجد صورة</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-1">اسم المنتج</p>
                          <div className="text-gray-900">
                            {item.product.title}
                            <span className="text-gray-500 mr-2">× {item.quantity}</span>
                          </div>
                        </div>
                        {item.variant_name && (
                          <div>
                            <p className="text-sm font-medium mb-1">النوع</p>
                            <div className="text-gray-900">{item.variant_name}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-1">سعر الوحدة</p>
                          <div className="text-gray-900">{item.price_at_purchase} دينار</div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">المجموع</p>
                          <div className="text-gray-900">{item.total_price} دينار</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium mb-1">المجموع الكلي</p>
                    <div className="text-gray-900">{order.total_price} دينار</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">رسوم التوصيل</p>
                    <div className="text-gray-900">{order.shipping_price ? `${order.shipping_price} دينار` : 'مجاني'}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">الخصم</p>
                    <div className="text-gray-900">{order.discount} دينار</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">المجموع النهائي</p>
                    <div className="text-gray-900 font-bold text-lg">{order.final_price} دينار</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}