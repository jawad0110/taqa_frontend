"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { errorHandler } from "@/lib/error-handler";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ProductDetail {
  uid: string;
  title: string;
  main_image_url: string;
  variant_groups: any[];
}

interface OrderItem {
  uid: string;
  product: ProductDetail;
  quantity: number;
  price_at_purchase: number;
  total_price: number;
  variant_choice_id?: string;
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

const OrdersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  // Auth handling
  useEffect(() => {
    if (status === "unauthenticated") {
      errorHandler.error("يجب عليك تسجيل الدخول لعرض طلباتك", "الرجاء تسجيل الدخول");
      router.push('/login');
    } else if (status === "authenticated" && session?.user?.accessToken) {
      fetchOrders();
    }
  }, [status, router, session]);

  // Handle token changes
  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchOrders();
    }
  }, [session?.user?.accessToken]);

  const fetchOrders = async () => {
    if (!session?.user?.accessToken) {
      errorHandler.error("لم يتم العثور على رمز الوصول", "خطأ في المصادقة");
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/checkouts`,
        { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      errorHandler.error("حدث خطأ أثناء تحميل الطلبات", "خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderUid: string) => {
    if (!session?.user?.accessToken) return;
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/checkouts/${orderUid}`,
        { 
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.user.accessToken}` } 
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to cancel order");
      }
      
      errorHandler.success("تم إلغاء الطلب بنجاح", "تم إلغاء الطلب");
      
      // Refresh orders list
      fetchOrders();
    } catch (err: any) {
      errorHandler.error(err.message || "حدث خطأ أثناء محاولة إلغاء الطلب", "خطأ في إلغاء الطلب");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/10">قيد الانتظار</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">قيد المعالجة</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">تم الشحن</Badge>;
      case 'delivered':
        return <Badge className="bg-success/10 text-success hover:bg-success/10">تم التوصيل</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ملغي</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
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
            <h1 className="text-2xl font-bold mb-6">الطلبات</h1>
            <div className="flex justify-center py-8">جاري تحميل الطلبات...</div>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold mb-6">الطلبات</h1>
          
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">لا توجد طلبات حتى الآن</p>
              <Button onClick={() => router.push('/products')}>تصفح المنتجات</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table dir="rtl" className="border-collapse">
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="p-4 text-right font-bold">رقم الطلب</TableHead>
                    <TableHead className="p-4 text-right font-bold">التاريخ</TableHead>
                    <TableHead className="p-4 text-right font-bold">الحالة</TableHead>
                    <TableHead className="p-4 text-right font-bold">المجموع</TableHead>
                    <TableHead className="p-4 text-center font-bold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.uid} className="border-b border-gray-100 hover:bg-gray-50">
                      <TableCell className="p-4 text-right">{order.uid}</TableCell>
                      <TableCell className="p-4 text-right">
                        {format(new Date(order.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="p-4 text-right">{order.final_price} دينار</TableCell>
                      <TableCell className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/profile/orders/${order.uid}`)}
                          >
                            عرض التفاصيل
                          </Button>
                          
                          {order.status !== 'canceled' && order.status !== 'delivered' && canCancelOrder(order.created_at, order.status) && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleCancelOrder(order.uid)}
                            >
                              إلغاء الطلب
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;