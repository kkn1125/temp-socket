'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Users, Lock } from 'lucide-react';
import {
  connectSocket,
  joinRoom,
  leaveRoom,
  sendMessage,
  onMessage,
  offMessage,
  onRoomUpdate,
  offRoomUpdate,
} from '@/lib/socket';
import { ChatMessage, Room } from '@/types';
import { getUserId, getRoomSession, setRoomSession } from '@/lib/cookies';

interface ChatRoomProps {
  room: Room;
  initialMessages: ChatMessage[];
}

export function ChatRoom({ room, initialMessages }: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [userId, setUserId] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(room.participantCount);
  const [connected, setConnected] = useState(false);

  // initialMessages가 변경될 때 메시지 업데이트 (새로고침 시)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // 컴포넌트 마운트 시 메시지 다시 가져오기 (새로고침 대응)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/rooms/${room.id}/messages`);
        if (response.ok) {
          const fetchedMessages = await response.json();
          setMessages(fetchedMessages);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [room.id]);

  useEffect(() => {
    const currentUserId = getUserId();
    
    if (!currentUserId) {
      // userId가 없으면 홈으로 리다이렉트 (계정 생성 모달이 표시됨)
      router.push('/');
      return;
    }

    setUserId(currentUserId);
    const session = getRoomSession();

    // 소켓 연결 및 룸 참여
    const initializeSocket = async () => {
      try {
        await connectSocket();
        setConnected(true);
        
        // 세션 확인 - 이미 참여한 상태인지 확인
        const isReconnect = session?.roomId === room.id;
        
        // 룸 참여 (재연결 여부 전달)
        await joinRoom(room.id, currentUserId, isReconnect);

        // 세션 저장 (룸 나가도 세션은 유지)
        if (!session || session.roomId !== room.id) {
          setRoomSession(room.id, '');
        }
      } catch (error) {
        console.error('Failed to connect socket:', error);
      }
    };

    initializeSocket();

    // 메시지 수신 핸들러
    const handleMessage = (message: ChatMessage) => {
      if (message.roomId === room.id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    // 룸 업데이트 핸들러
    const handleRoomUpdate = (data: { roomId: string; participantCount: number }) => {
      if (data.roomId === room.id) {
        setParticipantCount(data.participantCount);
      }
    };

    onMessage(handleMessage);
    onRoomUpdate(handleRoomUpdate);

    // 정리
    return () => {
      offMessage(handleMessage);
      offRoomUpdate(handleRoomUpdate);
      // leaveRoom은 명시적으로 나가기 버튼을 클릭할 때만 호출
      // cleanup에서는 소켓 연결을 유지 (세션이 남아있어야 하므로)
    };
  }, [room.id]);

  const handleSendMessage = async (message: string) => {
    if (userId && message.trim()) {
      await sendMessage(room.id, userId, message);
    }
  };

  const handleLeave = async () => {
    await leaveRoom(room.id);
    // 세션은 유지 (쿠키에 저장되어 있음)
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
                  {connected && (
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
        <MessageInput onSend={handleSendMessage} disabled={!connected || !userId} />
      </div>
    </>
  );
}

