const dotenv = require("dotenv");
dotenv.config();

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
console.log("🚀 ~ supabaseUrl:", supabaseUrl)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log("🚀 ~ supabaseServiceRoleKey:", supabaseServiceRoleKey)

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

// 서버 사이드용 (service role key - 모든 권한)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 초기화 함수 (Supabase는 테이블을 수동으로 생성해야 함)
async function initializeDB() {
  console.log("Supabase database initialized");
}

// User 관련 함수
async function getUser(userId) {
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

async function createUser(userId, nickname) {
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

async function updateUser(userId, nickname) {
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
async function getAllRooms() {
  try {
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("*")
      .is("deletedAt", null)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error getting all rooms:", error);
      return [];
    }

    // 각 룸의 participantCount 계산
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const { count } = await supabase
          .from("participants")
          .select("*", { count: "exact", head: true })
          .eq("roomId", room.id);

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
      })
    );

    return roomsWithCounts;
  } catch (error) {
    console.error("Error getting all rooms:", error);
    return [];
  }
}

async function getRoom(roomId) {
  try {
    const { data: room, error } = await supabase
      .from("rooms")
      .select("*")
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

async function createRoom(room) {
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

async function updateRoom(roomId, updates) {
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

async function deleteRoom(roomId) {
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
async function addParticipant(roomId, userId) {
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

async function removeParticipant(roomId, userId) {
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

async function getParticipants(roomId) {
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
      .map((p) => p.users?.nickname)
      .filter((nickname) => nickname);
  } catch (error) {
    console.error("Error getting participants:", error);
    return [];
  }
}

// Chat 관련 함수
async function getChatMessages(roomId) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("roomId", roomId)
      .order("timestamp", { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
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

async function addChatMessage(message) {
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
async function markMessagesAsRead(roomId, userNickname) {
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
async function getUnreadMessageCount(roomId, userId) {
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

async function getUserById(userId) {
  return await getUser(userId);
}

// 모든 룸의 읽지 않은 메시지 수 조회
async function getUnreadMessageCountsByRooms(userId) {
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

    const counts = {};
    data.forEach((row) => {
      counts[row.roomId] = (counts[row.roomId] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error("Error getting unread message counts:", error);
    return {};
  }
}

module.exports = {
  getUser,
  createUser,
  updateUser,
  getAllRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  addParticipant,
  removeParticipant,
  getParticipants,
  getChatMessages,
  addChatMessage,
  markMessagesAsRead,
  getUnreadMessageCount,
  getUnreadMessageCountsByRooms,
  getUserById,
  initializeDB,
};
