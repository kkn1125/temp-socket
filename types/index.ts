export interface Room {
  id: string;
  name: string;
  password?: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  participantCount: number; // 계산된 값 (participants 테이블에서 COUNT)
  deletedAt?: number;
}

export interface User {
  id: string;
  nickname: string;
  createdAt: number;
  updatedAt: number;
}

export interface Participant {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  nickname: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}

export interface RoomSession {
  roomId: string;
  nickname: string;
  joinedAt: number;
}

export interface CreateRoomData {
  name: string;
  password?: string;
}

export interface UpdateRoomData {
  name?: string;
  password?: string;
}

export interface JoinRoomData {
  roomId: string;
  password?: string;
  nickname: string;
}
