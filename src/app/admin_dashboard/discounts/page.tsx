"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { errorHandler } from '@/lib/error-handler';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PaginatedResponse {
  items: Discount[];
  page: number;
  total_pages: number;
  total: number;
}

export interface Discount {
  uid: string;
  code: string;
  discount_type: string;
  value: number;
  minimum_order_amount: number;
  expires_at: string;
  usage_limit: number;
  is_active: boolean;
  used_count: number;
  created_at: string;
}

const BRAND_PRIMARY = '#070B39';

export default function DiscountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDiscounts, setTotalDiscounts] = useState(0);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemsPerPage] = useState(10);

  const fetchDiscounts = async (page = 1, q = "") => {
    setLoading(true);
    setError(null);
    
    try {
      if (status !== "authenticated" || !session?.user?.accessToken) {
        setError('يجب تسجيل الدخول أولاً');
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: q || '',
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/discounts?${params}`;
  
      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });
      
      if (!res.ok) {
        let errorData: any = null;
        try { errorData = await res.json(); } catch {}
        throw new Error(errorData?.message || errorData?.detail || `HTTP ${res.status}`);
      }
      
      const responseData = await res.json();

      let items: any[] = [];
      let total = 0;
      let newTotalPages = 1;
      
      if (Array.isArray(responseData)) {
        items = responseData as any[];
        total = responseData.length;
      } else if (responseData && Array.isArray(responseData.items)) {
        items = responseData.items;
        total = responseData.total || responseData.items.length;
        newTotalPages = responseData.total_pages || 1;
      } else {
        throw new Error('تنسيق الاستجابة غير متوقع من الخادم');
      }
      
      const formattedDiscounts = items.map((item: any) => ({
        uid: item.uid || item.id || Math.random().toString(36).substr(2, 9),
        code: item.code || '',
        discount_type: item.discount_type || 'percentage',
        value: Number(item.value) || 0,
        minimum_order_amount: Number(item.minimum_order_amount || item.min_purchase_amount || 0),
        expires_at: item.expires_at || item.end_date || null,
        is_active: Boolean(item.is_active),
        used_count: Number(item.times_used || item.used_count || 0),
        usage_limit: Number(item.usage_limit || 0),
        created_at: item.created_at || new Date().toISOString(),
      })) as Discount[];
      
      setDiscounts(formattedDiscounts);
      setTotalPages(newTotalPages);
      setCurrentPage(page);
      setTotalDiscounts(total);
      
    } catch (e: any) {
      const errorMessage = e.message || 'حدث خطأ أثناء تحميل كوبونات الخصم';
      setError(errorMessage);
      errorHandler.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteDiscount = async (uid: string) => {
    if (isDeleting) return;
    if (!confirm("هل أنت متأكد من رغبتك في حذف كوبون الخصم هذا؟")) return;
    setIsDeleting(true);
    try {
      if (!session?.user?.accessToken) {
        throw new Error('لم يتم العثور على رمز المصادقة');
      }
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/discounts/${uid}`,
        {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.accessToken}`,
          },
        }
      );
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMessage = (data as any)?.message || "فشل حذف كوبون الخصم";
        throw new Error(errorMessage);
      }
      
      errorHandler.success((data as any).message || "تم حذف كوبون الخصم بنجاح");
      fetchDiscounts(1, search);
    } catch (error: any) {
      errorHandler.error(error.message || "فشل حذف كوبون الخصم. يرجى المحاولة مرة أخرى لاحقًا.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchDiscounts();
    } else if (status === "unauthenticated") {
      setError('يجب تسجيل الدخول لعرض كوبونات الخصم');
      setLoading(false);
    }
  }, [status]);

  const formatValue = (d: Discount) => d.discount_type === 'percentage' ? `${d.value}%` : `${d.value} د.أ`;
  const formatMin = (v: number) => v ? `${v} د.أ` : '—';
  const formatDate = (v?: string) => v ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="w-full max-w-full px-0 sm:px-4 mx-0" dir="rtl">
      {status === "loading" ? (
        <p>جاري التحميل...</p>
      ) : status === "unauthenticated" ? (
        <div className="p-4 bg-yellow-100 mb-4 text-right">
          يجب تسجيل الدخول لعرض هذه الصفحة.
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة كوبونات الخصم</h1>
                <p className="text-gray-600">إدارة وعرض جميع كوبونات الخصم المتاحة</p>
              </div>
              <Link
                href="/admin_dashboard/discounts/create"
                className="px-6 py-3 rounded-xl transition-all duration-200 shadow-sm text-white"
                style={{ backgroundColor: BRAND_PRIMARY }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">+</span>
                  إضافة كوبون خصم جديد
                </span>
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchDiscounts(1, search);
                }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث عن كوبونات الخصم..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#070B39] focus:border-transparent"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button className="px-6 py-2 rounded-lg transition-all duration-200 shadow-sm text-white"
                  style={{ backgroundColor: BRAND_PRIMARY }}
                >
                  بحث
                </button>
              </form>
            </div>
          </div>

          {error && <div className="p-4 bg-red-100 mb-4 rounded">{error}</div>}

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">جاري تحميل كوبونات الخصم...</p>
            </div>
          ) : !discounts || discounts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">{error || 'لا توجد كوبونات خصم.'}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[980px] bg-white shadow-sm rounded-xl border border-gray-100">
                <Table className="table-auto w-full">
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-right font-semibold text-gray-700">الكود</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">النوع</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">القيمة</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 hidden lg:table-cell">الحد الأدنى</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 hidden md:table-cell">المستخدم</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 hidden lg:table-cell">الحد الأقصى</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 hidden md:table-cell">تاريخ الانتهاء</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">الحالة</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.map((d) => (
                      <TableRow key={d.uid} className="hover:bg-gray-50">
                        <TableCell className="text-right font-mono uppercase tracking-wide font-semibold text-gray-900 truncate">{d.code}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', color: BRAND_PRIMARY }}>
                            {d.discount_type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center tabular-nums whitespace-nowrap" style={{ color: BRAND_PRIMARY }}>
                          {formatValue(d)}
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell tabular-nums whitespace-nowrap">{formatMin(d.minimum_order_amount)}</TableCell>
                        <TableCell className="text-center hidden md:table-cell tabular-nums">{d.used_count || 0}</TableCell>
                        <TableCell className="text-center hidden lg:table-cell tabular-nums">{d.usage_limit || '∞'}</TableCell>
                        <TableCell className="text-center hidden md:table-cell whitespace-nowrap">{formatDate(d.expires_at)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center w-full px-3 py-1 text-xs rounded-full font-medium border ${
                            d.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {d.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Link
                            href={`/admin_dashboard/discounts/${d.uid}`}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border"
                            style={{ color: BRAND_PRIMARY, borderColor: '#E5E7EB' }}
                          >
                            تعديل
                          </Link>
                          <button
                            onClick={() => deleteDiscount(d.uid)}
                            className="ml-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'جاري الحذف...' : 'حذف'}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-sm border p-6 mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  صفحة <span className="font-semibold text-gray-900">{currentPage}</span> من <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchDiscounts(currentPage - 1, search)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    السابق
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      if (pageNumber > totalPages) return null;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => fetchDiscounts(pageNumber, search)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all.duration-200 ${
                            pageNumber === currentPage 
                              ? "bg-[#070B39] text-white shadow-md" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => fetchDiscounts(currentPage + 1, search)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    التالي
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}