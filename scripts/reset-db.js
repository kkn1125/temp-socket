const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'data', 'chat.db');

console.log('⚠️  WARNING: This will delete all data in the database!');
console.log('📦 Resetting SQLite database...');

// 데이터베이스 파일이 있으면 삭제
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✓ Deleted existing database file');
}

// 초기화 스크립트 실행
const { execSync } = require('child_process');
const initScriptPath = path.join(__dirname, 'init-db.js');

try {
  execSync(`node ${initScriptPath}`, { stdio: 'inherit' });
  console.log('\n✅ Database reset completed successfully!');
} catch (error) {
  console.error('❌ Error resetting database:', error);
  process.exit(1);
}

