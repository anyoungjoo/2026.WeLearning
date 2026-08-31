/**
 * [PC 2 - Backend Tier Server] server.js
 * 
 * [역할 및 기능]
 * 1. REST API (회원가입, 로그인, 데이터 등록, 대시보드 통계)
 * 2. Socket.io 실시간 방 기반 채팅 (방 생성, 방 입장, 메시지 송수신)
 * 3. 관리자 대시보드 UI (/dashboard)
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = 4000;
const DB_TIER_URL = process.env.DB_HOST || 'http://localhost:5000';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log(`🔗 DB Tier 연결 지점: ${DB_TIER_URL}`);

// --- [1. REST API 엔드포인트] ---

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해주세요.' });

  try {
    const response = await fetch(`${DB_TIER_URL}/db/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'DB 저장 실패');
    res.json({ success: true, message: '회원가입 완료!', userId: data.id });
  } catch (err) {
    res.status(500).json({ error: `[Backend -> DB 에러] ${err.message}` });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const response = await fetch(`${DB_TIER_URL}/db/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) return res.status(401).json({ error: data.error });
    res.json({ success: true, user: data.user });
  } catch (err) {
    res.status(500).json({ error: `[Backend -> DB 에러] ${err.message}` });
  }
});

app.post('/api/reports', async (req, res) => {
  const { user_id, title, content } = req.body;
  if (!user_id || !title || !content) return res.status(400).json({ error: '필수 값이 누락되었습니다.' });

  try {
    const response = await fetch(`${DB_TIER_URL}/db/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, title, content })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'DB 입력 실패');
    res.json({ success: true, message: '데이터가 성공적으로 등록되었습니다.', id: data.id });
  } catch (err) {
    res.status(500).json({ error: `[Backend -> DB 에러] ${err.message}` });
  }
});

/**
 * GET /api/chat/messages?room_id=lobby
 *
 * ⭐ 브라우저 주소창에 그대로 쳐서 확인할 수 있는 API다.
 *    http://localhost:4000/api/chat/messages?room_id=lobby
 *
 *    같은 데이터를 DB Tier에서 직접 볼 수도 있다.
 *    http://localhost:5000/db/chat_messages?room_id=lobby
 *
 *    두 주소의 결과를 비교해 보면 "백엔드는 DB에게 물어보고 그대로 전달한다"는 것을
 *    눈으로 확인할 수 있다.
 *
 * ⭐ [v1] 응답의 order_by 는 항상 'id' 다.
 *    백엔드는 순서를 다시 정하지 않는다. DB가 준 id 순서를 그대로 넘긴다.
 */
