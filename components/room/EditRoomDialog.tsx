'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { Room } from '@/types';

interface EditRoomDialogProps {
  room: Room;
  onSuccess: () => void;
}

export function EditRoomDialog({ room, onSuccess }: EditRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(room.name);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(room.name);
      setPassword('');
      setError('');
    }
  }, [open, room]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updates: { name?: string; password?: string } = {};
      if (name.trim() !== room.name) {
        updates.name = name.trim();
      }
      if (password.trim() !== '') {
        updates.password = password.trim();
      }

      if (Object.keys(updates).length === 0) {
        setOpen(false);
        return;
      }

      const response = await fetch(`/api/rooms/${room.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '룸 수정에 실패했습니다.');
      }

      setOpen(false);
      setPassword('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '룸 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          수정
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>룸 수정</DialogTitle>
          <DialogDescription>
            룸 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">룸 이름</Label>
            <Input
              id="edit-name"
              type="text"
              placeholder="룸 이름을 입력하세요"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              required
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-password">비밀번호 변경 (선택사항)</Label>
            <Input
              id="edit-password"
              type="password"
              placeholder="새 비밀번호를 입력하세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              비밀번호를 변경하려면 새 비밀번호를 입력하세요.
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '수정 중...' : '수정'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

