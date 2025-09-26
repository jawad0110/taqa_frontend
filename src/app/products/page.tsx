// frontend/src/app/products/page.tsx
"use client"; // Make it a client component

import { useState, useEffect, ChangeEvent, useRef } from 'react';
import ProductCard from '@/components/ProductCard'; // Adjust path if needed

// Define sorting options based on backend implementation
enum SortField {
    PRICE = 'price',
    DATE = 'date',
    NAME = 'name',
    QUANTITY = 'quantity'
}

enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

// Import ProductDetailModel from types
import { ProductDetailModel } from '@/types/product';

// Define the structure for a single product based on the backend schema
interface Product {
    uid: string;
    title: string;
    description: string;
    price: number;
    stock?: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
    main_image?: string;
    category: { 
        name: string; 
        uid?: string;
    } | null;
    stock_status?: string;
    in_stock?: boolean;
    images: Array<{
        uid: string;
        filename: string;
        is_main: boolean;
        created_at?: string;
        updated_at?: string;
    }>;
}

interface PaginatedResponse {
    items: Product[];
    page: number;
    total_pages: number;
    total: number;
}

// Async function to fetch products with sorting and filtering
async function getProducts(
    searchQuery: string = "",
    category: string | null = null,
    minPrice: number | null = null,
    maxPrice: number | null = null,
    sortField: SortField | null = null,
    sortOrder: SortOrder = SortOrder.DESC,
    page: number = 1,
    limit: number = 20
): Promise<PaginatedResponse> {
    try {
        // Base URL
        let url = `${process.env.NEXT_PUBLIC_API_URL}/products`;
        const params = new URLSearchParams();

        // Add pagination
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        // Add search query if it exists
        if (searchQuery.trim()) {
            params.append('search', searchQuery.trim());
        }

        // Add category filter if it exists
        if (category) {
            params.append('category', category);
        }

        // Add price range filters if they exist
        if (minPrice !== null) {
            params.append('min_price', minPrice.toString());
        }
        if (maxPrice !== null) {
            params.append('max_price', maxPrice.toString());
        }

        // Add sorting parameters if they exist
        if (sortField) {
            params.append('sort_by', sortField);
            params.append('sort_order', sortOrder);
        }

        // Construct the full URL
        url += `?${params.toString()}`;

    

        const res = await fetch(url, {
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Server response:', errorText);
            throw new Error(`Failed to fetch products: ${res.statusText}. Server response: ${errorText}`);
        }
        
        const data = await res.json();
    
        return data;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error; // Re-throw to show in the UI
    }
}

// The page component (Client Component)
export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<string>('default');
    const [minPrice, setMinPrice] = useState<number | null>(null);
    const [maxPrice, setMaxPrice] = useState<number | null>(null);
    const [inStock, setInStock] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [itemsPerPage, setItemsPerPage] = useState(16);
    const [totalProducts, setTotalProducts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Categories from the database
    const categories = [
        'الطاقة المتجددة',
        'الطاقة الشمسية',
        'طاقة الرياح',
        'كهرباء',
        'أخرى'
    ];

    // Sorting options in Arabic
    const sortOptions = [
        { value: 'default', label: 'الترتيب الافتراضي' },
        { value: 'price_asc', label: 'السعر: من الأدنى للأعلى' },
        { value: 'price_desc', label: 'السعر: من الأعلى للأدنى' },
        { value: 'name_asc', label: 'الاسم: أ-ي' },
        { value: 'name_desc', label: 'الاسم: ي-أ' },
        { value: 'date_desc', label: 'الأحدث' },
        { value: 'date_asc', label: 'الأقدم' }
    ];

    // Fetch products on initial load
    useEffect(() => {
        const fetchInitialProducts = async () => {
            try {
                setIsLoading(true);
                const fetchedProducts = await getProducts();
                setProducts(fetchedProducts.items);
                setTotalProducts(fetchedProducts.total || 0);
                setError(null);
            } catch (err) {
                console.error('Error fetching initial products:', err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialProducts();
    }, []); // Only run on initial mount

    // Handle search changes with debounce
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const fetchedProducts = await getProducts(
                    searchQuery,
                    category || null,
                    minPrice,
                    maxPrice,
                    sortOption !== 'default' ? sortOption.split('_')[0] as SortField : null,
                    sortOption !== 'default' ? 
                        (sortOption.split('_')[1] === 'asc' ? SortOrder.ASC : SortOrder.DESC) : 
                        undefined,
                    currentPage,
                    itemsPerPage
                );
                
                setProducts(fetchedProducts.items || []);
                setTotalProducts(fetchedProducts.total || 0);
                setTotalPages(fetchedProducts.total_pages || 1);
                
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products. Please try again.');
                setProducts([]);
            } finally {
                setIsLoading(false);
                if (!hasInitialized) {
                    setHasInitialized(true);
                }
            }
        };

        fetchProducts();
    }, [sortOption, searchQuery, minPrice, maxPrice, inStock, category, itemsPerPage, currentPage, hasInitialized]);

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.trim();
        setSearchQuery(value);
        
        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                setIsLoading(true);
                const fetchedProducts = await getProducts(value);
                setProducts(fetchedProducts.items);
                setTotalProducts(fetchedProducts.total || 0);
                setError(null);
            } catch (err) {
                console.error('Error searching products:', err);
                setError('Failed to search products. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }, 300); // 300ms delay

        // Cleanup function
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    };

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Search Bar - Centered */}
                <div className="mb-8">
                    <div className="flex justify-center">
                        <div className="relative w-150 max-w-6xl">
                            <input
                                type="search"
                                name="search"
                                id="search"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-3 text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                                placeholder="ابحث عن منتج..."
                            />
                        </div>
                    </div>
                </div>

                {/* Sort and Filter Row */}
                <div className="mb-8 flex justify-start gap-4">
                    {/* Sort Dropdown */}
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="w-56 px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 cursor-pointer"
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value} className="text-gray-700">
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Items per Page Selector */}
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            const newItemsPerPage = Number(e.target.value);
                            setItemsPerPage(newItemsPerPage);
                            setCurrentPage(1);
                            getProducts(); // Always fetch from page 1 when changing items per page
                        }}
                        className="w-18 px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 cursor-pointer"
                    >
                        <option value="16">16</option>
                        <option value="24">24</option>
                        <option value="50">50</option>
                        <option value="75">75</option>
                        <option value="100">100</option>
                    </select>

                    {/* Filter Button - Show on mobile and iPad */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="w-12 h-12 bg-[#161f30] text-white rounded-lg hover:bg-[#1b263b] transition-colors flex items-center justify-center lg:hidden"
                        aria-label="فلترة المنتجات"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </button>
                </div>

                {/* Grid Layout with Products and Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {/* Products Grid */}
                    <div className="lg:col-span-3 col-span-full">
                        {isLoading && !hasInitialized ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                <p className="text-gray-600">جاري تحميل المنتجات...</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414.168.75.375.75h9.75a.75.75 0 00.75-.75v-1.5a.75.75 0 00-.75-.75h-9.75a.75.75 0 00-.75.75v1.5z" />
                                </svg>
                                <p className="text-gray-600">
                                    {hasInitialized ? "لا توجد منتجات متطابقة مع بحثك" : "لا توجد منتجات متاحة حاليًا"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {products.map((product) => {
                                    // Create a properly typed product object that matches ProductDetailModel
                                    const productDetail: ProductDetailModel = {
                                        uid: product.uid,
                                        title: product.title,
                                        description: product.description,
                                        price: product.price,
                                        stock: product.stock ?? 0,
                                        is_active: product.is_visible ?? true,
                                        created_at: product.created_at,
                                        updated_at: product.updated_at,
                                        main_image: product.main_image || undefined,
                                        category: product.category ? {
                                            uid: product.uid, // Using product's uid as a fallback for category uid
                                            name: product.category.name
                                        } : undefined,
                                        variant_groups: [],
                                        reviews: [],
                                        images: (product.images || []).map(img => ({
                                            uid: img.uid,
                                            product_uid: product.uid,
                                            filename: img.filename,
                                            is_main: img.is_main,
                                            created_at: img.created_at || new Date().toISOString(),
                                            updated_at: img.updated_at || new Date().toISOString(),
                                            product: null as any // This circular reference is handled by the component
                                        })),
                                        stock_status: product.stock_status || 'in_stock',
                                        in_stock: product.in_stock
                                    };

                                    return (
                                        <div key={product.uid} className="w-full">
                                            <ProductCard 
                                                product={productDetail} 
                                                className="h-full" 
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>



                    {/* Filters Card */}
                    <div className="lg:col-span-1 hidden lg:block col-start-4">
                        <div className="w-full bg-white rounded-lg md:rounded-xl shadow-lg p-4 md:p-6 border border-gray-100">
                            <h3 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-gray-800 text-right">الفلترة</h3>

                            {/* Price Range */}
                            <div className="mb-4 md:mb-6">
                                <h4 className="text-sm md:text-lg font-medium mb-2 md:mb-3 lg:mb-4 text-gray-700 text-right">السعر</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1 text-right">الحد الأدنى</label>
                                        <input
                                            type="number"
                                            value={minPrice || ''}
                                            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-2 py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-3 border border-gray-200 rounded-md md:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-opacity-50"
                                            placeholder="الحد الأدنى"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1 text-right">الحد الأعلى</label>
                                        <input
                                            type="number"
                                            value={maxPrice || ''}
                                            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-2 py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-3 border border-gray-200 rounded-md md:rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-opacity-50"
                                            placeholder="الحد الأعلى"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stock Availability */}
                            <div className="mb-4 md:mb-6 text-right">
                                <h4 className="text-sm md:text-lg font-medium mb-2 md:mb-3 lg:mb-4 text-gray-700 text-right">حالة المخزون</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
                                        <input
                                            type="radio"
                                            id="all"
                                            name="stock"
                                            value=""
                                            checked={!inStock}
                                            onChange={(e) => setInStock(e.target.value)}
                                            className="text-blue-500"
                                        />
                                        <label htmlFor="all" className="text-xs md:text-sm text-gray-600 text-right">عرض الكل</label>
                                    </div>
                                    <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
                                        <input
                                            type="radio"
                                            id="inStock"
                                            name="stock"
                                            value="inStock"
                                            checked={inStock === 'inStock'}
                                            onChange={(e) => setInStock(e.target.value)}
                                            className="text-blue-500"
                                        />
                                        <label htmlFor="inStock" className="text-xs md:text-sm text-gray-600 text-right">متوفر في المخزون</label>
                                    </div>
                                    <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
                                        <input
                                            type="radio"
                                            id="outOfStock"
                                            name="stock"
                                            value="outOfStock"
                                            checked={inStock === 'outOfStock'}
                                            onChange={(e) => setInStock(e.target.value)}
                                            className="text-blue-500"
                                        />
                                        <label htmlFor="outOfStock" className="text-xs md:text-sm text-gray-600 text-right">غير متوفر في المخزون</label>
                                    </div>
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div>
                                <h4 className="text-sm md:text-lg font-medium mb-2 md:mb-3 lg:mb-4 text-gray-700 text-right">الفئة</h4>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-2 py-1.5 md:px-3 md:py-2 border border-gray-200 rounded-md md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-opacity-50 appearance-none"
                                >
                                    <option value="" className="text-right">جميع الفئات</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat} className="text-gray-700">
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Filter Popup */}
                    <div
                        className={`fixed inset-0 backdrop-blur-sm z-50 ${
                            isFilterOpen ? 'block' : 'hidden'
                        }`}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsFilterOpen(false);
                            }
                        }}
                    >
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-xl shadow-xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-800">الفلترة</h3>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Price Range */}
                            <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2 text-gray-700 text-right">السعر</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1 text-right">الحد الأدنى</label>
                                        <input
                                            type="number"
                                            value={minPrice || ''}
                                            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-opacity-50"
                                            placeholder="الحد الأدنى"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1 text-right">الحد الأعلى</label>
                                        <input
                                            type="number"
                                            value={maxPrice || ''}
                                            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-opacity-50"
                                            placeholder="الحد الأعلى"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stock Availability */}
                            <div className="mb-4 text-right">
                                <h4 className="text-sm font-medium mb-2 text-gray-700 text-right">حالة المخزون</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="all"
                                            name="stock"
                                            value=""
                                            checked={!inStock}
                                            onChange={(e) => setInStock(e.target.value)}
                                            className="text-blue-500"
                                        />
                                        <label htmlFor="all" className="text-sm text-gray-600 text-right">عرض الكل</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="inStock"
                                            name="stock"
                                            value="inStock"
                                            checked={inStock === 'inStock'}
                                            onChange={(e) => setInStock(e.target.value)}
                                            className="text-blue-500"
                                        />
                                        <label htmlFor="inStock" className="text-sm text-gray-600 text-right">متوفر في المخزون</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="outOfStock"
                                            name="stock"
                                            value="outOfStock"
                                            checked={inStock === 'outOfStock'}
                                            onChange={(e) => setInStock(e.target.value)}
                                            className="text-blue-500"
                                        />
                                        <label htmlFor="outOfStock" className="text-sm text-gray-600 text-right">غير متوفر في المخزون</label>
                                    </div>
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div>
                                <h4 className="text-sm font-medium mb-2 text-gray-700 text-right">الفئة</h4>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-opacity-50 appearance-none"
                                >
                                    <option value="" className="text-right">جميع الفئات</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat} className="text-gray-700">
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Pagination */}
            {totalProducts <= itemsPerPage ? null : (
              <div className="flex justify-center mt-12 space-x-1 mb-16">
                <button
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                    getProducts();
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  السابق
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      getProducts();
                    }}
                    className={`px-3 py-1 border rounded ${
                      page === currentPage ? "bg-blue-50 border-blue-500 text-blue-600" : ""
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                    getProducts();
                  }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
        </div>
    );
}

