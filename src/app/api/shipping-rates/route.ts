import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import auth from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch shipping rates from the backend using the new grouped endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipping/rates`, {
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch shipping rates' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
