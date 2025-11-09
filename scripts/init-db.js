const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Vercel 환경에서는 /tmp 디렉토리 사용, 로컬에서는 process.cwd() 사용
const isVercel = process.env.NODE_ENV === "production";
const basePath = isVercel ? "/tmp" : process.cwd();
console.log("🚀 ~ basePath:", basePath);

const dbPath = path.join(basePath, "data", "chat.db");
const dataDir = path.dirname(dbPath);

// data 디렉토리가 없으면 생성
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("✓ Created data directory");
}

// 기존 데이터베이스 파일이 있는지 확인
const dbExists = fs.existsSync(dbPath);

// SQLite 데이터베이스 연결
const db = new Database(dbPath);

console.log("📦 Initializing SQLite database...");

try {
  // Users 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);
  console.log("✓ Created users table");

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
  console.log("✓ Created rooms table");

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
  console.log("✓ Created participants table");

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
  console.log("✓ Created messages table");

  // 인덱스 생성 (성능 향상)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_roomId ON messages(roomId);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_messages_isRead ON messages(isRead);
    CREATE INDEX IF NOT EXISTS idx_participants_roomId ON participants(roomId);
    CREATE INDEX IF NOT EXISTS idx_participants_userId ON participants(userId);
  `);
  console.log("✓ Created indexes");

  // 기존 데이터 확인
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  const roomCount = db.prepare("SELECT COUNT(*) as count FROM rooms").get();
  const participantCount = db
    .prepare("SELECT COUNT(*) as count FROM participants")
    .get();
  const messageCount = db
    .prepare("SELECT COUNT(*) as count FROM messages")
    .get();

  console.log("\n📊 Database Status:");
  console.log(`   Users: ${userCount.count}`);
  console.log(`   Rooms: ${roomCount.count}`);
  console.log(`   Participants: ${participantCount.count}`);
  console.log(`   Messages: ${messageCount.count}`);

  if (dbExists) {
    console.log("\n✓ Database already exists. Tables initialized.");
  } else {
    console.log("\n✓ New database created and initialized.");
  }

  console.log(`\n✅ Database initialized successfully at: ${dbPath}`);
} catch (error) {
  console.error("❌ Error initializing database:", error);
  process.exit(1);
} finally {
  db.close();
}