app.get('/api/chat/messages', async (req, res) => {
  const { room_id } = req.query;
  if (!room_id) return res.status(400).json({ error: 'room_id 쿼리 파라미터가 필요합니다.' });

  try {
    const response = await fetch(`${DB_TIER_URL}/db/chat_messages?room_id=${encodeURIComponent(room_id)}&limit=100`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'DB 조회 실패');

    res.json({
      tier: 'backend(4000) → db(5000)',
      order_by: data.order_by,   // v1 에서는 'id'
      count: data.count,
      messages: data.messages
    });
  } catch (err) {
    res.status(500).json({ error: `[Backend -> DB 에러] ${err.message}` });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [usersRes, reportsRes] = await Promise.all([
      fetch(`${DB_TIER_URL}/db/users`),
      fetch(`${DB_TIER_URL}/db/reports`)
    ]);
    const usersData = await usersRes.json();
    const reportsData = await reportsRes.json();

    res.json({
      userCount: usersData.users ? usersData.users.length : 0,
      reportCount: reportsData.reports ? reportsData.reports.length : 0,
      activeRoomCount: rooms.size,
      users: usersData.users || [],
      reports: reportsData.reports || []
    });
  } catch (err) {
    res.status(500).json({ error: `[DB 연동 에러] ${err.message}` });
  }
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// --- [2. Socket.io 실시간 방 기반 채팅 엔진] ---
//
// ⭐ 중요: 채팅 메시지는 메모리에만 두지 않고 DB Tier(5000)에 저장한다.
//    → SQLite Viewer 의 chat_messages 테이블에서 실시간으로 행이 쌓이는 것을 볼 수 있다.

const rooms = new Map();
const socketUsers = new Map();

/** 시작 시 DB에서 대화방 목록을 불러온다 (서버를 재시작해도 방이 유지된다) */
async function loadRoomsFromDb() {
  try {
    const response = await fetch(`${DB_TIER_URL}/db/chat_rooms`);
    const data = await response.json();
    for (const r of data.rooms || []) {
      rooms.set(r.id, { id: r.id, name: r.name, createdBy: r.created_by, members: new Set() });
    }
    console.log(`🏠 DB에서 대화방 ${rooms.size}개를 불러왔습니다.`);
  } catch (err) {
    console.error(`❌ [DB 연동 실패] 대화방 목록을 못 읽었습니다: ${err.message}`);
    console.error(`   👉 DB Tier(${DB_TIER_URL})가 켜져 있는지 확인하세요.`);
  }
}

/** 특정 방의 지난 대화 기록을 DB에서 가져온다 (id 오름차순으로 온다) */
async function fetchChatHistory(roomId) {
  try {
    const response = await fetch(`${DB_TIER_URL}/db/chat_messages?room_id=${encodeURIComponent(roomId)}&limit=100`);
    const data = await response.json();
    return data.messages || [];
  } catch (err) {
    console.error(`❌ [DB 연동 실패] 대화 기록 조회: ${err.message}`);
    return [];
  }
}

/** 메시지 한 건을 DB에 저장하고, 새로 붙은 id 를 돌려준다 */
async function saveMessageToDb(roomId, sender, message) {
  const response = await fetch(`${DB_TIER_URL}/db/chat_messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, sender, message })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'DB 저장 실패');
  return data.id;
}

function getRoomList() {
  const list = [];
  for (const [id, room] of rooms.entries()) {
    list.push({ id: room.id, name: room.name, createdBy: room.createdBy, memberCount: room.members.size });
  }
  return list;
}

io.on('connection', (socket) => {
  socket.on('set_user', ({ username }) => {
    socketUsers.set(socket.id, { username, currentRoom: null });
    socket.emit('room_list_update', getRoomList());
  });

  socket.on('create_room', async ({ roomName }) => {
    const user = socketUsers.get(socket.id);
    if (!user) return;

    const roomId = 'room_' + Date.now();

    // 메모리와 DB 양쪽에 방을 만든다
    rooms.set(roomId, { id: roomId, name: roomName, createdBy: user.username, members: new Set() });
    try {
      await fetch(`${DB_TIER_URL}/db/chat_rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, name: roomName, created_by: user.username })
      });
    } catch (err) {
      console.error(`❌ [DB 연동 실패] 대화방 저장: ${err.message}`);
    }

    io.emit('room_list_update', getRoomList());
    socket.emit('room_created', { roomId });
  });

  socket.on('join_room', async ({ roomId }) => {
    const user = socketUsers.get(socket.id);
    const room = rooms.get(roomId);
    if (!user || !room) return;

    if (user.currentRoom) {
      const prev = rooms.get(user.currentRoom);
      if (prev) {
        prev.members.delete(socket.id);
        socket.leave(user.currentRoom);
        io.to(user.currentRoom).emit('user_left', { username: user.username, memberCount: prev.members.size });
      }
    }

    socket.join(roomId);
    user.currentRoom = roomId;
    room.members.add(socket.id);

    // ⭐ 방에 들어온 사람에게 DB에 저장된 지난 대화를 먼저 보내준다 (id 오름차순 그대로)
    const history = await fetchChatHistory(roomId);
    socket.emit('chat_history', history.map(m => ({
      id: m.id,
      sender: m.sender,
      message: m.message
    })));

    socket.emit('joined_room', { roomId: room.id, roomName: room.name, memberCount: room.members.size });
    socket.to(roomId).emit('user_joined', { username: user.username, memberCount: room.members.size });
    io.emit('room_list_update', getRoomList());
  });

  socket.on('send_message', async ({ message }) => {
    const user = socketUsers.get(socket.id);
    if (!user || !user.currentRoom) return;

    try {
      // 1) 먼저 DB에 저장한다 (Frontend → Backend → DB 3계층 통과)
      //    돌아오는 id 가 "이 메시지가 몇 번째로 저장됐는가"이다.
      const id = await saveMessageToDb(user.currentRoom, user.username, message);

      // 2) 저장에 성공하면 같은 방 사람들에게 뿌린다
      io.to(user.currentRoom).emit('new_message', {
        id,
        sender: user.username,
        message
      });
    } catch (err) {
      console.error(`❌ [DB 저장 실패] ${err.message}`);
      socket.emit('chat_error', { message: `메시지를 DB에 저장하지 못했습니다: ${err.message}` });
    }
  });

  socket.on('leave_room', () => {
    const user = socketUsers.get(socket.id);
    if (!user || !user.currentRoom) return;

    const room = rooms.get(user.currentRoom);
    if (room) {
      room.members.delete(socket.id);
      socket.leave(user.currentRoom);
      io.to(user.currentRoom).emit('user_left', { username: user.username, memberCount: room.members.size });
      user.currentRoom = null;
      io.emit('room_list_update', getRoomList());
    }
  });

  socket.on('disconnect', () => {
    const user = socketUsers.get(socket.id);
    if (user && user.currentRoom) {
      const room = rooms.get(user.currentRoom);
      if (room) {
        room.members.delete(socket.id);
        io.to(user.currentRoom).emit('user_left', { username: user.username, memberCount: room.members.size });
      }
    }
    socketUsers.delete(socket.id);
    io.emit('room_list_update', getRoomList());
  });
});

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`===================================================`);
  console.log(`🖥️  [Backend Tier Server] 실행 완료! (Port: ${PORT})`);
  console.log(`🌐  대시보드: http://localhost:${PORT}/dashboard`);
  console.log(`💬  Socket.io 실시간 채팅 엔진 함께 구동 중 (Port: ${PORT})`);
  console.log(`===================================================`);
  await loadRoomsFromDb();
});
