'use client';

import Cookies from 'js-cookie';

const SESSION_COOKIE = 'room_session';
const NICKNAME_COOKIE = 'nickname';
const USER_ID_COOKIE = 'user_id';

export interface RoomSession {
  roomId: string;
  nickname: string;
  joinedAt: number;
}

export function getRoomSession(): RoomSession | null {
  const session = Cookies.get(SESSION_COOKIE);
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export function setRoomSession(roomId: string, nickname: string): void {
  const session: RoomSession = {
    roomId,
    nickname,
    joinedAt: Date.now(),
  };
  Cookies.set(SESSION_COOKIE, JSON.stringify(session), { expires: 365 });
  Cookies.set(NICKNAME_COOKIE, nickname, { expires: 365 });
}

export function clearRoomSession(): void {
  Cookies.remove(SESSION_COOKIE);
}

export function getNickname(): string | null {
  return Cookies.get(NICKNAME_COOKIE) || null;
}

export function setNickname(nickname: string): void {
  Cookies.set(NICKNAME_COOKIE, nickname, { expires: 365 });
}

export function getUserId(): string | null {
  return Cookies.get(USER_ID_COOKIE) || null;
}

export function setUserId(userId: string): void {
  Cookies.set(USER_ID_COOKIE, userId, { expires: 365 });
}

