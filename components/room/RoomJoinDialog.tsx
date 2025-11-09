"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { setRoomSession } from "@/lib/cookies";
import { Room } from "@/types";

interface RoomJoinDialogProps {
  room: Room | null;
  open: boolean;
  onClose: () => void;
}

export function RoomJoinDialog({ room, open, onClose }: RoomJoinDialogProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
    }
  }, [open]);

  const handleJoin = () => {
    if (!room) return;

    // 비밀번호 확인
    if (room.password && password.trim() !== room.password) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 입장 (세션 저장 - 룸 나가도 세션은 유지)
    setRoomSession(room.id, "");
    router.push(`/chat/${room.id}`);
    onClose();
  };

  if (!room) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {room.name}
              {room.password && <Lock className="h-4 w-4" />}
            </DialogTitle>
            <DialogDescription>채팅 룸에 입장합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {room.password && (
              <div className="space-y-2">
                <Label htmlFor="join-password">비밀번호</Label>
                <Input
                  id="join-password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleJoin();
                    }
                  }}
                  autoFocus
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button onClick={handleJoin}>입장</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
