'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NicknameModal } from '@/components/room/NicknameModal';
import { useUser } from '@/contexts/UserContext';
import { Pencil } from 'lucide-react';

export function Header() {
  const { user, refreshUser } = useUser();
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const handleNicknameUpdate = async (nickname: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      });

      if (response.ok) {
        // 전역 상태 업데이트
        await refreshUser();
        setShowNicknameModal(false);
      }
    } catch (error) {
      console.error('Failed to update nickname:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <header className="border-b p-4">
        <div className="container mx-auto flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNicknameModal(true)}
            className="flex items-center gap-2"
          >
            <span>{user.nickname}님</span>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {showNicknameModal && (
        <NicknameModal
          open={showNicknameModal}
          onClose={handleNicknameUpdate}
          initialNickname={user.nickname}
        />
      )}
    </>
  );
}

