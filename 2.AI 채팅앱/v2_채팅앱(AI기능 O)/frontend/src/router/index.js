import { createRouter, createWebHistory } from 'vue-router';
import AuthView from '../views/AuthView.vue';
import ChatView from '../views/ChatView.vue';
import DashboardView from '../views/DashboardView.vue';

/**
 * [Vue Router 라우팅 설정]
 * 초보자가 URL 구성을 한눈에 파악할 수 있도록 라우트 경로 및 쿼리 파라미터 구조를 명시합니다.
 */
const routes = [
  {
    path: '/',
    name: 'auth',
    component: AuthView,
    meta: { title: '로그인 / 회원가입' }
  },
  {
    path: '/chat',
    name: 'chat',
    component: ChatView,
    // URL Query Parameter (예: /chat?room=lobby&username=user1) 지원
    props: route => ({
      room: route.query.room || 'lobby',
      username: route.query.username || ''
    }),
    meta: { title: '실시간 채팅 & 업무 보고서' }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { title: '3-Tier 모니터링 대시보드' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
