<template>
  <div class="dashboard-page">
    <div class="card">
      <div class="dashboard-header">
        <h2 class="card-title">
          <i class="fa-solid fa-chart-line"></i> 3-Tier 모니터링 대시보드
        </h2>
        <button @click="fetchStats" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-rotate"></i> 새로고침
        </button>
      </div>

      <!-- 요약 통계 카드 3종 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-blue"><i class="fa-solid fa-users"></i></div>
          <div class="stat-info">
            <div class="stat-label">총 가입 회원</div>
            <div class="stat-value">{{ stats.userCount }}명</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-green"><i class="fa-solid fa-file-invoice"></i></div>
          <div class="stat-info">
            <div class="stat-label">등록된 DB 보고서</div>
            <div class="stat-value">{{ stats.reportCount }}건</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-purple"><i class="fa-solid fa-comments"></i></div>
          <div class="stat-info">
            <div class="stat-label">활성 대화방 수</div>
            <div class="stat-value">{{ stats.activeRoomCount }}개</div>
          </div>
        </div>
      </div>

      <!-- 백엔드 -> DB 연동 데이터 테이블 -->
      <div class="table-section mt-4">
        <h3><i class="fa-solid fa-database"></i> SQLite DB 실시간 저장 데이터 목록</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>작성자 ID</th>
              <th>작성자 ID/이름</th>
              <th>제목</th>
              <th>내용</th>
              <th>생성일시</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rpt in stats.reports" :key="rpt.id">
              <td>{{ rpt.id }}</td>
              <td><span class="badge">{{ rpt.user_id }}</span></td>
              <td><strong>{{ rpt.username || '알수없음' }}</strong></td>
              <td>{{ rpt.title }}</td>
              <td>{{ rpt.content }}</td>
              <td>{{ formatDate(rpt.created_at) }}</td>
            </tr>
            <tr v-if="!stats.reports || stats.reports.length === 0">
              <td colspan="6" class="text-center">저장된 데이터가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const BACKEND_URL = 'http://localhost:4000';
const stats = ref({
  userCount: 0,
  reportCount: 0,
  activeRoomCount: 0,
  users: [],
  reports: []
});

async function fetchStats() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/stats`);
    const data = await res.json();
    if (res.ok) {
      stats.value = data;
    }
  } catch (err) {
    console.error('대시보드 데이터를 가져오지 못했습니다:', err);
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleString('ko-KR');
}

onMounted(() => {
  fetchStats();
});
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.icon-blue { background: #e0f2fe; color: #0284c7; }
.icon-green { background: #dcfce7; color: #16a34a; }
.icon-purple { background: #f3e8ff; color: #9333ea; }

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.table-section h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.mt-4 { margin-top: 2rem; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

.data-table th, .data-table td {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  text-align: left;
  font-size: 0.9rem;
}

.data-table th {
  background: #f1f5f9;
  font-weight: 600;
}

.text-center { text-align: center; }
</style>
