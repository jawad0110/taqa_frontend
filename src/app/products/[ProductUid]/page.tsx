'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/app/config';
import { ProductDetailModel, VariantChoice } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';
import { errorHandler } from '@/lib/error-handler';
import AddToCartButton from '@/components/add-to-cart-button';
import { useSession } from 'next-auth/react';
import { useCart } from '@/contexts/CartContext';

interface AddToCartButtonProps {
  product: ProductDetailModel;
  quantity: number;
  disabled: boolean;
  className: string;
  variantChoiceId?: string;
  onAddToCart?: () => void;
  onError?: (message: string) => void;
}

export default function ProductDetails() {
  const [descriptionVisible, setDescriptionVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const productUid = pathname.split('/')[2]; // Get the third segment of the path which is the ProductUid

  const { data: session } = useSession();
  const { addToCart: addToCartContext } = useCart();
  const [product, setProduct] = useState<ProductDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isOutOfStock, setIsOutOfStock] = useState(false);

  const handleVariantSelection = async (groupId: string, choiceId: string) => {
    const newSelectedVariants = {
      ...selectedVariants,
      [groupId]: choiceId
    };
    setSelectedVariants(newSelectedVariants);
    
    // If this is a single variant group, update the selected variant ID
    if (product?.variant_groups?.length === 1) {
      setSelectedVariantId(choiceId);
      
      // Fetch the product with the selected variant to update stock status
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productUid}?variant_id=${choiceId}`);
        if (response.ok) {
          const updatedProduct = await response.json();
          setProduct(updatedProduct);
          setIsOutOfStock(updatedProduct.stock_status === 'Out of Stock');
        }
      } catch (error) {
        console.error('Error fetching product with selected variant:', error);
        errorHandler.error('حدث خطأ أثناء جلب المنتج مع المتغير المحدد');
      }
    }
  };

  // Calculate total extra price from all selected variants
  const calculateTotalExtraPrice = () => {
    if (!product) return 0;
    
    let totalExtraPrice = 0;

    // Get all selected choices and sum their extra prices
    Object.entries(selectedVariants).forEach(([groupId, choiceId]) => {
      const group = product.variant_groups.find(g => g.id === groupId);
      if (group) {
        const choice = group.choices.find(c => c.id === choiceId);
        if (choice?.extra_price !== undefined && choice.extra_price !== null) {
          totalExtraPrice += Number(choice.extra_price);
        }
      }
    });

    return totalExtraPrice;
  };
  
  // Get stock status text
  const getStockStatus = () => {
    if (!product) return '';
    
    // If product has variants
    if (product.variant_groups && product.variant_groups.length > 0) {
      // If a variant is selected, show its stock status
      if (Object.keys(selectedVariants).length > 0) {
        const selectedVariantId = Object.values(selectedVariants)[0];
        const variant = product.variant_groups[0].choices.find(
          (choice: VariantChoice) => choice.id === selectedVariantId
        );
        
        if (variant) {
          if (typeof variant.stock === 'number') {
            return variant.stock > 0 
              ? `متوفر (${variant.stock} في المخزن)` 
              : 'غير متوفر حالياً';
          }
          return 'متوفر';
        }
      }
      
      // If no variant selected, show if any variant is in stock
      const anyInStock = product.variant_groups.some(group => 
        group.choices.some(choice => 
          typeof choice.stock === 'number' ? choice.stock > 0 : true
        )
      );
      return anyInStock ? 'متوفر' : 'غير متوفر حالياً';
    }
    
    // For products without variants
    if (typeof product.stock === 'number') {
      return product.stock > 0 
        ? `متوفر (${product.stock} في المخزن)` 
        : 'غير متوفر حالياً';
    }
    
    return product.stock_status === 'In Stock' ? 'متوفر' : 'غير متوفر حالياً';
  };

  const handleAddToCart = async () => {
    if (product?.variant_groups && product.variant_groups.length > 0) {
      const missingVariants = product.variant_groups.filter(
        group => !selectedVariants[group.id]
      );
      
      if (missingVariants.length > 0) {
        setError(`الرجاء اختيار ${missingVariants.length} خيار${missingVariants.length > 1 ? 'ات' : ''} مطلوبة`);
        return;
      }
      
      // Check if the selected variant is out of stock
      if (product.variant_groups.length === 1) {
        const selectedChoiceId = Object.values(selectedVariants)[0];
        const selectedVariant = product.variant_groups[0].choices.find(
          (choice: VariantChoice) => choice.id === selectedChoiceId
        );
        
        // Check if variant exists and has stock defined, and if it's out of stock
        if (selectedVariant && typeof selectedVariant.stock === 'number' && selectedVariant.stock <= 0) {
          setError('المنتج غير متوفر حالياً');
          return;
        }
      }
    } else if (product && typeof product.stock === 'number' && product.stock <= 0) {
      // For products without variants, check product stock if defined
      setError('المنتج غير متوفر حالياً');
      return;
    }

    try {
      if (!session?.user) {
        setError('الرجاء تسجيل الدخول لإضافة المنتج إلى السلة');
        return;
      }

      if (!product) {
        setError('حدث خطأ في تحميل تفاصيل المنتج');
        return;
      }

      // Check if product is out of stock
      if (isOutOfStock) {
        setError('المنتج غير متوفر حالياً');
        return;
      }

      setIsAddingToCart(true);
      setError(null);
      
      // Use cart context to add item - this will automatically update the navbar count
      await addToCartContext(
        productUid,
        1,
        product?.variant_groups && product.variant_groups.length > 0 
          ? Object.values(selectedVariants)[0]
          : undefined
      );

      // Show success message
      errorHandler.success(`${product.title} تمت إضافته إلى السلة بنجاح`, "تمت الإضافة إلى السلة");
      
      // Redirect to cart page
      router.push('/cart/');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('حدث خطأ أثناء إضافة المنتج إلى السلة');
      errorHandler.error('حدث خطأ أثناء إضافة المنتج إلى السلة');
    } finally {
      setIsAddingToCart(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productUid}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch product' }));
          setError(errorData?.detail || 'حدث خطأ أثناء تحميل تفاصيل المنتج');
          throw new Error(errorData?.detail || 'حدث خطأ أثناء تحميل تفاصيل المنتج');
        }
        const data = await response.json();
        
        // Add default values for variant groups if they don't exist
        if (!data.variant_groups) {
          data.variant_groups = [];
        }
        
        // Set initial stock status
        setIsOutOfStock(data.stock_status === 'Out of Stock');
        setProduct(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching product:', error);
        errorHandler.error('حدث خطأ أثناء جلب المنتج');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productUid]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">المنتج غير موجود</div>
      </div>
    );
  }

  return (
    <>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full lg:w-[500px] mx-auto">
            <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
              {product && (
                <div className="relative w-full h-full overflow-hidden">
                  
                  {/* Navigation Arrows - Only show if multiple images */}
                  {product.images && product.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentImageIndex((prev) => {
                            const newIndex = prev === 0 ? product.images.length - 1 : prev - 1;
                            return newIndex;
                          });
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity z-10"
                        aria-label="Previous image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentImageIndex((prev) => {
                            const newIndex = prev === product.images.length - 1 ? 0 : prev + 1;
                            return newIndex;
                          });
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity z-10"
                        aria-label="Next image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Main Image Gallery */}
                  {product.images && product.images.length > 0 ? (
                    <div className="w-full h-full">
                      <Image
                        src={product.images[currentImageIndex].filename.startsWith('http')
                          ? `${product.images[currentImageIndex].filename}?v=${new Date().getTime()}`
                          : `${process.env.NEXT_PUBLIC_API_URL}/static/images/products/${productUid}/${product.images[currentImageIndex].filename}?v=${new Date().getTime()}`}
                        alt={`${product.title} - صورة ${currentImageIndex + 1}`}
                        fill
                        className="object-contain w-full h-auto" style={{ aspectRatio: '1/0.9' }}
                        priority
                        onError={() => {
                          console.error('Image failed to load:', product.images[currentImageIndex].filename);
                        }}
                      />
                    </div>
                  ) : (
                    // Fallback for no images
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">لا توجد صورة</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Product Details */}
          <div className="space-y-6 text-right">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold">{product.title}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                getStockStatus().includes('غير متوفر') ? 'bg-red-200 text-red-900' : 'bg-green-200 text-green-900'
              }`}>
                {getStockStatus().includes('غير متوفر') ? 'نفذت الكمية' : 'متوفر'}
              </span>
            </div>
            
            {/* Product Variants */}
            {product.variant_groups && product.variant_groups.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <div className="space-y-4">
                  {product.variant_groups.map((group) => (
                    <div key={group.id} className="space-y-2">
                      <h3 className="text-base sm:text-lg md:text-lg font-medium text-gray-700">{group.name}</h3>
                      <div className="flex flex-wrap gap-2 justify-start">
                        {group.choices.map((choice) => (
                          <button
                            key={choice.id}
                            onClick={() => handleVariantSelection(group.id, choice.id)}
                            className={`px-3 sm:px-4 md:px-4 py-1.5 sm:py-2 md:py-2 rounded-full transition-colors text-sm sm:text-base md:text-base ${
                              selectedVariants[group.id] === choice.id
                                ? 'bg-black text-white border border-black'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {choice.value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl md:text-2xl font-semibold text-gray-800">JOD {(Number(product?.price || 0) + calculateTotalExtraPrice()).toFixed(2)}</div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <AddToCartButton
                product={product}
                quantity={1}
                disabled={isAddingToCart || isOutOfStock}
                className="w-full"
                variantChoiceId={product.variant_groups && product.variant_groups.length > 0 
                  ? Object.values(selectedVariants)[0]
                  : undefined}
                onAddToCart={handleAddToCart}
                onError={(message) => {
                  setError(message);
                }}
              />
              <button 
                onClick={() => router.push('/cart/')}
                disabled={isOutOfStock}
                className="w-full bg-[#161f30] text-white py-2 sm:py-3 md:py-3 px-4 sm:px-6 md:px-6 rounded-lg border border-black hover:bg-[#1b263b] transition-colors font-semibold text-base sm:text-lg md:text-lg inline-flex items-center justify-center"
              >
                <span className="font-sans">شراء الآن</span>
              </button>
            </div>

            <div className="mt-6 sm:mt-8">
              <h2 
                className="text-lg sm:text-xl md:text-xl font-semibold mb-2 cursor-pointer"
                onClick={() => setDescriptionVisible(!descriptionVisible)}
              >
                الوصف
              </h2>
              <hr className="mb-4" />
              {descriptionVisible && (
                <p className="text-sm sm:text-base md:text-base text-gray-600">{product.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}