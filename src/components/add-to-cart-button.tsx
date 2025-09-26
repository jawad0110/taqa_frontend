"use client"

import { useState } from "react"
import { ShoppingCart } from "lucide-react"
import { errorHandler } from '@/lib/error-handler'
import { ProductDetailModel } from "@/types/product"
import { API_BASE_URL } from "@/app/config"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useCart } from '@/contexts/CartContext'

interface AddToCartButtonProps {
  product: ProductDetailModel
  quantity?: number
  disabled?: boolean
  className?: string
  variantChoiceId?: string
  onError?: (message: string) => void
  onAddToCart?: () => Promise<void>
}

export default function AddToCartButton({ product, quantity = 1, disabled = false, className = '', variantChoiceId, onError, onAddToCart }: AddToCartButtonProps) {

  const { data: session } = useSession()
  const { addToCart: addToCartContext } = useCart()
  const [isLoading, setIsLoading] = useState(false)

  const addToCart = async () => {
    try {
      if (!session?.user?.accessToken) {
        onError?.('الرجاء تسجيل الدخول لإضافة المنتج إلى السلة');
        return;
      }

      setIsLoading(true)
      
      // If onAddToCart is provided, use it instead of making the API call
      if (onAddToCart) {
        await onAddToCart();
      } else {
        // Use the cart context to add item and automatically refresh navbar count
        await addToCartContext(product.uid, quantity, variantChoiceId);
        // Show success message after successful addition
        errorHandler.success(`${product.title} تمت إضافته إلى السلة بنجاح`, "تمت الإضافة إلى السلة");
      } 
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Only show error message if it's a real error, not a network issue
      if (error instanceof Error && !error.message.includes('Failed to fetch')) {
        onError?.('حدث خطأ أثناء إضافة المنتج إلى السلة');
      } else {
        // For network issues, just log and don't show error to user
        console.warn("Network issue during add to cart, but operation may have succeeded");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      className={cn(
        "flex items-center justify-center bg-background hover:bg-muted text-foreground font-medium py-2.5 px-4 rounded-lg border-2 border-border transition-all duration-200 text-sm hover:shadow-sm disabled:opacity-70 disabled:cursor-not-allowed w-full",
        isLoading && "opacity-70 cursor-wait",
        className
      )}
      disabled={disabled || isLoading}
      onClick={async () => {
        if (onAddToCart) {
          await onAddToCart();
        } else {
          await addToCart();
        }
      }}
    >
      {isLoading ? (
        <>
          <ShoppingCart className="ml-2 h-4 w-4 animate-spin rtl:mr-2 rtl:ml-0" />
          <span>جاري الإضافة...</span>
        </>
      ) : (
        <>
          <ShoppingCart className="ml-2 h-4 w-4 rtl:mr-2 rtl:ml-0" />
          <span>أضف للسلة</span>
        </>
      )}
    </button>
  )
}
