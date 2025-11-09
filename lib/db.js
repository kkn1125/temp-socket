const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Vercel 환경에서는 /tmp 디렉토리 사용, 로컬에서는 process.cwd() 사용
const isVercel = process.env.NODE_ENV === "production";
const basePath = isVercel 
  ? "/tmp" 
  : process.cwd();

const dbPath = path.join(basePath, 'data', 'chat.db');
const dataDir = path.dirname(dbPath);

// data 디렉토리가 없으면 생성
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// SQLite 데이터베이스 연결
const db = new Database(dbPath);

// 초기화 함수
async function initializeDB() {
  // Users 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // Rooms 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password TEXT,
      ownerId TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      deletedAt INTEGER,
      FOREIGN KEY (ownerId) REFERENCES users(id)
    )
  `);

  // Participants 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      userId TEXT NOT NULL,
      joinedAt INTEGER NOT NULL,
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(roomId, userId)
    )
  `);

  // Messages 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      nickname TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      isRead INTEGER DEFAULT 0,
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE
    )
  `);

  // 인덱스 생성 (성능 향상)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_roomId ON messages(roomId);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_messages_isRead ON messages(isRead);
    CREATE INDEX IF NOT EXISTS idx_participants_roomId ON participants(roomId);
    CREATE INDEX IF NOT EXISTS idx_participants_userId ON participants(userId);
  `);
}

// User 관련 함수
async function getUser(userId) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(userId);
    
    if (!row) return null;
    
    return {
      id: row.id,
      nickname: row.nickname,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

async function createUser(userId, nickname) {
  try {
    const stmt = db.prepare(`
      INSERT INTO users (id, nickname, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `);
    
    const now = Date.now();
    stmt.run(userId, nickname, now, now);
    
    return {
      id: userId,
      nickname,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function updateUser(userId, nickname) {
  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET nickname = ?, updatedAt = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(nickname, Date.now(), userId);
    
    if (result.changes === 0) return null;
    
    return await getUser(userId);
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

// Room 관련 함수
async function getAllRooms() {
  try {
    const stmt = db.prepare(`
      SELECT 
        r.*,
        COUNT(p.id) as participantCount
      FROM rooms r
      LEFT JOIN participants p ON r.id = p.roomId
      WHERE r.deletedAt IS NULL
      GROUP BY r.id
      ORDER BY r.createdAt DESC
    `);
    const rows = stmt.all();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      password: row.password || undefined,
      ownerId: row.ownerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      participantCount: row.participantCount || 0,
      deletedAt: row.deletedAt || undefined,
    }));
  } catch (error) {
    console.error('Error getting all rooms:', error);
    return [];
  }
}

async function getRoom(roomId) {
  try {
    const stmt = db.prepare(`
      SELECT 
        r.*,
        COUNT(p.id) as participantCount
      FROM rooms r
      LEFT JOIN participants p ON r.id = p.roomId
      WHERE r.id = ? AND r.deletedAt IS NULL
      GROUP BY r.id
    `);
    const row = stmt.get(roomId);
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      password: row.password || undefined,
      ownerId: row.ownerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      participantCount: row.participantCount || 0,
      deletedAt: row.deletedAt || undefined,
    };
  } catch (error) {
    console.error('Error getting room:', error);
    return null;
  }
}

async function createRoom(room) {
  try {
    const stmt = db.prepare(`
      INSERT INTO rooms (id, name, password, ownerId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      room.id,
      room.name,
      room.password || null,
      room.ownerId,
      room.createdAt,
      room.updatedAt
    );
    
    // participantCount는 계산된 값이므로 반환 시 계산
    const createdRoom = await getRoom(room.id);
    return createdRoom || room;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

async function updateRoom(roomId, updates) {
  try {
    const existingRoom = await getRoom(roomId);
    if (!existingRoom) return null;

    const updatedRoom = {
      ...existingRoom,
      ...updates,
      updatedAt: Date.now(),
    };

    const stmt = db.prepare(`
      UPDATE rooms 
      SET name = ?, password = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedRoom.name,
      updatedRoom.password || null,
      updatedRoom.updatedAt,
      roomId
    );

    // participantCount는 계산된 값이므로 다시 조회
    return await getRoom(roomId);
  } catch (error) {
    console.error('Error updating room:', error);
    return null;
  }
}

async function deleteRoom(roomId) {
  try {
    // 소프트 삭제 (deletedAt 설정)
    const stmt = db.prepare('UPDATE rooms SET deletedAt = ? WHERE id = ?');
    const result = stmt.run(Date.now(), roomId);
    
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting room:', error);
    return false;
  }
}

// Participant 관련 함수
async function addParticipant(roomId, userId) {
  try {
    // 이미 참여한 경우 중복 방지
    const existing = db.prepare('SELECT id FROM participants WHERE roomId = ? AND userId = ?').get(roomId, userId);
    if (existing) {
      return false; // 이미 참여 중
    }

    const stmt = db.prepare(`
      INSERT INTO participants (id, roomId, userId, joinedAt)
      VALUES (?, ?, ?, ?)
    `);
    
    const participantId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    stmt.run(participantId, roomId, userId, Date.now());
    
    return true;
  } catch (error) {
    console.error('Error adding participant:', error);
    return false;
  }
}

async function removeParticipant(roomId, userId) {
  try {
    const stmt = db.prepare('DELETE FROM participants WHERE roomId = ? AND userId = ?');
    const result = stmt.run(roomId, userId);
    
    return result.changes > 0;
  } catch (error) {
    console.error('Error removing participant:', error);
    return false;
  }
}

async function getParticipants(roomId) {
  try {
    const stmt = db.prepare(`
      SELECT u.nickname 
      FROM participants p
      JOIN users u ON p.userId = u.id
      WHERE p.roomId = ?
    `);
    const rows = stmt.all(roomId);
    return rows.map(row => row.nickname);
  } catch (error) {
    console.error('Error getting participants:', error);
    return [];
  }
}

// Chat 관련 함수
async function getChatMessages(roomId) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM messages 
      WHERE roomId = ? 
      ORDER BY timestamp ASC
    `);
    const rows = stmt.all(roomId);
    
    return rows.map((row) => ({
      id: row.id,
      roomId: row.roomId,
      nickname: row.nickname,
      message: row.message,
      timestamp: row.timestamp,
      isRead: row.isRead === 1,
    }));
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }
}

async function addChatMessage(message) {
  try {
    const stmt = db.prepare(`
      INSERT INTO messages (id, roomId, nickname, message, timestamp, isRead)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      message.id,
      message.roomId,
      message.nickname,
      message.message,
      message.timestamp,
      message.isRead ? 1 : 0
    );
    
    return message;
  } catch (error) {
    console.error('Error adding chat message:', error);
    throw error;
  }
}

