import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import axios from "axios";

// ✅ Correct handler signature for dynamic routes in Next.js 15
export async function DELETE(
  request: NextRequest,
  context: { params: { itemId: string } }
) {
  const { itemId } = context.params;

  try {
    const session = await auth();
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/cart/${itemId}`,
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Cart item DELETE error:", error);
    return NextResponse.json(
      {
        error:
          error.response?.data?.message || "Failed to remove item from cart",
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { itemId: string } }
) {
  const { itemId } = context.params;

  try {
    const session = await auth();
    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { quantity, variant_choice_id } = await request.json();

    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_API_URL}/cart/${itemId}`,
      { quantity, variant_choice_id },
      {
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Cart item PATCH error:", error);
    return NextResponse.json(
      {
        error:
          error.response?.data?.message || "Failed to update cart item",
      },
      { status: error.response?.status || 500 }
    );
  }
}
