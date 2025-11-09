'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditRoomDialog } from './EditRoomDialog';
import { CreateRoomDialog } from './CreateRoomDialog';
import { RoomJoinDialog } from './RoomJoinDialog';
import { Room } from '@/types';
import { Lock, Users, Search } from 'lucide-react';
import { getUserId } from '@/lib/cookies';

export function RoomList() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchUnreadCounts();
    
    // 주기적으로 읽지 않은 메시지 수 업데이트
    const interval = setInterval(() => {
      fetchUnreadCounts();
    }, 5000); // 5초마다 업데이트
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const response = await fetch('/api/rooms/unread');
      if (response.ok) {
        const counts = await response.json();
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('정말 이 룸을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRooms();
      } else {
        alert('룸 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete room:', error);
      alert('룸 삭제에 실패했습니다.');
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">채팅 룸 목록</h1>
        <CreateRoomDialog onSuccess={fetchRooms} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="룸 이름으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다.' : '생성된 룸이 없습니다.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {room.name}
                    {room.password && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    {unreadCounts[room.id] > 0 && (
                      <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
                      </span>
                    )}
                  </CardTitle>
                </div>
                <CardDescription>
                  생성일: {new Date(room.createdAt).toLocaleDateString('ko-KR')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>참여자: {room.participantCount}명</span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedRoom(room);
                    setJoinDialogOpen(true);
                  }}
                  className="flex-1"
                >
                  입장
                </Button>
                {getUserId() === room.ownerId && (
                  <EditRoomDialog room={room} onSuccess={fetchRooms} />
                )}
                {getUserId() === room.ownerId && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(room.id)}
                  >
                    삭제
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <RoomJoinDialog
        room={selectedRoom}
        open={joinDialogOpen}
        onClose={() => {
          setJoinDialogOpen(false);
          setSelectedRoom(null);
        }}
      />
    </div>
  );
}

