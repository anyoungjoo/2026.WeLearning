<template>
  <div class="auth-wrapper">
    <div class="card auth-card">
      <h2 class="card-title">
        <i class="fa-solid fa-user-lock"></i> 3-Tier 시스템 로그인
      </h2>
      <p class="auth-subtitle">개발자/사용자 계정으로 접속하여 3-Tier 연동을 실습하세요.</p>

      <!-- 메시지 알림 -->
      <div v-if="alertMessage" :class="['alert', alertType]">
        {{ alertMessage }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>사용자 아이디 (Username)</label>
          <input 
            type="text" 
            v-model="username" 
            class="form-control" 
            placeholder="아이디를 입력하세요 (예: user1)" 
            required 
          />
        </div>

        <div class="form-group">
          <label>비밀번호 (Password)</label>
          <input 
            type="password" 
            v-model="password" 
            class="form-control" 
            placeholder="비밀번호를 입력하세요" 
            required 
          />
        </div>

        <div class="button-group">
          <button type="submit" class="btn btn-primary btn-block">
            <i class="fa-solid fa-right-to-bracket"></i> 로그인
          </button>
          <button type="button" @click="handleRegister" class="btn btn-secondary btn-block">
            <i class="fa-solid fa-user-plus"></i> 회원가입
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const alertMessage = ref('');
const alertType = ref('alert-info');

// 백엔드 API 서버 URL (Port 4000)
const BACKEND_URL = 'http://localhost:4000';

async function handleLogin() {
  alertMessage.value = '';
  try {
    const res = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '로그인 실패');

    // 로그인 성공 시 세션 저장 후 채팅 페이지로 이동 (Query Param으로 username 전달)
    sessionStorage.setItem('user', JSON.stringify(data.user));
    alertType.value = 'alert-success';
    alertMessage.value = `환영합니다, ${data.user.username}님! 채팅방으로 이동합니다.`;
    
    setTimeout(() => {
      router.push({ path: '/chat', query: { room: 'lobby', username: data.user.username } });
    }, 800);
  } catch (err) {
    alertType.value = 'alert-danger';
    alertMessage.value = `[로그인 에러] ${err.message}`;
  }
}

async function handleRegister() {
  if (!username.value || !password.value) {
    alertType.value = 'alert-danger';
    alertMessage.value = '아이디와 비밀번호를 모두 입력해주세요.';
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '회원가입 실패');

    alertType.value = 'alert-success';
    alertMessage.value = '회원가입이 완료되었습니다! 로그인해 주세요.';
  } catch (err) {
    alertType.value = 'alert-danger';
    alertMessage.value = `[회원가입 에러] ${err.message}`;
  }
}
</script>

<style scoped>
.auth-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.auth-card {
  width: 100%;
  max-width: 440px;
}

.auth-subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-block {
  width: 100%;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}
.alert-info { background: #e0f2fe; color: #0369a1; }
.alert-success { background: #dcfce7; color: #15803d; }
.alert-danger { background: #fee2e2; color: #b91c1c; }
</style>
