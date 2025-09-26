// CartPage.tsx
"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { errorHandler } from '@/lib/error-handler'
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  CartItem,
  CartTotalsResponse,
  Product,
  VariantGroup,
  VariantChoice
} from "@/types/cart"
import { Truck, Package, TrendingUp } from "lucide-react"
import { CartProductCard } from "@/components/CartProductCard"
import { useCart } from '@/contexts/CartContext'

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { cartItems, cartTotals, isLoading, refreshCart, clearCart: clearCartContext } = useCart()

  const [isLoadingLocal, setIsLoadingLocal] = useState(false)

  // Redirect if unauthenticated, cart context will handle loading
  useEffect(() => {
    if (status === "unauthenticated") {
      errorHandler.error("يجب عليك تسجيل الدخول لعرض السلة", "الرجاء تسجيل الدخول")
      router.push("/login")
    }
  }, [status])

  const clearCart = async () => {
    try {
      setIsLoadingLocal(true)
      await clearCartContext()
    } catch (err) {
      console.error(err)
      errorHandler.error("حدث خطأ أثناء مسح السلة", "خطأ")
    } finally {
      setIsLoadingLocal(false)
    }
  }

  const checkout = () => {
    // Navigate to the checkout page
    router.push('/checkout');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">سلة التسوق</h1>

      {isLoading || isLoadingLocal ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">السلة فارغة</p>
          <Button onClick={() => router.push("/products")} className="mt-4">
            تصفح المنتجات
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">المنتجات</h2>
              <Button variant="destructive" onClick={clearCart}>
                مسح السلة
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {cartItems.map(item => (
                <CartProductCard
                  key={item.uid}
                  item={item}
                  userUid={session?.user?.uid || ""}
                />
              ))}
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span>المجموع الفرعي</span>
              </div>
              <p className="font-semibold">{cartTotals?.subtotal} JOD</p>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-500" />
                <span>رسوم الشحن</span>
              </div>
              <p className="font-semibold">{cartTotals?.shipping} JOD</p>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span>الضريبة</span>
              </div>
              <p className="font-semibold">{cartTotals?.tax} JOD</p>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <h3 className="font-semibold">المجموع الكلي</h3>
              <p className="text-xl font-bold">{cartTotals?.total} JOD</p>
            </div>
            <Button
              className="mt-4 w-full bg-[#1b263b] hover:bg-[#161f30]"
              onClick={checkout}
            >
              استكمال عملية الشراء
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
