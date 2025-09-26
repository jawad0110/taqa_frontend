'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner';
import { AdminErrorDisplay } from '@/components/admin/AdminErrorDisplay';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface User {
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
}

interface Order {
  uid: string;
  user: User;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  total_price: number;
  final_price: number;
  coupon_code: string | null;
  created_at: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  email: string;
}

const BRAND_PRIMARY = '#070B39';
const BRAND_SUCCESS = '#63D829';
const BRAND_WARNING = '#FFC721';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  const router = useRouter();
  const { session, isAuthenticated, accessToken } = useAdminAuth();

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      if (!isAuthenticated || !accessToken) {
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/admin/orders?page=${page}&per_page=${itemsPerPage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تحميل الطلبات');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setTotalPages(data.total_pages || 1);
    } catch (e: any) {
      console.error('API Error:', e);
      const errorMessage = e.message === 'Failed to fetch' 
        ? 'لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل الخادم الخلفي'
        : `فشل تحميل الطلبات: ${e.message}`;
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchOrders();
    }
  }, [isAuthenticated, accessToken]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.uid?.toLowerCase?.().includes(searchQuery.toLowerCase()) ?? false) ||
      ((order.first_name + ' ' + order.last_name)?.toLowerCase()?.includes(searchQuery.toLowerCase()) ?? false) ||
      (order.status?.toLowerCase?.().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminPageWrapper title="الطلبات" className="p-6">
      {loading ? (
        <AdminLoadingSpinner message="جاري تحميل الطلبات..." />
      ) : error ? (
        <AdminErrorDisplay 
          message={error} 
          onRetry={() => fetchOrders(page)} 
        />
      ) : (
        <>
          <div className="space-y-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الطلبات</h1>
              <p className="text-gray-600">عرض وإدارة جميع طلبات العملاء</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">فلترة:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter} dir="rtl">
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="فلترة حسب الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="processing">قيد المعالجة</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative flex-1">
                    <Input
                      placeholder="البحث في الطلبات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 sm:w-64"
                      dir="rtl"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <TableHead className="text-right min-w-[120px] font-semibold text-gray-700">رقم الطلب</TableHead>
                    <TableHead className="text-right min-w-[150px] font-semibold text-gray-700">العميل</TableHead>
                    <TableHead className="text-right min-w-[100px] font-semibold text-gray-700">الحالة</TableHead>
                    <TableHead className="text-right min-w-[100px] hidden sm:table-cell font-semibold text-gray-700">المبلغ الإجمالي</TableHead>
                    <TableHead className="text-right min-w-[100px] font-semibold text-gray-700">المبلغ النهائي</TableHead>
                    <TableHead className="text-right min-w-[120px] hidden md:table-cell font-semibold text-gray-700">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right min-w-[120px] font-semibold text-gray-700">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        لا توجد طلبات
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.uid} className="hover:bg-gray-50 transition-colors duration-200">
                        <TableCell className="font-semibold text-gray-900">{order.uid}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold text-gray-900">{order.first_name} {order.last_name}</div>
                            <div className="text-sm text-gray-500">{order.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                            order.status === 'shipped' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {order.status === 'pending' ? 'قيد الانتظار' :
                             order.status === 'processing' ? 'قيد المعالجة' :
                             order.status === 'shipped' ? 'تم الشحن' :
                             order.status === 'delivered' ? 'تم التسليم' :
                             order.status === 'cancelled' ? 'ملغي' : order.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-semibold" style={{ color: BRAND_PRIMARY }}>{order.total_price} JOD</TableCell>
                        <TableCell className="font-semibold" style={{ color: BRAND_PRIMARY }}>{order.final_price} JOD</TableCell>
                        <TableCell className="hidden md:table-cell text-gray-600">{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin_dashboard/orders/${order.uid}`)}
                              className="text-xs border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                            >
                              عرض التفاصيل
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-sm border p-6 mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  صفحة <span className="font-semibold text-gray-900">{page}</span> من <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
                <nav className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (pageNumber > totalPages) return null;
                    return (
                      <Button
                        key={pageNumber}
                        variant={page === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNumber)}
                        className={page === pageNumber ? "bg-[#070B39] text-white shadow-md" : "border-gray-200 text-gray-700 hover:bg-gray-50"}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </Button>
                </nav>
              </div>
            </div>
          )}
        </>
      )}
    </AdminPageWrapper>
  );
}