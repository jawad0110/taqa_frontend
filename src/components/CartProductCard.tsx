// CartProductCard.tsx
"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { CartItem } from "@/types/cart"
import { errorHandler } from '@/lib/error-handler'
import { useCart } from '@/contexts/CartContext'

interface CartProductCardProps {
  item: CartItem & { 
    variant_choice_value?: string;
    price: number;
  }
  userUid: string
  onRefresh?: () => Promise<void> // Optional for backward compatibility
}

export function CartProductCard({
  item,
  userUid,
  onRefresh
}: CartProductCardProps) {
  const { data: session } = useSession()
  const { updateQuantity: updateQuantityContext, removeFromCart: removeFromCartContext } = useCart()
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(0)
  
  // Check if item is out of stock
  const isOutOfStock = item.stock <= 0

  const updateQuantity = async (newQuantity: number) => {
    // Prevent rapid updates (debounce) and multiple simultaneous operations
    const now = Date.now()
    if (now - lastUpdateTime < 300 || isUpdating) {
      return
    }
    setLastUpdateTime(now)

    if (!session?.user?.accessToken) {
      errorHandler.error("يجب تسجيل الدخول أولاً")
      return
    }

    // Store the original quantity before any changes
    const originalQuantity = item.quantity

    // Check stock limit and auto-adjust if exceeded
    if (newQuantity > item.stock) {
      if (item.stock > 0) {
        // Auto-adjust to max available stock
        newQuantity = item.stock
        errorHandler.info(`تم تعديل الكمية إلى الحد الأقصى المتوفر: ${item.stock}`)
      } else {
        // If no stock available, remove item
        errorHandler.error("هذا المنتج غير متوفر حالياً")
        return removeItem()
      }
    }

    
    if (newQuantity <= 0) {
      return removeItem()
    }
    
    try {
      setIsUpdating(true)
      // Use cart context to update quantity and automatically refresh navbar count
      await updateQuantityContext(item.uid, newQuantity)
      // Only show success message if the quantity actually changed from the original
      if (newQuantity !== originalQuantity) {
        errorHandler.success("تم تحديث الكمية بنجاح")
      }
    } catch (err) {
      console.error("Error updating quantity:", err)
      // Only show error message if it's a real error, not a network issue
      if (err instanceof Error && !err.message.includes('Failed to fetch')) {
        errorHandler.error("حدث خطأ أثناء تحديث الكمية")
      } else {
        // For network issues, just log and don't show error to user
        console.warn("Network issue during quantity update, but operation may have succeeded")
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const removeItem = async () => {
    if (isUpdating) {
      return
    }
    
    if (!session?.user?.accessToken) {
      errorHandler.error("يجب تسجيل الدخول أولاً")
      return
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) {
      console.error("NEXT_PUBLIC_API_URL is not defined")
      errorHandler.error("خطأ في إعدادات التطبيق")
      return
    }
    
    try {
      setIsUpdating(true)
      // Use cart context to remove item and automatically refresh navbar count
      await removeFromCartContext(item.uid)
      errorHandler.success("تم إزالة المنتج بنجاح")
    } catch (err) {
      console.error("Error removing item:", err)
      errorHandler.error("حدث خطأ أثناء إزالة المنتج")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      className={`relative border rounded-lg p-4 transition-opacity duration-300 ${
        isUpdating ? "opacity-50" : "opacity-100"
      } ${
        isOutOfStock ? "border-destructive/30 bg-destructive/5" : ""
      }`}
    >
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <div className="flex items-center gap-4">
        {item.main_image_url && (
          <div className="w-20 h-20 overflow-hidden rounded-lg">
            <img
              src={item.main_image_url}
              alt={item.product_title}
              className="w-full h-full object-cover aspect-[1/0.9]"
            />
          </div>
        )}
        <div className="flex-grow">
          <h3 className="font-semibold">
            {item.product_title}
            {item.variant_choice_value && (
              <span className="ml-1 text-sm text-gray-600">
                ({item.variant_choice_value})
              </span>
            )}
          </h3>
          <p className="text-gray-600">السعر: {item.price} JOD</p>
          <p className={`text-sm ${isOutOfStock ? 'text-destructive' : 'text-gray-500'}`}>
            {isOutOfStock ? 'نفذت الكمية' : `المتوفر: ${item.stock} قطعة`}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuantity(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1 || isOutOfStock}
              className={isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                max={item.stock}
                value={item.quantity}
                onChange={(e) => {
                  const newQty = parseInt(e.target.value) || 1
                  if (newQty !== item.quantity) {
                    updateQuantity(newQty)
                  }
                }}
                disabled={isUpdating || isOutOfStock}
                className={`w-16 text-center text-lg font-semibold border rounded px-2 py-1 ${
                  isOutOfStock ? 'text-destructive bg-gray-100' : ''
                }`}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuantity(item.quantity + 1)}
              disabled={isUpdating || item.quantity >= item.stock || isOutOfStock}
              className={isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="mt-2"
            onClick={removeItem}
            disabled={isUpdating}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            إزالة من السلة
          </Button>
        </div>
      </div>
    </div>
  )
}
