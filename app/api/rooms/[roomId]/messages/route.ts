import { NextRequest, NextResponse } from 'next/server';
import { getChatMessages, addChatMessage } from '@/lib/db';
import { ChatMessage } from '@/types';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
  try {
    const { roomId } = await Promise.resolve(params);
    const body = await request.json();
    const message: ChatMessage = body;

    // roomId 검증
    if (message.roomId !== roomId) {
      return NextResponse.json(
        { error: 'Room ID mismatch' },
        { status: 400 }
      );
    }

    const savedMessage = await addChatMessage(message);
    return NextResponse.json(savedMessage, { status: 201 });
  } catch (error) {
    console.error('Failed to save message:', error);
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    );
  }
}

