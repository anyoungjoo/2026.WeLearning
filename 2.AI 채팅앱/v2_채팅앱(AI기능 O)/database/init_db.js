/**
 * [PC 3 - DB Tier] init_db.js
 *
 * database.sqlite 파일을 "진짜 SQLite 데이터베이스"로 새로 생성한다.
 *
 * ⚠️ 중요
 *  - Node.js 내장 모듈 node:sqlite 를 사용한다. (npm install 불필요)
 *  - 이 스크립트를 실행하면 기존 database.sqlite 는 삭제되고 처음부터 다시 만들어진다.
 *  - 생성된 파일은 VS Code 확장앱 'SQLite Viewer' 로 열어서 표(table) 형태로 볼 수 있다.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🚀 [DB Tier] 데이터베이스 초기화 시작...');

// 1. 기존 파일 삭제 (완전 초기화)
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  기존 database.sqlite 삭제');
}

const db = new DatabaseSync(dbPath);

// 2. 테이블 생성
//    created_at 은 'YYYY-MM-DD HH:MM:SS' 형식의 문자열로 저장한다.
//    → SQLite Viewer 에서 사람이 직접 읽고 고치기 쉬운 형식이다.
//
//    ⭐ [v1 설계] chat_messages 에는 시간 컬럼이 없다.
//       채팅은 오직 id(자동 증가 번호) = "저장된 순서" 로만 관리한다.
//       "몇 시에 말했는가"는 어디에도 기록되지 않는다.
//       → v2 고도화에서 timestamp 컬럼을 추가하게 된다.
db.exec(`
  CREATE TABLE users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'USER',
    created_at TEXT    NOT NULL
  );

  CREATE TABLE reports (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    title      TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    created_at TEXT    NOT NULL
  );

  CREATE TABLE chat_rooms (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE chat_messages (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    sender  TEXT NOT NULL,
    message TEXT NOT NULL
  );

  CREATE INDEX idx_chat_messages_room ON chat_messages (room_id, id);
`);

console.log('✅ 테이블 4개 생성: users / reports / chat_rooms / chat_messages');

// 3. 기본 데이터 삽입
function nowString() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
         `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const now = nowString();

const insertUser = db.prepare(
  'INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, ?)'
);
insertUser.run('admin', 'admin123', 'ADMIN', now);
insertUser.run('user1', 'password123', 'USER', now);

db.prepare(
  'INSERT INTO reports (user_id, title, content, created_at) VALUES (?, ?, ?, ?)'
).run(2, '첫 번째 테스트 데이터', '3-Tier 구조 연동 테스트 내용입니다.', now);

db.prepare(
  'INSERT INTO chat_rooms (id, name, created_by, created_at) VALUES (?, ?, ?, ?)'
).run('lobby', '💬 자유 수다방', '시스템', now);

db.close();

console.log('✅ 기본 데이터 삽입 완료 (사용자 2명 / 보고서 1건 / 기본 대화방 1개)');
console.log('✅ [DB Tier] database.sqlite 생성 완료!');
console.log('');
console.log('👉 VS Code 에서 database.sqlite 우클릭 → "Open with SQLite Viewer" 로 열어보세요.');
console.log('   chat_messages 테이블은 지금 비어 있습니다. 채팅을 치면 행이 쌓입니다.');
console.log('   ⭐ chat_messages 에는 시간 컬럼이 없습니다. id(저장 순서)가 전부입니다.');
