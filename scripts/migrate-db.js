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

console.log('🔄 Migrating database schema...');

try {
  // 기존 컬럼이 있는지 확인하는 함수
  const tableInfo = db.prepare("PRAGMA table_info(rooms)").all();
  const columnNames = tableInfo.map(col => col.name);

  // Rooms 테이블에 컬럼 추가
  if (!columnNames.includes('ownerId')) {
    db.exec('ALTER TABLE rooms ADD COLUMN ownerId TEXT');
    console.log('✓ Added ownerId column to rooms table');
  }

  if (!columnNames.includes('deletedAt')) {
    db.exec('ALTER TABLE rooms ADD COLUMN deletedAt INTEGER');
    console.log('✓ Added deletedAt column to rooms table');
  }

  // Messages 테이블에 컬럼 추가
  const messageTableInfo = db.prepare("PRAGMA table_info(messages)").all();
  const messageColumnNames = messageTableInfo.map(col => col.name);

  if (!messageColumnNames.includes('isRead')) {
    db.exec('ALTER TABLE messages ADD COLUMN isRead INTEGER DEFAULT 0');
    console.log('✓ Added isRead column to messages table');
  }

  // 기존 메시지들을 읽지 않음으로 설정
  db.exec('UPDATE messages SET isRead = 0 WHERE isRead IS NULL');
  console.log('✓ Updated existing messages to unread');

  console.log('\n✅ Database migration completed successfully!');
} catch (error) {
  console.error('❌ Error migrating database:', error);
  process.exit(1);
} finally {
  db.close();
}

