import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import axios from "axios"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Fetch cart items first to calculate totals
    const cartResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })

    const cartItems = cartResponse.data || []
    
    // Calculate totals
    let subtotal = 0
    
    // Sum up the price of all items in the cart
    if (Array.isArray(cartItems)) {
      subtotal = cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    }

    // For now, we'll calculate totals on the frontend
    // In the future, you might want to move this to the backend
    const totals = {
      subtotal: subtotal,
      discount: 0, // This would come from applied coupons
      shipping: 0, // This would be set when a shipping option is selected
      total: subtotal // subtotal - discount + shipping
    }

    return NextResponse.json(totals)
  } catch (error: any) {
    console.error("Cart totals GET error:", error)
    return NextResponse.json(
      { error: error.response?.data?.message || "Failed to calculate cart totals" },
      { status: error.response?.status || 500 }
    )
  }
}
