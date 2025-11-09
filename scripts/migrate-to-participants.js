const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const isVercel = process.env.NODE_ENV === "production";
const basePath = isVercel 
  ? "/tmp" 
  : process.cwd();

const dbPath = path.join(basePath, 'data', 'chat.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database file not found. Please run npm run db:init first.');
  process.exit(1);
}

const db = new Database(dbPath);

console.log('🔄 Migrating to participants table...');

try {
  // Participants 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      nickname TEXT NOT NULL,
      joinedAt INTEGER NOT NULL,
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
      UNIQUE(roomId, nickname)
    )
  `);
  console.log('✓ Created participants table');

  // 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_participants_roomId ON participants(roomId);
    CREATE INDEX IF NOT EXISTS idx_participants_nickname ON participants(nickname);
  `);
  console.log('✓ Created indexes');

  // participantCount 컬럼이 있으면 제거 (SQLite는 ALTER TABLE DROP COLUMN을 지원하지 않으므로 새 테이블 생성)
  const tableInfo = db.prepare("PRAGMA table_info(rooms)").all();
  const hasParticipantCount = tableInfo.some(col => col.name === 'participantCount');

  if (hasParticipantCount) {
    console.log('⚠️  SQLite does not support DROP COLUMN. Please manually remove participantCount column or reset database.');
    console.log('   Run: npm run db:reset to reset database with new schema');
  }

  console.log('\n✅ Migration completed successfully!');
  console.log('⚠️  Note: If participantCount column exists, please run: npm run db:reset');
} catch (error) {
  console.error('❌ Error migrating database:', error);
  process.exit(1);
} finally {
  db.close();
}

