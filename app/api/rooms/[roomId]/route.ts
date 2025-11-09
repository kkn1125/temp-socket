import { NextRequest, NextResponse } from 'next/server';
import {
  getRoom,
  updateRoom,
  deleteRoom,
} from '@/lib/db';
import { UpdateRoomData } from '@/types';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
  try {
    const { roomId } = await Promise.resolve(params);
    const room = await getRoom(roomId);
    
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
  try {
    const { roomId } = await Promise.resolve(params);
    const body: UpdateRoomData = await request.json();
    const { name, password } = body;

    // 소유권 확인
    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (room.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Only room owner can update the room' },
        { status: 403 }
      );
    }

    const updates: Partial<UpdateRoomData> = {};
    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json(
          { error: 'Room name cannot be empty' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }
    if (password !== undefined) {
      updates.password = password && password.trim() !== '' ? password.trim() : undefined;
    }

    const updatedRoom = await updateRoom(roomId, updates);
    
    if (!updatedRoom) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRoom);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
  try {
    const { roomId } = await Promise.resolve(params);
    const room = await getRoom(roomId);
    
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // 소유권 확인
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (room.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Only room owner can delete the room' },
        { status: 403 }
      );
    }

    await deleteRoom(roomId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}

