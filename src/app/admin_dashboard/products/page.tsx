'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { errorHandler } from '@/lib/error-handler';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { LayoutGrid, List } from "lucide-react";
import ProductCard, { Product } from "@/components/admin_side/ProductCard";
import { AdminPageWrapper } from '@/components/admin/AdminPageWrapper';
import { AdminLoadingSpinner } from '@/components/admin/AdminLoadingSpinner';
import { AdminErrorDisplay } from '@/components/admin/AdminErrorDisplay';

// Responsive breakpoints
const MOBILE = 640;
const TABLET = 768;
const LAPTOP = 1024;
const DESKTOP = 1280;

interface PaginatedResponse {
  items: Product[];
  page: number;
  total_pages: number;
  total: number;
}

export default function ProductsPage() {
  const { session, isAuthenticated, accessToken } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [itemsPerPage, setItemsPerPage] = useState(16);

  const fetchProducts = async (page = 1, q = "") => {
    setLoading(true);
    setError(null);
    try {
      if (!isAuthenticated || !accessToken) {
        return;
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      if (q) params.append("search", q);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/products/?${params}`;

      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        cache: "no-store"
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      const data: PaginatedResponse = await res.json();
      setProducts(data.items);
      setTotalPages(data.total_pages);
      setCurrentPage(data.page);
      setTotalProducts(data.total || 0);
    } catch (e: any) {
      const errorMessage = e.message || "فشل تحميل المنتجات";
      setError(errorMessage);
      errorHandler.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (uid: string) => {
    if (isDeleting) return;
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المنتج؟")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${uid}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      const data = await res.json();
      
      if (!res.ok) {
        // Extract error message from response if available
        const errorMessage = data?.message || "فشل الحذف";
        errorHandler.error(errorMessage);
        return;
      }
      
      // Success case
      errorHandler.success(data.message || "تم حذف المنتج بنجاح");
      fetchProducts(currentPage, search);
    } catch (error) {
      console.error("Error deleting product:", error);
      errorHandler.error("فشل حذف المنتج. يرجى المحاولة مرة أخرى لاحقًا.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchProducts();
    }
  }, [isAuthenticated, accessToken]);

  return (
    <AdminPageWrapper title="إدارة المنتجات" className="max-w-full px-0 sm:px-4 mx-0">
      {loading ? (
        <AdminLoadingSpinner message="جاري تحميل المنتجات..." />
      ) : error ? (
        <AdminErrorDisplay 
          message={error} 
          onRetry={() => fetchProducts(currentPage, search)} 
        />
      ) : (
        <>
          {/* Header & Controls */}
          <div className="space-y-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المنتجات</h1>
                <p className="text-gray-600">إدارة وعرض جميع منتجات المتجر</p>
              </div>
              <Link 
                href="/admin_dashboard/products/create" 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap font-medium"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">+</span>
                  إضافة منتج جديد
                </span>
              </Link>
            </div>
            
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">عرض:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-2 flex items-center justify-center transition-all duration-200 rounded-md ${
                        viewMode === "table"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      aria-label="عرض الجدول"
                      title="عرض الجدول"
                    >
                      <List size={18} className="flex-shrink-0" />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-2 flex items-center justify-center transition-all duration-200 rounded-md ${
                        viewMode === "grid"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      aria-label="عرض البطاقات"
                      title="عرض البطاقات"
                    >
                      <LayoutGrid size={18} className="flex-shrink-0" />
                    </button>
                  </div>
                </div>
                
                {/* Items Per Page */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">عرض:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      const newItemsPerPage = Number(e.target.value);
                      setItemsPerPage(newItemsPerPage);
                      fetchProducts(1, search);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white min-w-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="16">16</option>
                    <option value="24">24</option>
                    <option value="50">50</option>
                    <option value="75">75</option>
                    <option value="100">100</option>
                  </select>
                </div>
                
                {/* Search */}
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="ابحث عن منتج..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchProducts(1, search)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap font-medium"
                  >
                    بحث
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && <div className="p-4 bg-red-100 mb-4">{error}</div>}

          {/* Loading & Empty */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">جاري تحميل المنتجات...</p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">لا توجد منتجات.</p>
              <p className="text-sm text-muted-foreground/60 mt-2">يمكنك إضافة منتج جديد من خلال الزر أعلاه</p>
            </div>
          ) : viewMode === "table" ? (
            <div className="w-full overflow-x-auto">
              <div className="min-w-full bg-white shadow-xl rounded-xl border border-gray-100">
                {/* Header Row */}
                <div className="w-full grid grid-cols-12 bg-gradient-to-r from-gray-800 to-gray-900 text-xs font-medium text-white uppercase tracking-wider rounded-t-xl">
                  <div className="col-span-1 flex items-center justify-center px-2 py-4">
                    <span className="text-gray-300 text-xs">الصورة</span>
                  </div>
                  <div className="col-span-6 md:col-span-3 flex items-center px-3 py-4">
                    <span className="text-white font-medium text-sm">المنتج</span>
                  </div>
                  <div className="hidden md:flex col-span-2 items-center justify-center px-2 py-4">
                    <span className="text-gray-300 text-xs">الحالة</span>
                  </div>
                  <div className="hidden md:flex col-span-2 items-center justify-center px-2 py-4">
                    <span className="text-gray-300 text-xs">السعر</span>
                  </div>
                  <div className="hidden lg:flex col-span-1 items-center justify-center px-2 py-4">
                    <span className="text-gray-300 text-xs">سعر التكلفة</span>
                  </div>
                  <div className="hidden md:flex col-span-1 items-center justify-center px-2 py-4">
                    <span className="text-gray-300 text-xs">المخزون</span>
                  </div>
                  <div className="col-span-5 md:col-span-2 flex items-center justify-center px-2 py-4">
                    <span className="text-gray-300 text-xs">الإجراءات</span>
                  </div>
                </div>
                {/* Products List */}
                <div className="divide-y divide-gray-200">
                {products.map((p) => (
                  <ProductCard
                    key={p.uid}
                    product={p}
                    onDelete={deleteProduct}
                    layout="table"
                    className={`whitespace-nowrap ${isDeleting ? "opacity-75" : ""}`}
                  />
                ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr items-stretch w-full">
              {products.map((p) => (
                <ProductCard
                  key={p.uid}
                  product={p}
                  onDelete={deleteProduct}
                  layout="card"
                  className="h-full transform hover:scale-105 transition-all duration-300"
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalProducts > itemsPerPage && (
            <div className="bg-white rounded-xl shadow-sm border p-6 mt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  عرض <span className="font-semibold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> إلى <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalProducts)}</span> من <span className="font-semibold text-gray-900">{totalProducts}</span> منتج
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchProducts(currentPage - 1, search)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all duration-200 font-medium"
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
                          onClick={() => fetchProducts(pageNumber, search)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            pageNumber === currentPage 
                              ? "bg-blue-500 text-white shadow-md" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => fetchProducts(currentPage + 1, search)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    التالي
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminPageWrapper>
  );
}
