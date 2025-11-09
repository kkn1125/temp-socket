-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);

-- Rooms 테이블
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL,
  "deletedAt" BIGINT,
  CONSTRAINT fk_owner FOREIGN KEY ("ownerId") REFERENCES users(id)
);

-- Participants 테이블
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" BIGINT NOT NULL,
  CONSTRAINT fk_room FOREIGN KEY ("roomId") REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE("roomId", "userId")
);

-- Messages 테이블
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL,
  nickname TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  CONSTRAINT fk_room FOREIGN KEY ("roomId") REFERENCES rooms(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_messages_roomId ON messages("roomId");
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_isRead ON messages("isRead");
CREATE INDEX IF NOT EXISTS idx_participants_roomId ON participants("roomId");
CREATE INDEX IF NOT EXISTS idx_participants_userId ON participants("userId");

