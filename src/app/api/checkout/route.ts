import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import axios from "axios"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.accessToken) {
      console.error('No access token found in session')
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get request body
    const requestBody = await request.json()
    
    const { shipping_address, coupon_code, shipping_rate_uid } = requestBody

    // Log the shipping rate UID for debugging

    // Validate required shipping address fields
    const requiredFields = ['full_name', 'phone_number', 'country', 'city', 'area', 'street']
    const missingFields = requiredFields.filter(field => !shipping_address[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: "Shipping information incomplete", detail: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Prepare order data for backend
    const orderData = {
      shipping_address: {
        full_name: shipping_address.full_name,
        phone_number: shipping_address.phone_number,
        country: shipping_address.country,
        city: shipping_address.city,
        area: shipping_address.area,
        street: shipping_address.street,
        building_number: shipping_address.building_number || '',
        apartment_number: shipping_address.apartment_number || '',
        zip_code: shipping_address.zip_code || '',
        notes: shipping_address.notes || ''
      },
      coupon_code: coupon_code || undefined,
      shipping_rate_uid: shipping_rate_uid || undefined
    }



    try {
      // Create a request interceptor
      const requestInterceptor = axios.interceptors.request.use(request => {
        return request;
      });

      // Create a response interceptor
      const responseInterceptor = axios.interceptors.response.use(
        response => response,
        error => {
          return Promise.reject(error);
        }
      );

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/checkouts/`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.accessToken}`,
            'X-Request-From': 'taqa-frontend',
            'X-Debug': 'true'  // Add debug header
          },
          timeout: 15000,
          validateStatus: () => true
        }
      );

      // Remove interceptors
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);



      if (response.status < 200 || response.status >= 300) {
        const errorMessage = response.data?.detail || 
                           response.data?.message || 
                           response.statusText ||
                           'فشل في إتمام الطلب';
        
        console.error('Backend error:', {
          status: response.status,
          message: errorMessage,
          data: response.data
        });

        return NextResponse.json({
          error: errorMessage,
          details: response.data,
          status: response.status
        }, { status: response.status });
      }

      return NextResponse.json(response.data);
    } catch (error) {
      console.error('Error calling backend API:', error)
      
      if (axios.isAxiosError(error)) {
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        }
        
        console.error('Axios error details:', JSON.stringify(errorDetails, null, 2))
        
        return NextResponse.json(
          { 
            error: 'Failed to place order',
            details: error.response?.data || { message: error.message }
          },
          { status: error.response?.status || 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'An unexpected error occurred while placing the order' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Unexpected error in checkout API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  })
}
