"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { CartItem, CartTotalsResponse } from '@/types/cart'

interface CartContextType {
  cartItems: CartItem[]
  cartTotals: CartTotalsResponse | null
  totalItems: number
  isLoading: boolean
  refreshCart: () => Promise<void>
  addToCart: (productUid: string, quantity: number, variantChoiceId?: string) => Promise<void>
  removeFromCart: (itemUid: string) => Promise<void>
  updateQuantity: (itemUid: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotals, setCartTotals] = useState<CartTotalsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load cart on session change
  useEffect(() => {
    if (session?.user?.accessToken) {
      refreshCart()
    } else {
      setCartItems([])
      setCartTotals(null)
    }
  }, [session?.user?.accessToken])

  const refreshCart = useCallback(async () => {
    if (!session?.user?.accessToken) return

    try {
      setIsLoading(true)
      
      // Load items using Next.js API route
      const res = await fetch('/api/cart')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch cart")
      }
      const data = await res.json()
      const rawItems: CartItem[] = Array.isArray(data) ? data : data.items || []
      setCartItems(rawItems)

      // Load totals using Next.js API route
      const tRes = await fetch('/api/cart/totals')
      if (tRes.ok) {
        setCartTotals(await tRes.json())
      } else {
        console.warn('Failed to fetch cart totals')
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      // Don't throw the error, just log it to prevent breaking the UI
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.accessToken])

  const addToCart = useCallback(async (productUid: string, quantity: number, variantChoiceId?: string) => {
    if (!session?.user?.accessToken) return

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_uid: productUid,
          quantity,
          variant_choice_id: variantChoiceId
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to add to cart")
      }
      
      // Check if the response contains an error even with 200 status
      try {
        const responseData = await res.json()
        if (responseData.error) {
          throw new Error(responseData.error)
        }
      } catch (parseError) {
        // If we can't parse the response, assume it's successful
        console.warn('Could not parse response, assuming success:', parseError)
      }
      
      // If we get here, the item was added successfully
      // Now refresh the cart to show the updated state
      try {
        const cartRes = await fetch('/api/cart')
        if (cartRes.ok) {
          const data = await cartRes.json()
          const rawItems: CartItem[] = Array.isArray(data) ? data : data.items || []
          setCartItems(rawItems)
        }
        
        // Also refresh totals
        const totalsRes = await fetch('/api/cart/totals')
        if (totalsRes.ok) {
          setCartTotals(await totalsRes.json())
        }
      } catch (refreshError) {
        console.warn('Failed to refresh cart after adding item:', refreshError)
        // Try the full refreshCart as fallback
        try {
          await refreshCart()
        } catch (fallbackError) {
          console.warn('Fallback refresh also failed:', fallbackError)
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }, [session?.user?.accessToken, refreshCart])

  const removeFromCart = useCallback(async (itemUid: string) => {
    if (!session?.user?.accessToken) return

    try {
      // Find the cart item to get the product_uid
      const cartItem = cartItems.find(item => item.uid === itemUid)
      if (!cartItem) {
        throw new Error("Cart item not found")
      }

      // Optimistic update - remove item immediately from UI
      setCartItems(prevItems => prevItems.filter(item => item.uid !== itemUid))
      
      const res = await fetch(`/api/cart/${cartItem.product_uid}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        // Revert optimistic update on error
        await refreshCart()
        throw new Error("Failed to remove from cart")
      }
      
      // Refresh totals in background - non-blocking
      fetch('/api/cart/totals')
        .then(tRes => {
          if (tRes.ok) {
            return tRes.json()
          }
        })
        .then(totals => {
          if (totals) {
            setCartTotals(totals)
          }
        })
        .catch(totalsError => {
          console.warn('Failed to refresh totals:', totalsError)
          // Don't throw error for totals refresh failure
        })
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  }, [session?.user?.accessToken, cartItems])

  const updateQuantity = useCallback(async (itemUid: string, quantity: number) => {
    if (!session?.user?.accessToken) return

    // Find the cart item to get the product_uid
    const cartItem = cartItems.find(item => item.uid === itemUid)
    if (!cartItem) {
      throw new Error("Cart item not found")
    }

    // Optimistic update - update UI immediately
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.uid === itemUid 
          ? { ...item, quantity }
          : item
      )
    )
    
    try {
      const res = await fetch(`/api/cart/${cartItem.product_uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          quantity,
          variant_choice_id: cartItem.variant_choice_id 
        })
      })
      
      if (!res.ok) {
        // Revert optimistic update on error
        await refreshCart()
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update quantity")
      }
      
      // Check if the response contains an error even with 200 status
      try {
        const responseData = await res.json()
        if (responseData.error) {
          // Revert optimistic update on error
          await refreshCart()
          throw new Error(responseData.error)
        }
        // Check if item was removed (quantity set to 0)
        if (responseData.message && responseData.message.includes('removed')) {
          // Item was removed, refresh cart to update the list
          await refreshCart()
          return
        }
      } catch (parseError) {
        // If we can't parse the response, assume it's successful
        console.warn('Could not parse response, assuming success:', parseError)
      }
      
      // If we get here, the update was successful
      // Refresh totals in background - this is non-critical
      fetch('/api/cart/totals')
        .then(tRes => {
          if (tRes.ok) {
            return tRes.json()
          }
        })
        .then(totals => {
          if (totals) {
            setCartTotals(totals)
          }
        })
        .catch(totalsError => {
          console.warn('Failed to refresh totals:', totalsError)
        })
        
    } catch (error) {
      console.error('Error updating quantity:', error)
      // Revert optimistic update on error
      await refreshCart()
      throw error
    }
  }, [session?.user?.accessToken, cartItems])

  const clearCart = useCallback(async () => {
    if (!session?.user?.accessToken) return

    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error("Failed to clear cart")
      await refreshCart()
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }, [session?.user?.accessToken, refreshCart])

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const value: CartContextType = {
    cartItems,
    cartTotals,
    totalItems,
    isLoading,
    refreshCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
