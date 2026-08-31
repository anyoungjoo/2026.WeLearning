/**
 * [PC 3 - DB Tier Server] db_server.js
 *
 * 역할: database.sqlite (진짜 SQLite 파일)에 대한 REST 게이트웨이.
 *       Backend Tier(4000)만 이 서버를 호출한다. 프론트엔드는 직접 호출하지 않는다.
 *
 * ⚠️ Node.js 내장 모듈 node:sqlite 사용 (npm install 불필요)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 5000;
const dbPath = path.join(__dirname, 'database.sqlite');

app.use(cors());
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

// --- [DB 연결] ---

if (!fs.existsSync(dbPath)) {
  console.error('❌ database.sqlite 파일이 없습니다.');
  console.error('👉 먼저 아래 명령을 실행하세요:  node init_db.js');
  process.exit(1);
}

const db = new DatabaseSync(dbPath);

/** 'YYYY-MM-DD HH:MM:SS' 형식의 현재 시각 문자열 */
function nowString() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
         `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// --- [1. 상태 확인] ---

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'DB Tier Server is running (Port 5000)', engine: 'SQLite' });
});

// --- [2. 사용자] ---

app.get('/db/users', (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id DESC').all();
  res.json({ users });
});

app.post('/db/users', (req, res) => {
  const { username, password, role = 'USER' } = req.body;

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) {
    return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
  }

  const result = db.prepare(
    'INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, ?)'
  ).run(username, password, role, nowString());

  console.log(`👤 [INSERT users] ${username}`);
  res.json({ success: true, id: Number(result.lastInsertRowid), username, role });
});

app.post('/db/users/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare(
    'SELECT id, username, role FROM users WHERE username = ? AND password = ?'
  ).get(username, password);

  if (!user) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
  }
  res.json({ user });
});

// --- [3. 보고서] ---

app.get('/db/reports', (req, res) => {
  const reports = db.prepare(`
    SELECT r.id, r.user_id, r.title, r.content, r.created_at,
           COALESCE(u.username, '알수없음') AS username
      FROM reports r
      LEFT JOIN users u ON u.id = r.user_id
     ORDER BY r.id DESC
  `).all();
  res.json({ reports });
});

app.post('/db/reports', (req, res) => {
  const { user_id, title, content } = req.body;

  const result = db.prepare(
    'INSERT INTO reports (user_id, title, content, created_at) VALUES (?, ?, ?, ?)'
  ).run(Number(user_id), title, content, nowString());

  console.log(`📄 [INSERT reports] ${title}`);
  res.json({ success: true, id: Number(result.lastInsertRowid), title });
});

// --- [4. 대화방] ---

app.get('/db/chat_rooms', (req, res) => {
  const rooms = db.prepare('SELECT id, name, created_by, created_at FROM chat_rooms ORDER BY created_at ASC').all();
  res.json({ rooms });
});

app.post('/db/chat_rooms', (req, res) => {
  const { id, name, created_by } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id와 name은 필수입니다.' });

  db.prepare(
    'INSERT OR REPLACE INTO chat_rooms (id, name, created_by, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, name, created_by || '알수없음', nowString());

  console.log(`🏠 [INSERT chat_rooms] ${name} (${id})`);
  res.json({ success: true, id, name });
});

// --- [5. 채팅 메시지] ---

/**
 * GET /db/chat_messages?room_id=lobby&limit=100
 *   room_id : 필수. 조회할 대화방 ID
 *   limit   : 선택. 최근 몇 건까지 가져올지 (기본 100)
 *
 * ⭐⭐ [v1 설계의 핵심] 채팅은 오직 id 순서로만 다룬다.
 *
 *    id = AUTOINCREMENT = "몇 번째로 DB에 저장됐는가"
 *
 *    chat_messages 테이블에는 시간 컬럼이 아예 없다.
 *    그래서 "몇 시에 말했는가"로는 정렬할 수도, 걸러낼 수도 없다.
 *    → v2 고도화에서 timestamp 컬럼을 추가하면서 비로소 가능해진다.
 */
app.get('/db/chat_messages', (req, res) => {
  const { room_id } = req.query;
  const limit = Number(req.query.limit) || 100;

  if (!room_id) return res.status(400).json({ error: 'room_id 쿼리 파라미터가 필요합니다.' });

  // ① 가장 큰 id부터 limit 건 = 가장 최근 limit 건
  const rows = db.prepare(`
    SELECT id, room_id, sender, message
      FROM chat_messages
     WHERE room_id = ?
     ORDER BY id DESC
     LIMIT ?
  `).all(room_id, limit);

  // ② 화면에는 옛날 → 최신 순으로 보여야 하므로 id 오름차순으로 뒤집는다
  const messages = rows.reverse();

  res.json({
    order_by: 'id',            // 무엇을 기준으로 정렬했는지 응답에 표시 (v2에서 'timestamp'로 바뀐다)
    count: messages.length,
    messages
  });
});

app.post('/db/chat_messages', (req, res) => {
  const { room_id, sender, message } = req.body;
  if (!room_id || !sender || !message) {
    return res.status(400).json({ error: 'room_id, sender, message는 필수입니다.' });
  }

  // ⭐ 저장할 때도 시간은 기록하지 않는다. id 가 자동으로 붙는 것이 전부다.
  const result = db.prepare(
    'INSERT INTO chat_messages (room_id, sender, message) VALUES (?, ?, ?)'
  ).run(room_id, sender, message);

  const id = Number(result.lastInsertRowid);
  console.log(`💬 [INSERT chat_messages] id=${id} [${room_id}] ${sender}: ${message}`);
  res.json({ success: true, id });
});

// --- [서버 기동] ---

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`🗄️  [DB Tier Server] 실행 완료! (Port: ${PORT})`);
  console.log(`📂  DB 파일: ${dbPath}`);
  console.log(`🔍  VS Code 에서 database.sqlite 우클릭 → Open with SQLite Viewer`);
  console.log(`===================================================`);
});

server.on('error', (err) => {
  console.error('❌ Server listen error:', err);
});
