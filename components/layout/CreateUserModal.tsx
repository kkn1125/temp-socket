'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { setUserId } from '@/lib/cookies';
import { useUser } from '@/contexts/UserContext';

interface CreateUserModalProps {
  open: boolean;
  onClose?: () => void;
}

export function CreateUserModal({ open, onClose }: CreateUserModalProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.trim().length > 20) {
      setError('닉네임은 20자 이하로 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(data.user.id);
        setNickname('');
        setError('');
        // 전역 상태 업데이트
        await refreshUser();
        if (onClose) {
          onClose();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || '계정 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      setError('계정 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>계정 생성</DialogTitle>
          <DialogDescription>
            채팅에 사용할 닉네임을 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              maxLength={20}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '생성 중...' : '확인'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

