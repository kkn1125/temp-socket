import { Room, ChatMessage, User } from "@/types";
import { supabase } from "./supabase";

// 초기화 함수 (Supabase는 테이블을 수동으로 생성해야 함)
export async function initializeDB(): Promise<void> {
  // Supabase에서는 SQL Editor에서 테이블을 생성해야 함
  // 이 함수는 호환성을 위해 유지
  console.log("Supabase database initialized");
}

// User 관련 함수
export async function getUser(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      nickname: data.nickname,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function createUser(
  userId: string,
  nickname: string
): Promise<User> {
  try {
    const now = Date.now();
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        nickname,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nickname: data.nickname,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUser(
  userId: string,
  nickname: string
): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        nickname,
        updatedAt: Date.now(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      nickname: data.nickname,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
}

// Room 관련 함수
export async function getAllRooms(): Promise<Room[]> {
  try {
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select(`
        *,
        participants(count)
      `)
      .is("deletedAt", null)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error getting all rooms:", error);
      return [];
    }

    return rooms.map((room: any) => ({
      id: room.id,
      name: room.name,
      password: room.password || undefined,
      ownerId: room.ownerId,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      participantCount: room.participants?.[0]?.count || 0,
      deletedAt: room.deletedAt || undefined,
    }));
  } catch (error) {
    console.error("Error getting all rooms:", error);
    return [];
  }
}

export async function getRoom(roomId: string): Promise<Room | null> {
  try {
    const { data: room, error } = await supabase
      .from("rooms")
      .select(`
        *,
        participants(count)
      `)
      .eq("id", roomId)
      .is("deletedAt", null)
      .single();

    if (error || !room) return null;

    // participantCount 계산
    const { count } = await supabase
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("roomId", roomId);

    return {
      id: room.id,
      name: room.name,
      password: room.password || undefined,
      ownerId: room.ownerId,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      participantCount: count || 0,
      deletedAt: room.deletedAt || undefined,
    };
  } catch (error) {
    console.error("Error getting room:", error);
    return null;
  }
}

export async function createRoom(room: Room): Promise<Room> {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        id: room.id,
        name: room.name,
        password: room.password || null,
        ownerId: room.ownerId,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      })
      .select()
      .single();

    if (error) throw error;

    // participantCount는 계산된 값이므로 반환 시 계산
    const createdRoom = await getRoom(room.id);
    return createdRoom || room;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
}

export async function updateRoom(
  roomId: string,
  updates: Partial<Room>
): Promise<Room | null> {
  try {
    const existingRoom = await getRoom(roomId);
    if (!existingRoom) return null;

    const updatedRoom = {
      ...existingRoom,
      ...updates,
      updatedAt: Date.now(),
    };

    const { error } = await supabase
      .from("rooms")
      .update({
        name: updatedRoom.name,
        password: updatedRoom.password || null,
        updatedAt: updatedRoom.updatedAt,
      })
      .eq("id", roomId);

    if (error) throw error;

    // participantCount는 계산된 값이므로 다시 조회
    return await getRoom(roomId);
  } catch (error) {
    console.error("Error updating room:", error);
    return null;
  }
}

export async function deleteRoom(roomId: string): Promise<boolean> {
  try {
    // 소프트 삭제 (deletedAt 설정)
    const { error } = await supabase
      .from("rooms")
      .update({ deletedAt: Date.now() })
      .eq("id", roomId);

    return !error;
  } catch (error) {
    console.error("Error deleting room:", error);
    return false;
  }
}

// Participant 관련 함수
export async function addParticipant(
  roomId: string,
  userId: string
): Promise<boolean> {
  try {
    // 이미 참여한 경우 중복 방지
    const { data: existing } = await supabase
      .from("participants")
      .select("id")
      .eq("roomId", roomId)
      .eq("userId", userId)
      .single();

    if (existing) {
      return false; // 이미 참여 중
    }

    const participantId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const { error } = await supabase.from("participants").insert({
      id: participantId,
      roomId,
      userId,
      joinedAt: Date.now(),
    });

    return !error;
  } catch (error) {
    console.error("Error adding participant:", error);
    return false;
  }
}

export async function removeParticipant(
  roomId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("participants")
      .delete()
      .eq("roomId", roomId)
      .eq("userId", userId);

    return !error;
  } catch (error) {
    console.error("Error removing participant:", error);
    return false;
  }
}

export async function getParticipants(roomId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("participants")
      .select(`
        userId,
        users(nickname)
      `)
      .eq("roomId", roomId);

    if (error || !data) return [];

    return data
      .map((p: any) => p.users?.nickname)
      .filter((nickname: string) => nickname);
  } catch (error) {
    console.error("Error getting participants:", error);
    return [];
  }
}

// Chat 관련 함수
export async function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("roomId", roomId)
      .order("timestamp", { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      roomId: row.roomId,
      nickname: row.nickname,
      message: row.message,
      timestamp: row.timestamp,
      isRead: row.isRead === true || row.isRead === 1,
    }));
  } catch (error) {
    console.error("Error getting chat messages:", error);
    return [];
  }
}

export async function addChatMessage(
  message: ChatMessage
): Promise<ChatMessage> {
  try {
    const { error } = await supabase.from("messages").insert({
      id: message.id,
      roomId: message.roomId,
      nickname: message.nickname,
      message: message.message,
      timestamp: message.timestamp,
      isRead: message.isRead,
    });

    if (error) throw error;

    return message;
  } catch (error) {
    console.error("Error adding chat message:", error);
    throw error;
  }
}

// 읽음 처리 함수
export async function markMessagesAsRead(
  roomId: string,
  userNickname: string
): Promise<void> {
  try {
    // 해당 룸의 메시지 중 사용자가 보낸 메시지가 아닌 것들을 읽음 처리
    const { error } = await supabase
      .from("messages")
      .update({ isRead: true })
      .eq("roomId", roomId)
      .neq("nickname", userNickname);

    if (error) throw error;
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

// 읽지 않은 메시지 수 조회
export async function getUnreadMessageCount(
  roomId: string,
  userId: string
): Promise<number> {
  try {
    const user = await getUser(userId);
    if (!user) return 0;

    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("roomId", roomId)
      .neq("nickname", user.nickname)
      .eq("isRead", false);

    if (error) return 0;
    return count || 0;
  } catch (error) {
    console.error("Error getting unread message count:", error);
    return 0;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  return await getUser(userId);
}

// 모든 룸의 읽지 않은 메시지 수 조회
export async function getUnreadMessageCountsByRooms(
  userId: string
): Promise<Record<string, number>> {
  const user = await getUser(userId);
  if (!user) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("roomId")
      .neq("nickname", user.nickname)
      .eq("isRead", false);

    if (error || !data) return {};

    const counts: Record<string, number> = {};
    data.forEach((row: any) => {
      counts[row.roomId] = (counts[row.roomId] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error("Error getting unread message counts:", error);
    return {};
  }
}
