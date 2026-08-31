<template>
  <div class="chat-page">
    <div class="grid-2">
      <!-- 1. 실시간 방 기반 채팅 영역 -->
      <div class="card">
        <h2 class="card-title">
          <i class="fa-solid fa-comments"></i> 실시간 멀티룸 채팅
        </h2>

        <!-- 현재 접속 룸 정보 & URL Query Param 시각화 -->
        <div class="query-info-box">
          <span class="badge"><i class="fa-solid fa-link"></i> URL Query</span>
          <code>?room={{ currentRoomId }}&username={{ currentUser?.username }}</code>
        </div>

        <div class="chat-room-layout">
          <!-- 대화방 목록 Sidebar -->
          <div class="room-sidebar">
            <div class="sidebar-header">
              <span>개설된 대화방</span>
              <button @click="createRoom" class="btn btn-sm btn-secondary">
                <i class="fa-solid fa-plus"></i> 방 만들기
              </button>
            </div>
            <ul class="room-list">
              <li 
                v-for="room in roomList" 
                :key="room.id"
                :class="['room-item', { active: currentRoomId === room.id }]"
                @click="switchRoom(room.id)"
              >
                <div>
                  <strong>{{ room.name }}</strong>
                  <div class="room-subtext">방장: {{ room.createdBy }}</div>
                </div>
                <span class="badge">{{ room.memberCount }}명</span>
              </li>
            </ul>
          </div>

          <!-- 메인 채팅창 -->
          <div class="chat-main">
            <div class="chat-header">
              <strong><i class="fa-solid fa-hashtag"></i> {{ currentRoomName }}</strong>
              <span class="badge">{{ memberCount }}명 참여 중</span>
            </div>

            <!-- 메시지 출력 영역 -->
            <div class="chat-window" ref="chatWindowRef">
              <div 
                v-for="(msg, idx) in messages" 
                :key="idx"
                :class="['chat-message', msg.sender === currentUser?.username ? 'self' : 'other']"
              >
                <!-- ⭐ [v1] 시각은 표시하지 않는다. DB에 시간 정보 자체가 없다.
                             대신 저장 순서인 id 를 보여준다. (v2에서 시각이 붙는다) -->
                <div class="chat-meta">
                  <span>{{ msg.sender }}</span>
                  <span class="msg-id">{{ msg.id != null ? '#' + msg.id : '' }}</span>
                </div>
                <div class="chat-body">{{ msg.message }}</div>
              </div>
            </div>

            <!-- 메시지 입력 폼 -->
            <form @submit.prevent="sendMessage" class="chat-input-form">
              <input 
                type="text" 
                v-model="inputMessage" 
                class="form-control" 
                placeholder="메시지를 입력하세요..." 
              />
              <button type="submit" class="btn btn-primary">
                <i class="fa-solid fa-paper-plane"></i> 전송
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- 2. REST API 데이터 등록 (업무 보고서) 영역 -->
      <div class="card">
        <h2 class="card-title">
          <i class="fa-solid fa-file-pen"></i> 업무 보고서 등록 (REST API 연동)
        </h2>
        <p class="subtitle">
          이 폼에서 등록한 데이터는 <strong>Frontend(8080) ➡️ Backend(4000) ➡️ DB(5000)</strong> 계층을 거쳐 저장됩니다.
        </p>

        <form @submit.prevent="handleReportSubmit">
          <div class="form-group">
            <label>작성자 아이디</label>
            <input type="text" :value="currentUser?.username || '비회원'" class="form-control" disabled />
          </div>

          <div class="form-group">
            <label>보고서 제목 (Title)</label>
            <input 
              type="text" 
              v-model="reportTitle" 
              class="form-control" 
              placeholder="예: 3-Tier 연동 테스트 완료" 
              required 
            />
          </div>

          <div class="form-group">
            <label>보고서 내용 (Content)</label>
            <textarea 
              v-model="reportContent" 
              class="form-control" 
              rows="5" 
              placeholder="상세 내용을 입력하세요..." 
              required
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block">
            <i class="fa-solid fa-cloud-arrow-up"></i> DB에 저장 요청 (POST /api/reports)
          </button>
        </form>

        <div v-if="reportStatus" :class="['alert', reportStatusType, 'mt-3']">
          {{ reportStatus }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { io } from 'socket.io-client';

const route = useRoute();
const router = useRouter();

// 백엔드 API & Socket.io 서버 주소 (Port 4000)
const BACKEND_URL = 'http://localhost:4000';

const currentUser = ref(null);
const socket = ref(null);

const roomList = ref([]);
const currentRoomId = ref(route.query.room || 'lobby');
const currentRoomName = ref('자유 수다방');
const memberCount = ref(1);

const messages = ref([]);
const inputMessage = ref('');
const chatWindowRef = ref(null);

const reportTitle = ref('');
const reportContent = ref('');
const reportStatus = ref('');
const reportStatusType = ref('alert-info');

// 1. 소켓 통신 초기화 및 이벤드 핸들러
onMounted(() => {
  const saved = sessionStorage.getItem('user');
  if (saved) {
    currentUser.value = JSON.parse(saved);
  } else {
    // 세션 없으면 비회원 임시 닉네임
    currentUser.value = { id: Date.now(), username: route.query.username || '손님_' + Math.floor(Math.random() * 1000) };
  }

  // Socket.io 연결
  socket.value = io(BACKEND_URL);

  socket.value.on('connect', () => {
    socket.value.emit('set_user', { username: currentUser.value.username });
    socket.value.emit('join_room', { roomId: currentRoomId.value });
  });

  socket.value.on('room_list_update', (list) => {
    roomList.value = list;
    const current = list.find(r => r.id === currentRoomId.value);
    if (current) currentRoomName.value = current.name;
  });

  // ⭐ 방에 입장하면 서버가 DB에 저장된 지난 대화를 먼저 보내준다
  socket.value.on('chat_history', (history) => {
    messages.value = history;
    scrollToBottom();
  });

  socket.value.on('joined_room', ({ roomId, roomName, memberCount: count }) => {
    currentRoomId.value = roomId;
    currentRoomName.value = roomName;
    memberCount.value = count;
    messages.value.push({ sender: '시스템', message: `'${roomName}' 방에 입장하셨습니다.` });
    scrollToBottom();
  });

  socket.value.on('chat_error', ({ message }) => {
    messages.value.push({ sender: '⚠️ 시스템', message });
    scrollToBottom();
  });

  socket.value.on('user_joined', ({ username, memberCount: count }) => {
    memberCount.value = count;
    messages.value.push({ sender: '시스템', message: `${username}님이 입장하셨습니다.` });
    scrollToBottom();
  });

  socket.value.on('user_left', ({ username, memberCount: count }) => {
    memberCount.value = count;
    messages.value.push({ sender: '시스템', message: `${username}님이 퇴장하셨습니다.` });
    scrollToBottom();
  });

  socket.value.on('new_message', (msg) => {
    messages.value.push(msg);
    scrollToBottom();
  });
});

onUnmounted(() => {
  if (socket.value) socket.value.disconnect();
});

// 2. URL Query Parameter 변경 시 룸 전환 연동
watch(() => route.query.room, (newRoom) => {
  if (newRoom && newRoom !== currentRoomId.value && socket.value) {
    socket.value.emit('join_room', { roomId: newRoom });
  }
});

function switchRoom(roomId) {
  // Vue Router를 통해 URL Query Parameter 변경 (?room=roomId)
  router.push({ query: { ...route.query, room: roomId } });
}

function createRoom() {
  const roomName = prompt('생성할 대화방 이름을 입력하세요:');
  if (roomName && socket.value) {
    socket.value.emit('create_room', { roomName });
  }
}

function sendMessage() {
  if (!inputMessage.value.trim() || !socket.value) return;
  socket.value.emit('send_message', { message: inputMessage.value });
  inputMessage.value = '';
}

async function handleReportSubmit() {
  reportStatus.value = '';
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.value.id,
        title: reportTitle.value,
        content: reportContent.value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'DB 저장 실패');

    reportStatusType.value = 'alert-success';
    reportStatus.value = `[성공] DB에 보고서(ID: ${data.id})가 정상 저장되었습니다!`;
    reportTitle.value = '';
    reportContent.value = '';
  } catch (err) {
    reportStatusType.value = 'alert-danger';
    reportStatus.value = `[에러] ${err.message}`;
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatWindowRef.value) {
      chatWindowRef.value.scrollTop = chatWindowRef.value.scrollHeight;
    }
  });
}
</script>

<style scoped>
.subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.query-info-box {
  background: #f1f5f9;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-room-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .chat-room-layout {
    grid-template-columns: 1fr;
  }
}

.room-sidebar {
  border-right: 1px solid var(--border-color);
  padding-right: 0.75rem;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.room-subtext {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.chat-main {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.chat-input-form {
  display: flex;
  gap: 0.5rem;
}

/* ⭐ [v1] 시각 대신 "저장 순서(id)"를 표시한다 */
.msg-id {
  font-family: monospace;
  opacity: 0.6;
}

.btn-block { width: 100%; }
.mt-3 { margin-top: 1rem; }

.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
.alert-info { background: #e0f2fe; color: #0369a1; }
.alert-success { background: #dcfce7; color: #15803d; }
.alert-danger { background: #fee2e2; color: #b91c1c; }
</style>
