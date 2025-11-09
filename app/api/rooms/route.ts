import { createRoom, getAllRooms } from "@/lib/db";
import { CreateRoomData, Room } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const rooms = await getAllRooms();
    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRoomData = await request.json();
    const { name, password } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // userId 가져오기 (쿠키에서)
    const cookieStore = await cookies();
    let userId = cookieStore.get('user_id')?.value;
    
    // userId가 없으면 생성
    if (!userId) {
      userId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const room: Room = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      password:
        password && password.trim() !== "" ? password.trim() : undefined,
      ownerId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      participantCount: 0, // 계산된 값
    };

    const createdRoom = await createRoom(room);
    
    // userId를 쿠키에 저장
    const response = NextResponse.json(createdRoom, { status: 201 });
    response.cookies.set('user_id', userId, { expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) });
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
