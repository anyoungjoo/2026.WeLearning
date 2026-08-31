<template>
  <div id="app-root">
    <!-- 1. 상단 글로벌 네비게이션 바 -->
    <header class="navbar">
      <div class="brand">
        <i class="fa-solid fa-cubes"></i> 3-Tier API 실습 (Vue 3)
      </div>

      <nav class="nav-links">
        <router-link to="/" class="nav-link">
          <i class="fa-solid fa-lock"></i> 인증
        </router-link>
        <router-link to="/chat?room=lobby" class="nav-link">
          <i class="fa-solid fa-comments"></i> 실시간 채팅 & REST
        </router-link>
        <router-link to="/dashboard" class="nav-link">
          <i class="fa-solid fa-chart-pie"></i> 대시보드
        </router-link>

        <span v-if="currentUser" class="user-badge">
          <i class="fa-solid fa-circle-user"></i> {{ currentUser.username }}
        </span>
      </nav>
    </header>

    <!-- 2. 라우터 뷰 (페이지 컴포넌트 렌더링 위치) -->
    <main class="container">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const currentUser = ref(null);

onMounted(() => {
  const saved = sessionStorage.getItem('user');
  if (saved) {
    currentUser.value = JSON.parse(saved);
  }
});
</script>

<style>
/* 글로벌 폰트 및 스타일은 main.css에서 통합 관리됩니다 */
</style>