// 읽음 처리 함수
async function markMessagesAsRead(roomId, userId) {
  try {
    // 해당 룸의 메시지 중 사용자가 보낸 메시지가 아닌 것들을 읽음 처리
    const stmt = db.prepare(`
      UPDATE messages 
      SET isRead = 1 
      WHERE roomId = ? AND nickname != ?
    `);
    stmt.run(roomId, userId);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// 읽지 않은 메시지 수 조회
async function getUnreadMessageCount(roomId, userId) {
  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE roomId = ? AND nickname != ? AND isRead = 0
    `);
    const result = stmt.get(roomId, userId);
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}

// 모든 룸의 읽지 않은 메시지 수 조회
async function getUnreadMessageCountsByRooms(userId) {
  try {
    const stmt = db.prepare(`
      SELECT roomId, COUNT(*) as count 
      FROM messages 
      WHERE nickname != ? AND isRead = 0
      GROUP BY roomId
    `);
    const rows = stmt.all(userId);
    
    const counts = {};
    rows.forEach((row) => {
      counts[row.roomId] = row.count;
    });
    
    return counts;
  } catch (error) {
    console.error('Error getting unread message counts:', error);
    return {};
  }
}

module.exports = {
  db,
  getUser,
  createUser,
  updateUser,
  getAllRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  addParticipant,
  removeParticipant,
  getParticipants,
  getChatMessages,
  addChatMessage,
  markMessagesAsRead,
  getUnreadMessageCount,
  getUnreadMessageCountsByRooms,
  initializeDB,
};
