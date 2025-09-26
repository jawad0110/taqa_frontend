"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { userApi } from '@/lib/api'

interface WishlistContextType {
  wishlistItems: Set<string>
  isInWishlist: (productUid: string) => boolean
  addToWishlist: (productUid: string) => Promise<void>
  removeFromWishlist: (productUid: string) => Promise<void>
  toggleWishlist: (productUid: string) => Promise<void>
  batchCheckWishlist: (productUids: string[]) => Promise<void>
  isLoading: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Load wishlist on session change
  useEffect(() => {
    if (session?.user) {
      loadWishlist()
    } else {
      setWishlistItems(new Set())
    }
  }, [session])

  const loadWishlist = async () => {
    try {
      setIsLoading(true)
      const response = await userApi.getWishlist()
      const productUids = response.data.map((item: any) => item.product_uid)
      setWishlistItems(new Set(productUids))
    } catch (error) {
      console.error('Error loading wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const batchCheckWishlist = useCallback(async (productUids: string[]) => {
    if (!session?.user || productUids.length === 0) return

    try {
      const response = await userApi.batchCheckWishlistStatus(productUids)
      const statusMap = response.data.status_map
      
      setWishlistItems(prev => {
        const newSet = new Set(prev)
        Object.entries(statusMap).forEach(([productUid, isInWishlist]) => {
          if (isInWishlist) {
            newSet.add(productUid)
          } else {
            newSet.delete(productUid)
          }
        })
        return newSet
      })
    } catch (error) {
      console.error('Error batch checking wishlist:', error)
    }
  }, [session])

  const isInWishlist = useCallback((productUid: string) => {
    return wishlistItems.has(productUid)
  }, [wishlistItems])

  const addToWishlist = useCallback(async (productUid: string) => {
    if (!session?.user) return

    try {
      await userApi.addToWishlist(productUid)
      setWishlistItems(prev => new Set(prev).add(productUid))
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      throw error
    }
  }, [session])

  const removeFromWishlist = useCallback(async (productUid: string) => {
    if (!session?.user) return

    try {
      await userApi.removeFromWishlist(productUid)
      setWishlistItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(productUid)
        return newSet
      })
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      throw error
    }
  }, [session])

  const toggleWishlist = useCallback(async (productUid: string) => {
    if (isInWishlist(productUid)) {
      await removeFromWishlist(productUid)
    } else {
      await addToWishlist(productUid)
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist])

  const value: WishlistContextType = {
    wishlistItems,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    batchCheckWishlist,
    isLoading
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
