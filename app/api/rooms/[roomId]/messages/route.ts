import { NextRequest, NextResponse } from 'next/server';
import { getChatMessages } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
  try {
    const { roomId } = await Promise.resolve(params);
    const messages = await getChatMessages(roomId);
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

