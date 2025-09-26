import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface Product {
  main_image: string | undefined;
  uid: string;
  title: string;
  description?: string;
  price: number;
  cost_price: number; // Add this field
  stock: number;
  stock_status?: 'in_stock' | 'out_of_stock' | 'on_backorder';
  is_active: boolean;
  main_image_url?: string;
  created_at: string;
  updated_at: string;
  slug?: string;
  sku?: string;
}

interface ProductCardProps {
  product: Product;
  onDelete: (uid: string) => Promise<void>;
  layout: 'card' | 'table';
  className?: string;
}

export default function ProductCard({ product, onDelete, layout, className = '' }: ProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDeleting) return;
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete(product.uid);
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Construct the full image URL based on backend structure: {backend_url}/static/images/products/{product.uid}/{filename}
  const getImageUrl = (filename?: string) => {
    // Return placeholder if no filename or product UID
    if (!filename || !product?.uid) return '/images/placeholder-product.jpg';
    
    // Add cache-busting parameter and return as-is if it's already a full URL
    if (filename.startsWith('http')) return `${filename}?v=${new Date().getTime()}`;
    
    // Clean the filename and construct the URL with cache-busting
    const cleanFilename = filename.replace(/^\/+|\/+$/g, '');
    if (!cleanFilename) return '/images/placeholder-product.jpg';
    
    return `${process.env.NEXT_PUBLIC_API_URL || ''}/static/images/products/${product.uid}/${cleanFilename}?v=${new Date().getTime()}`;
  };
  
  // Get the main image URL - try main_image first, then fall back to main_image_url
  const mainImageUrl = getImageUrl(product.main_image || product.main_image_url);
  

  const isActive = product.is_active;
  const price = product.price ?? 0;
  const hasPrice = price > 0;
  const currentPrice = hasPrice ? price : undefined;
  const originalPrice = undefined; // No longer using old_price/new_price concept
  const isOnSale = false; // No longer using sale concept since we removed old_price/new_price
  
  // Format currency function with fallback
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return 'Not set';
    try {
      // Format with 2 decimal places and JOD symbol
      const formatted = price.toLocaleString('en-JO', { 
        style: 'currency', 
        currency: 'JOD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return formatted;
    } catch (error) {
      console.error('Error formatting price:', error);
      return `JOD ${price.toFixed(2)}`;
    }
  };

  if (layout === 'table') {
    return (
      <div className={`w-full grid grid-cols-12 items-center p-0 hover:bg-gray-50 transition-colors border-b border-gray-100 ${className}`}>
        {/* Image */}
        <div className="col-span-1 flex justify-center px-2 py-3">
          <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
            <div className="w-full h-full relative aspect-[1/0.9]">
              {mainImageUrl ? (
                <>
                  <Image
                    src={mainImageUrl}
                    alt={product.title}
                    fill
                    className={`object-cover ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoadingComplete={() => setIsImageLoading(false)}
                    onError={() => setImageError(true)}
                    sizes="40px"
                    priority={false}
                  />
                  {isImageLoading && (
                    <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                  {imageError ? 'Error' : 'No Img'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Title */}
        <div className="col-span-6 md:col-span-3 px-3 py-3 overflow-hidden">
          <div className="text-sm md:text-base font-medium text-gray-900 truncate text-right leading-tight" dir="rtl">
            {product.title}
          </div>
          {/* Mobile price */}
          <div className="md:hidden mt-1 flex items-center justify-end gap-2">
            <span className="text-xs font-medium">
              {formatPrice(currentPrice)}
            </span>

          </div>
        </div>
        
        {/* Status */}
        <div className="hidden md:flex col-span-2 px-2 py-3">
          <div className="w-full">
            {isActive ? (
              <div className="flex justify-center">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs py-1 px-3">
                  Active
                </Badge>
              </div>
            ) : (
              <div className="flex justify-center">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs py-1 px-3">
                  Inactive
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {/* Price */}
        <div className="hidden md:flex col-span-2 px-2 py-3">
          <div className="w-full">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-medium whitespace-nowrap">
                {formatPrice(currentPrice)}
              </span>

            </div>
          </div>
        </div>
        
        {/* Cost Price - NEW */}
        <div className="hidden lg:flex col-span-1 px-2 py-3">
          <div className="w-full">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-medium text-orange-600 whitespace-nowrap">
                {formatPrice(product.cost_price)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Stock */}
        <div className="hidden md:flex col-span-1 px-2 py-3">
          <div className="w-full">
            <div className="flex justify-center">
              <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                product.stock > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 0 ? `${product.stock} متوفر` : 'غير متوفر'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="col-span-5 md:col-span-2 px-2 py-3">
          <div className="flex justify-center space-x-3 rtl:space-x-reverse">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              asChild
            >
              <Link href={`/admin_dashboard/products/${product.uid}`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Card Layout
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col hover:shadow-lg ${className}`}>
      {/* Image */}
      <div className="relative aspect-[1/0.9] bg-gray-50 sm:bg-gray-100">
        {mainImageUrl ? (
          <>
            <Image
              src={mainImageUrl}
              alt={product.title}
              fill
              className={`object-cover transition-opacity duration-200 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoadingComplete={() => setIsImageLoading(false)}
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={false}
            />
            {isImageLoading && !imageError && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
            <span className="text-sm">No Image</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          {isActive ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">نشط</Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">غير نشط</Badge>
          )}
        </div>
        

        
        {/* Action Buttons */}
        <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
            asChild
          >
            <Link href={`/admin_dashboard/products/${product.uid}`}>
              <Pencil className="h-4 w-4 ml-1" />
              تعديل
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-1" />
            ) : (
              <Trash2 className="h-4 w-4 ml-1" />
            )}
            حذف
          </Button>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-1 sm:mb-2 line-clamp-2 h-12 sm:h-14" dir="rtl">
          {product.title || 'بدون عنوان'}
        </h3>
        
        {/* SKU - Hide on mobile */}
        {product.sku && (
          <p className="hidden sm:block text-xs text-gray-500 mb-2">
            رقم المادة: {product.sku}
          </p>
        )}
        
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-lg font-semibold text-gray-900">
                  {formatPrice(currentPrice)}
                </span>

              </div>
              <div className={`inline-flex items-center px-2 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium mt-1 ${
                product.stock > 0 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {product.stock > 0 ? `${product.stock} متوفر` : 'غير متوفر'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
