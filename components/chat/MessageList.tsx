'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { Card } from '@/components/ui/card';

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>메시지가 없습니다. 첫 메시지를 보내보세요!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2 p-4">
      {messages.map((message) => {
        const isOwnMessage = false; // userId 기반으로 변경 필요 시 추가
        
        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`max-w-[70%] p-3 ${
                isOwnMessage
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {message.nickname}
                  </span>
                  <span
                    className={`text-xs ${
                      isOwnMessage
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p
                  className={`text-sm whitespace-pre-wrap break-words ${
                    isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {message.message}
                </p>
              </div>
            </Card>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

