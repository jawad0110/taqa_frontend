"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { errorHandler } from '@/lib/error-handler'
import { Button } from "@/components/ui/button"
import { Loader2, Heart, ArrowLeft } from "lucide-react"
import { userApi } from '@/lib/api'
import Link from 'next/link'
import { ProductDetailModel } from '@/types/product'
import ProductCard from '@/components/ProductCard'

interface WishlistItem {
  uid: string
  product_uid: string
  added_at: string
  product: ProductDetailModel
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())

  // Redirect if unauthenticated, otherwise load wishlist
  useEffect(() => {
    if (status === "unauthenticated") {
      errorHandler.error("يجب عليك تسجيل الدخول لعرض المفضلة", "الرجاء تسجيل الدخول")
      router.push("/login")
    } else if (status === "authenticated") {
      fetchWishlist()
    }
  }, [status])

  // Re-fetch whenever token changes
  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchWishlist()
    }
  }, [session?.user?.accessToken])

  const fetchWishlist = async () => {
    try {
      setIsLoading(true)
      if (!session?.user?.accessToken) throw new Error("No access token")

      const response = await userApi.getWishlist()
      setWishlistItems(response.data)
    } catch (error) {
      console.error("Error fetching wishlist:", error)
      errorHandler.error("فشل في تحميل المفضلة", "خطأ")
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (productUid: string) => {
    try {
      setRemovingItems(prev => new Set(prev).add(productUid))
      await userApi.removeFromWishlist(productUid)
      
      // Remove from local state
      setWishlistItems(prev => prev.filter(item => item.product_uid !== productUid))
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      errorHandler.error("فشل في إزالة المنتج من المفضلة", "خطأ")
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(productUid)
        return newSet
      })
    }
  }


  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">جاري تحميل المفضلة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">قائمة المفضلة</h1>
          </div>
          <p className="text-gray-600 mt-2">
            المنتجات التي أضفتها إلى قائمة المفضلة
          </p>
        </div>

        {/* Content */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              قائمة المفضلة فارغة
            </h3>
            <p className="text-gray-600 mb-6">
              لم تقم بإضافة أي منتجات إلى قائمة المفضلة بعد
            </p>
            <Link href="/products">
              <Button className="bg-primary hover:bg-primary/90">
                تصفح المنتجات
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <ProductCard
                key={item.uid}
                product={item.product}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
