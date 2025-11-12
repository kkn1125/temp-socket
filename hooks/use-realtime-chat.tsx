"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { ChatMessage } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeChatMessage {
  id: string;
  content: string;
  user: {
    name: string;
  };
  createdAt: string;
}

interface UseRealtimeChatOptions {
  roomName: string;
  username: string;
  onMessage?: (messages: RealtimeChatMessage[]) => void;
  initialMessages?: RealtimeChatMessage[];
}

export function useRealtimeChat({
  roomName,
  username,
  onMessage,
  initialMessages = [],
}: UseRealtimeChatOptions) {
  const [messages, setMessages] = useState<RealtimeChatMessage[]>(
    initialMessages
  );
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Supabase ChatMessage를 RealtimeChatMessage로 변환
  const convertToRealtimeMessage = useCallback(
    (msg: ChatMessage): RealtimeChatMessage => {
      return {
        id: msg.id,
        content: msg.message,
        user: {
          name: msg.nickname,
        },
        createdAt: new Date(msg.timestamp).toISOString(),
      };
    },
    []
  );

  // RealtimeChatMessage를 Supabase ChatMessage로 변환
  const convertToChatMessage = useCallback(
    (msg: RealtimeChatMessage, roomId: string): ChatMessage => {
      return {
        id: msg.id,
        roomId,
        nickname: msg.user.name,
        message: msg.content,
        timestamp: new Date(msg.createdAt).getTime(),
        isRead: false,
      };
    },
    []
  );

  useEffect(() => {
    // Supabase Realtime Channel 구독
    const channel = supabase.channel(`chat:${roomName}`, {
      config: {
        broadcast: {
          self: true,
        },
      },
    });

    // Channel 참조 저장
    channelRef.current = channel;

    // 메시지 수신 핸들러
    channel.on("broadcast", { event: "message" }, (payload) => {
      const newMessage = payload.payload as RealtimeChatMessage;
      
      // 중복 메시지 방지
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );
      });
    });

    // Channel 구독
    channel.subscribe((status) => {
      setIsConnected(status === "SUBSCRIBED");
      if (status === "SUBSCRIBED") {
        console.log(`Subscribed to channel: chat:${roomName}`);
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomName]);

  // 메시지 전송
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !isConnected) {
        console.warn("Cannot send message: not connected or empty content");
        return;
      }

      const channel = channelRef.current;
      if (!channel) {
        console.error("Channel not initialized");
        return;
      }

      const newMessage: RealtimeChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        content: content.trim(),
        user: {
          name: username,
        },
        createdAt: new Date().toISOString(),
      };

      // Broadcast로 메시지 전송
      const result = await channel.send({
        type: "broadcast",
        event: "message",
        payload: newMessage,
      });

      if (result === "ok") {
        // 로컬 상태에 즉시 추가 (optimistic update)
        setMessages((prev) => {
          const updated = [...prev, newMessage];
          // onMessage 콜백 호출 (메시지 저장용)
          if (onMessage) {
            onMessage(updated);
          }
          return updated;
        });
      } else {
        console.error("Failed to send message:", result);
      }
    },
    [username, isConnected, onMessage]
  );

  return {
    messages,
    sendMessage,
    isConnected,
  };
}

