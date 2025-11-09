"use client";

import { io, Socket } from "socket.io-client";
import { ChatMessage } from "@/types";

let socket: Socket | null = null;
let connectionPromise: Promise<Socket> | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Promise<Socket> {
  if (socket?.connected) {
    return Promise.resolve(socket);
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise((resolve, reject) => {
    if (socket?.connected) {
      resolve(socket);
      connectionPromise = null;
      return;
    }

    // 프로덕션 환경에서 Socket.io 서버 URL 사용
    // Vercel 배포 시 별도 서버(Railway, Render 등)에서 Socket.io 서버를 실행해야 함
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NODE_ENV === "production"
        ? typeof window !== "undefined"
          ? window.location.origin
          : ""
        : "http://localhost:3000");

    if (!socketUrl) {
      console.error(
        "Socket.io URL is not configured. Please set NEXT_PUBLIC_SOCKET_URL environment variable."
      );
      reject(new Error("Socket.io URL is not configured"));
      return;
    }

    socket = io(socketUrl, {
      transports: ["websocket", "polling"], // polling fallback 추가
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
    });

    socket.on("connect", () => {
      resolve(socket!);
      connectionPromise = null;
    });

    socket.on("connect_error", (error) => {
      connectionPromise = null;
      reject(error);
    });
  });

  return connectionPromise;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionPromise = null;
  }
}

export async function joinRoom(
  roomId: string,
  userId: string,
  isReconnect: boolean = false
): Promise<void> {
  const sock = await connectSocket();
  if (sock && sock.connected) {
    sock.emit("join-room", { roomId, userId, isReconnect });
  }
}

export async function leaveRoom(roomId: string): Promise<void> {
  if (socket && socket.connected) {
    socket.emit("leave-room", { roomId });
  }
}

export async function sendMessage(
  roomId: string,
  userId: string,
  message: string
): Promise<void> {
  const sock = await connectSocket();
  if (sock && sock.connected) {
    sock.emit("send-message", { roomId, userId, message });
  }
}

export function onMessage(callback: (message: ChatMessage) => void): void {
  if (socket) {
    socket.on("receive-message", callback);
  } else {
    // 소켓이 아직 연결되지 않았으면 연결 후 등록
    connectSocket().then((sock) => {
      sock.on("receive-message", callback);
    });
  }
}

export function offMessage(callback: (message: ChatMessage) => void): void {
  if (socket) {
    socket.off("receive-message", callback);
  }
}

export function onRoomUpdate(
  callback: (data: { roomId: string; participantCount: number }) => void
): void {
  if (socket) {
    socket.on("room-update", callback);
  } else {
    // 소켓이 아직 연결되지 않았으면 연결 후 등록
    connectSocket().then((sock) => {
      sock.on("room-update", callback);
    });
  }
}

export function offRoomUpdate(
  callback: (data: { roomId: string; participantCount: number }) => void
): void {
  if (socket) {
    socket.off("room-update", callback);
  }
}

export function onConnect(callback: () => void): void {
  if (socket?.connected) {
    callback();
  } else {
    connectSocket().then(() => {
      callback();
    });
  }
}
