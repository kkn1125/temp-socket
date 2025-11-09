"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setNickname, getNickname } from "@/lib/cookies";

interface NicknameModalProps {
  open: boolean;
  onClose: (nickname: string) => void;
  initialNickname?: string;
}

export function NicknameModal({
  open,
  onClose,
  initialNickname,
}: NicknameModalProps) {
  const [nickname, setNicknameValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (initialNickname) {
        setNicknameValue(initialNickname);
      } else {
        const savedNickname = getNickname();
        if (savedNickname) {
          setNicknameValue(savedNickname);
        }
      }
    }
  }, [open, initialNickname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    if (nickname.trim().length > 20) {
      setError("닉네임은 20자 이하로 입력해주세요.");
      return;
    }

    // setNickname은 더 이상 사용하지 않음 (user 기반으로 변경)
    onClose(nickname.trim());
    setError("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose(initialNickname ?? ""); // 닫을 때도 콜백 호출 (빈 문자열/기존 닉네임 전달)
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>닉네임 설정</DialogTitle>
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
                setNicknameValue(e.target.value);
                setError("");
              }}
              maxLength={20}
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button type="submit" className="w-full">
            확인
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
