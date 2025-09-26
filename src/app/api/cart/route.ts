import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { product_uid, quantity, variant_choice_id } = await request.json()

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
      product_uid,
      quantity,
      variant_choice_id
    }, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error("Cart POST error:", error)
    return NextResponse.json(
      { error: error.response?.data?.message || "Failed to add item to cart" },
      { status: error.response?.status || 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error("Cart GET error:", error)
    return NextResponse.json(
      { error: error.response?.data?.message || "Failed to fetch cart" },
      { status: error.response?.status || 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`
      }
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error("Cart DELETE error:", error)
    return NextResponse.json(
      { error: error.response?.data?.message || "Failed to clear cart" },
      { status: error.response?.status || 500 }
    )
  }
}
