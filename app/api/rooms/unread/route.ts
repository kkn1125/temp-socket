import { NextRequest, NextResponse } from 'next/server';
import { getUnreadMessageCountsByRooms } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({}, { status: 200 });
    }

    const counts = await getUnreadMessageCountsByRooms(userId);
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error getting unread message counts:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

