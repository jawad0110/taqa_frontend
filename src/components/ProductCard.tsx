"use client"; // Mark this as a Client Component

import Link from 'next/link';
import Image from 'next/image'; // Use next/image for optimization
import { useRouter } from 'next/navigation'; // Import useRouter
import { useSession } from 'next-auth/react'; // Import useSession
import { errorHandler } from '@/lib/error-handler';
import { CheckCircle2, Heart, ShoppingCart } from "lucide-react";

// Define the structure for a single product (can be imported or redefined)
import { ProductDetailModel } from '@/types/product';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // Import Loader2 icon
import { userApi } from '@/lib/api';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

// Use Arkan font
const arkanFont = 'Arkan, system-ui, sans-serif';

interface ProductCardProps {
    product: ProductDetailModel; // Use ProductDetailModel which includes variant_groups
    className?: string;
}

export default function ProductCard({ product, className = '' }: ProductCardProps) {
    const router = useRouter(); // Initialize useRouter
    const { data: session } = useSession(); // Initialize useSession
    const { isInWishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlist();
    const { addToCart: addToCartContext } = useCart();

    const [imageLoaded, setImageLoaded] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false); // State for loading indicator
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // Construct the full image URL if needed with a stable cache key
    const imageUrl = product.main_image
        ? product.main_image.startsWith('http')
            ? `${product.main_image}?v=${product.updated_at || '1.0'}`
            : `${process.env.NEXT_PUBLIC_API_URL}/static/images/products/${product.uid}/${product.main_image}?v=${product.updated_at || '1.0'}`
        : '/images/placeholder-product.jpg'; // Fallback to a local placeholder

    const productUrl = `/products/${product.uid}`; // Link to product detail page in user dashboard

    const handleWishlistToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!session?.user) {
            router.push('/auth/signin');
            return;
        }

        if (isWishlistLoading) return;

        setIsWishlistLoading(true);
        try {
            await toggleWishlist(product.uid);
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            errorHandler.error('فشل في تحديث المفضلة', 'خطأ');
        } finally {
            setIsWishlistLoading(false);
        }
    };

    // Placeholder functions for button clicks
    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!session?.user?.accessToken) {
            errorHandler.error("يجب عليك تسجيل الدخول لإضافة منتجات إلى السلة", "الرجاء تسجيل الدخول");
            router.push('/login');
            return;
        }
        
        // Check if product is out of stock
        if (product.stock_status === 'Out of Stock') {
            errorHandler.error("هذا المنتج غير متوفر حالياً", "نفذت الكمية");
            return;
        }
        
        // Check if product has variants
        if (product.variant_groups && product.variant_groups.length > 0) {
            const variantGroupName = product.variant_groups[0]?.name || "الخيار";
            errorHandler.error(`يرجى اختيار ${variantGroupName} لإضافة المنتج إلى السلة`, "يرجى اختيار الخيار المطلوب");
            router.push(productUrl);
            return;
        }
        
        try {
            setIsAddingToCart(true);
            
            // Use cart context to add item - this will automatically update the navbar count
            await addToCartContext(product.uid, 1);
            
            // If we get here, the product was added successfully
            errorHandler.success(`${product.title} تمت إضافته إلى السلة بنجاح`, "تمت الإضافة إلى السلة");
            
        } catch (err: any) {
            // Show the error message from the backend or a fallback message
            errorHandler.error(err.message || "حدث خطأ أثناء إضافة المنتج إلى السلة", "خطأ");
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleBuyNow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!session?.user?.accessToken) {
            errorHandler.error("يجب عليك تسجيل الدخول لشراء المنتجات", "الرجاء تسجيل الدخول");
            router.push('/login');
            return;
        }
        
        // Check if product is out of stock
        if (product.stock_status === 'Out of Stock') {
            errorHandler.error("هذا المنتج غير متوفر حالياً", "نفذت الكمية");
            return;
        }
        
        // Check if product has variants
        if (product.variant_groups && product.variant_groups.length > 0) {
            const variantGroupName = product.variant_groups[0]?.name || "الخيار";
            errorHandler.error(`يرجى اختيار ${variantGroupName} لإتمام عملية الشراء`, "يرجى اختيار الخيار المطلوب");
            router.push(productUrl);
            return;
        }
        
        setIsBuyingNow(true);
        try {
            // Use cart context to add item - this will automatically update the navbar count
            await addToCartContext(product.uid, 1);
            
            // Redirect to checkout page
            router.replace('/checkout');
        } catch (err: any) {
            errorHandler.error(err.message || "حدث خطأ أثناء محاولة الشراء", "خطأ");
        } finally {
            setIsBuyingNow(false);
        }
    };


    // Check if product is out of stock based on stock_status property
    const isOutOfStock = product.stock_status === 'Out of Stock';


    return (
        // Adjusted hover shadow
        <div className={`group flex flex-col h-full border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md ${className}`}>
            {/* Image Container with 1/0.9 Aspect Ratio */}
            <div className="relative w-full overflow-hidden">
                <Link 
                    href={productUrl}
                    className="block relative w-full aspect-[1/0.9] bg-white min-h-[160px] sm:min-h-[200px]"
                >
                    <div className="absolute inset-0">
                        {/* Loading Skeleton */}
                        {!imageLoaded && (
                            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                        )}
                        
                        {/* Main Product Image */}
                        <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className={`object-cover transition-all duration-300 group-hover:scale-110 ${
                                imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoadingComplete={() => setImageLoaded(true)}
                            priority={false}
                            loading="lazy"
                            quality={75}
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                        
                        {/* Hover Overlay - Darker for better contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* View Button on Hover - Made more prominent */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="bg-background text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-md transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                عرض المنتج
                            </span>
                        </div>
                    </div>
                </Link>
                
                {/* Wishlist Heart Button - Top Right Corner */}
                <button
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                    title={isInWishlist(product.uid) ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                >
                    {isWishlistLoading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-600" />
                    ) : (
                        <Heart 
                            className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${
                                isInWishlist(product.uid)
                                    ? 'fill-red-500 text-red-500' 
                                    : 'text-gray-600 hover:text-red-500'
                            }`} 
                        />
                    )}
                </button>
            </div>

            {/* Content Padding */}
            <div className="p-3 sm:p-4 flex flex-col flex-grow space-y-1.5 sm:space-y-2">
                {/* Title - Link */}
                <Link href={productUrl} className="block mb-0.5 sm:mb-1">
                     <h2 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors" style={{ fontFamily: arkanFont }}>
                        {product.title}
                    </h2>
                </Link>

                {/* Price and Stock container - RTL layout fix */}
                <div className="pt-1.5 sm:pt-2 flex justify-between items-center">
                    {/* Price group */}
                    <div className="flex items-baseline space-x-reverse space-x-2 rtl:space-x-reverse">
                        <span className="text-base sm:text-lg font-bold text-secondary" style={{ fontFamily: arkanFont }}>{product.price} JOD</span>
                    </div>

                    {/* Stock Status Badge */}
                    <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.stock_status === 'Out of Stock'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-success/10 text-success'
                        }`}
                    >
                        {product.stock_status === 'Out of Stock' ? 'نفذت الكمية' : 'متوفر'}
                    </span>
                </div>

                {/* Action Buttons - Improved sizing and styling */}
                <div className="mt-auto pt-3 sm:pt-4 flex gap-2 sm:gap-3 rtl:space-x-reverse">
                    {/* Buy Button - Wider */}
                    <button
                        onClick={handleBuyNow}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg border-2 border-primary hover:border-primary/90 transition-all duration-200 text-xs sm:text-sm hover:shadow-md"
                        aria-label={`Buy ${product.title} now`}
                        disabled={isOutOfStock || isBuyingNow} // Disable if out of stock or buying now
                    >
                        {isBuyingNow ? (
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" /> // Show spinner when buying
                        ) : isOutOfStock ? (
                             'نفذت الكمية' // Out of Stock
                        ) : (
                            'اشتري' // Buy Now
                        )}
                    </button>
                    {/* Add to Cart Button - Smaller with icon only */}
                    <button
                        onClick={handleAddToCart}
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-background hover:bg-muted text-foreground rounded-lg border-2 border-border transition-all duration-200 hover:shadow-sm flex items-center justify-center"
                        aria-label={`Add ${product.title} to cart`}
                        disabled={isOutOfStock || isBuyingNow || isAddingToCart} // Disable if out of stock, buying now, or adding to cart
                    >
                        {isOutOfStock ? (
                            <span className="text-xs">نفذت</span>
                        ) : isAddingToCart ? (
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        ) : (
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
