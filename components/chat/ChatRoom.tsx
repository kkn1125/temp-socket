'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Users, Lock } from 'lucide-react';
import { useRealtimeChat, RealtimeChatMessage } from '@/hooks/use-realtime-chat';
import { ChatMessage, Room } from '@/types';
import { getUserId, getRoomSession, setRoomSession } from '@/lib/cookies';
import { useUser } from '@/contexts/UserContext';

interface ChatRoomProps {
  room: Room;
  initialMessages: ChatMessage[];
}

export function ChatRoom({ room, initialMessages }: ChatRoomProps) {
  const router = useRouter();
  const { user } = useUser();
  const [participantCount, setParticipantCount] = useState(room.participantCount);
  const userId = getUserId();

  // 초기 메시지를 RealtimeChatMessage 형식으로 변환
  const initialRealtimeMessages = useMemo<RealtimeChatMessage[]>(() => {
    return initialMessages.map((msg) => ({
      id: msg.id,
      content: msg.message,
      user: {
        name: msg.nickname,
      },
      createdAt: new Date(msg.timestamp).toISOString(),
    }));
  }, [initialMessages]);

  // 메시지 저장 핸들러
  const handleMessage = async (messages: RealtimeChatMessage[]) => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    
    // Supabase에 메시지 저장
    try {
      const chatMessage: ChatMessage = {
        id: latestMessage.id,
        roomId: room.id,
        nickname: latestMessage.user.name,
        message: latestMessage.content,
        timestamp: new Date(latestMessage.createdAt).getTime(),
        isRead: false,
      };

      await fetch(`/api/rooms/${room.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatMessage),
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  // Realtime Chat hook 사용
  const { messages: realtimeMessages, sendMessage, isConnected } = useRealtimeChat({
    roomName: room.id,
    username: user?.nickname || '익명',
    onMessage: handleMessage,
    initialMessages: initialRealtimeMessages,
  });

  // RealtimeChatMessage를 ChatMessage로 변환
  const messages = useMemo<ChatMessage[]>(() => {
    return realtimeMessages.map((msg) => ({
      id: msg.id,
      roomId: room.id,
      nickname: msg.user.name,
      message: msg.content,
      timestamp: new Date(msg.createdAt).getTime(),
      isRead: false,
    }));
  }, [realtimeMessages, room.id]);

  useEffect(() => {
    if (!userId) {
      router.push('/');
      return;
    }

    const session = getRoomSession();
    
    // 세션 저장 (룸 나가도 세션은 유지)
    if (!session || session.roomId !== room.id) {
      setRoomSession(room.id, '');
    }
  }, [room.id, userId, router]);

  // 참여자 수 업데이트 (주기적으로 또는 필요시)
  useEffect(() => {
    const fetchParticipantCount = async () => {
      try {
        const response = await fetch(`/api/rooms/${room.id}`);
        if (response.ok) {
          const data = await response.json();
          setParticipantCount(data.room.participantCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch participant count:', error);
      }
    };

    fetchParticipantCount();
    const interval = setInterval(fetchParticipantCount, 10000); // 10초마다 업데이트

    return () => clearInterval(interval);
  }, [room.id]);

  const handleSendMessage = async (message: string) => {
    if (message.trim()) {
      await sendMessage(message);
    }
  };

  const handleLeave = () => {
    router.push('/rooms');
  };

  return (
    <>
      <div className="flex flex-col h-screen">
        {/* 헤더 */}
        <Card className="p-4 rounded-none border-x-0 border-t-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleLeave}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                나가기
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {room.name}
                  {room.password && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>참여자: {participantCount}명</span>
                  {isConnected && (
                    <span className="text-green-500">● 연결됨</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 메시지 리스트 */}
        <div className="flex-1 overflow-hidden">
          <MessageList messages={messages} />
        </div>

        {/* 메시지 입력 */}
        <MessageInput onSend={handleSendMessage} disabled={!isConnected || !userId} />
      </div>
    </>
  );
}

