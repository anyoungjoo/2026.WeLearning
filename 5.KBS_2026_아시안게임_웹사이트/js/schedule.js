/* ==========================================================================
   SCHEDULE & MATCH DATA CONTROLLER
   ========================================================================== */

const MATCH_DATA = {
  '9-10': [
    {
      id: 'm1',
      sport: '펜싱',
      sportIcon: '🤺',
      title: '남자 사브르 단체 준결승',
      teamA: { name: '대한민국', flag: '🇰🇷', athletes: '오상욱, 구본길, 박상원, 도경동' },
      teamB: { name: '일본', flag: '🇯🇵', athletes: '요시다, 스즈키, 다나카, 사토' },
      scoreA: 45,
      scoreB: 38,
      status: 'live',
      statusText: 'LIVE ON AIR',
      time: '14:00 경기중',
      channel: 'KBS 1TV',
      channelClass: 'kbs1',
      isLive: true,
      category: ['all', 'korea', 'live']
    },
    {
      id: 'm2',
      sport: '야구',
      sportIcon: '⚾',
      title: '오프닝 라운드 B조 1차전',
      teamA: { name: '대한민국', flag: '🇰🇷', athletes: '선발 원태인 / 4번 노시환' },
      teamB: { name: '대만', flag: '🇹🇼', athletes: '선발 린위민 / 4번 린안커' },
      scoreA: 5,
      scoreB: 2,
      status: 'live',
      statusText: 'LIVE 7회초',
      time: '18:30 경기중',
      channel: 'KBS 2TV',
      channelClass: 'kbs2',
      isLive: true,
      category: ['all', 'korea', 'live']
    },
    {
      id: 'm3',
      sport: '수영',
      sportIcon: '🏊‍♂️',
      title: '남자 계영 800m 결승',
      teamA: { name: '대한민국', flag: '🇰🇷', athletes: '황선우, 김우민, 양재훈, 이호준' },
      teamB: { name: '중국', flag: '🇨🇳', athletes: '판잔러, 왕순, 지신지에, 친하이양' },
      scoreA: '-',
      scoreB: '-',
      status: 'upcoming',
      statusText: '19:30 예정',
      time: '19:30 시작 예정',
      channel: 'KBS 2TV',
      channelClass: 'kbs2',
      isLive: false,
      category: ['all', 'korea', 'final']
    },
    {
      id: 'm4',
      sport: '양궁',
      sportIcon: '🏹',
      title: '여자 리커브 개인전 결승',
      teamA: { name: '대한민국 (임시현)', flag: '🇰🇷', athletes: '세트스코어 6 (금메달)' },
      teamB: { name: '중국 (안치쉬안)', flag: '🇨🇳', athletes: '세트스코어 0' },
      scoreA: 6,
      scoreB: 0,
      status: 'finished',
      statusText: '경기종료 [금]',
      time: '11:20 종료',
      channel: 'KBS 1TV',
      channelClass: 'kbs1',
      isLive: false,
      category: ['all', 'korea', 'final']
    },
    {
      id: 'm5',
      sport: '배드민턴',
      sportIcon: '🏸',
      title: '여자 단식 준결승',
      teamA: { name: '대한민국 (안세영)', flag: '🇰🇷', athletes: '세계랭킹 1위' },
      teamB: { name: '일본 (야마구치)', flag: '🇯🇵', athletes: '세계랭킹 3위' },
      scoreA: '-',
      scoreB: '-',
      status: 'upcoming',
      statusText: '20:15 예정',
      time: '20:15 시작 예정',
      channel: 'KBS my K',
      channelClass: 'kbs1',
      isLive: false,
      category: ['all', 'korea']
    },
    {
      id: 'm6',
      sport: '축구',
      sportIcon: '⚽',
      title: '남자 축구 조별리그 2차전',
      teamA: { name: '대한민국', flag: '🇰🇷', athletes: 'U-23 대표팀' },
      teamB: { name: '태국', flag: '🇹🇭', athletes: '태국 대표팀' },
      scoreA: 4,
      scoreB: 0,
      status: 'finished',
      statusText: '경기종료 [승]',
      time: '09:00 종료',
      channel: 'KBS 2TV',
      channelClass: 'kbs2',
      isLive: false,
      category: ['all', 'korea']
    }
  ],
  '9-11': [
    {
      id: 'm7',
      sport: '펜싱',
      sportIcon: '🤺',
      title: '남자 사브르 단체 결승전',
      teamA: { name: '대한민국', flag: '🇰🇷', athletes: '오상욱, 구본길 출전' },
      teamB: { name: '중국', flag: '🇨🇳', athletes: '결승 진출팀' },
      scoreA: '-',
      scoreB: '-',
      status: 'upcoming',
      statusText: '18:00 예정',
      time: '18:00 시작 예정',
      channel: 'KBS 1TV',
      channelClass: 'kbs1',
      isLive: false,
      category: ['all', 'korea', 'final']
    },
    {
      id: 'm8',
      sport: '수영',
      sportIcon: '🏊‍♂️',
      title: '남자 자유형 200m 결승',
      teamA: { name: '황선우', flag: '🇰🇷', athletes: '한국 신기록 보유자' },
      teamB: { name: '판잔러', flag: '🇨🇳', athletes: '아시아 랭킹 1위' },
      scoreA: '-',
      scoreB: '-',
      status: 'upcoming',
      statusText: '19:45 예정',
      time: '19:45 시작 예정',
      channel: 'KBS 2TV',
      channelClass: 'kbs2',
      isLive: false,
      category: ['all', 'korea', 'final']
    }
  ],
  '9-9': [
    {
      id: 'm9',
      sport: '유도',
      sportIcon: '🥋',
      title: '남자 -81kg 결승',
      teamA: { name: '대한민국 (이준환)', flag: '🇰🇷', athletes: '한판승 승리' },
      teamB: { name: '우즈베키스탄', flag: '🇺🇿', athletes: '은메달 획득' },
      scoreA: '10',
      scoreB: '0',
      status: 'finished',
      statusText: '종료 [금]',
      time: '16:30 종료',
      channel: 'KBS 1TV',
      channelClass: 'kbs1',
      isLive: false,
      category: ['all', 'korea', 'final']
    }
  ]
};

// State
let selectedDate = '9-10';
let activeFilter = 'all';

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  if (!container) return;

  const matches = MATCH_DATA[selectedDate] || MATCH_DATA['9-10'];
  const filtered = matches.filter(m => activeFilter === 'all' || m.category.includes(activeFilter));

  if (!filtered.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: #888;">
        <p style="font-size: 16px;">선택한 조건에 해당하는 경기 일정이 없습니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(match => `
    <div class="match-card ${match.isLive ? 'is-live' : ''}" data-id="${match.id}">
      <div class="card-top-meta">
        <span class="sport-name-tag">
          <span>${match.sportIcon}</span>
          <span>${match.sport} · ${match.title}</span>
        </span>
        <span class="status-badge ${match.status}">
          ${match.isLive ? '<span class="pulse-dot" style="background:#fff; width:6px; height:6px;"></span>' : ''}
          ${match.statusText}
        </span>
      </div>

      <div class="match-content-body">
        <div class="team-col">
          <div class="team-flag-name">
            <span>${match.teamA.flag}</span>
            <span>${match.teamA.name}</span>
          </div>
          <div class="team-athletes">${match.teamA.athletes}</div>
        </div>

        <div class="vs-score-col">
          <div class="score-display">${match.scoreA} : ${match.scoreB}</div>
          <div class="match-time-sub">${match.time}</div>
        </div>

        <div class="team-col right">
          <div class="team-flag-name">
            <span>${match.teamB.name}</span>
            <span>${match.teamB.flag}</span>
          </div>
          <div class="team-athletes">${match.teamB.athletes}</div>
        </div>
      </div>

      <div class="match-card-footer">
        <span class="broadcast-channel ${match.channelClass}">
          📺 ${match.channel} 현장 생중계
        </span>
        <button class="watch-live-btn ${match.isLive ? '' : 'replay'}" onclick="openMatchVideo('${match.id}')">
          ${match.isLive ? '▶ ON AIR 시청' : (match.status === 'finished' ? '⚡ 하이라이트' : '🔔 중계 알림')}
        </button>
      </div>
    </div>
  `).join('');
}

function initScheduleEvents() {
  // Date tab click
  const dateTabs = document.querySelectorAll('.date-tab');
  dateTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dateTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedDate = tab.dataset.date;
      
      const dateText = tab.querySelector('.date-label')?.textContent || '';
      const headingDate = document.querySelector('.schedule-current-date');
      if (headingDate) headingDate.textContent = dateText;

      renderMatches();
    });
  });

  // Filter chips
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderMatches();
    });
  });

  renderMatches();
}

// Modal Handlers
window.openMatchVideo = function(matchId) {
  const modal = document.getElementById('videoPlayerModal');
  if (!modal) return;

  const titleEl = modal.querySelector('.modal-video-title');
  const infoEl = modal.querySelector('.modal-video-desc');
  const previewImg = modal.querySelector('.player-simulated-screen');

  // Find match or fallback
  const allMatches = [...(MATCH_DATA['9-10'] || []), ...(MATCH_DATA['9-11'] || []), ...(MATCH_DATA['9-9'] || [])];
  const match = allMatches.find(m => m.id === matchId);

  if (match) {
    if (titleEl) titleEl.textContent = `[KBS 스포츠] ${match.sport} - ${match.title} (${match.teamA.name} vs ${match.teamB.name})`;
    if (infoEl) infoEl.textContent = `${match.channel} 생중계 | 해설위원 전문 중계방송 · 고화질 라이브 스트리밍`;
    if (previewImg) {
      if (match.sport === '펜싱') previewImg.src = 'assets/images/fencing.jpg';
      else if (match.sport === '수영') previewImg.src = 'assets/images/swimming.jpg';
      else if (match.sport === '야구') previewImg.src = 'assets/images/baseball.jpg';
      else if (match.sport === '양궁') previewImg.src = 'assets/images/archery.jpg';
    }
  }

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
};

window.openCardVideo = function(cardType) {
  const modal = document.getElementById('videoPlayerModal');
  if (!modal) return;

  const titleEl = modal.querySelector('.modal-video-title');
  const infoEl = modal.querySelector('.modal-video-desc');
  const previewImg = modal.querySelector('.player-simulated-screen');

  if (cardType === 'fencing') {
    if (titleEl) titleEl.textContent = '[RE:PLAY ASIA] 남자 사브르 단체전 "어펜져스 어셈블!" 골든 모먼트';
    if (infoEl) infoEl.textContent = 'KBS 스포츠 하이라이트 | 대한민국 펜싱 사브르 대표팀 4연패 신화 달성의 순간';
    if (previewImg) previewImg.src = 'assets/images/fencing.jpg';
  } else if (cardType === 'swimming') {
    if (titleEl) titleEl.textContent = '[RE:PLAY ASIA] "한국 수영의 황금세대 모먼트 다 모았다!"';
    if (infoEl) infoEl.textContent = '황선우, 김우민의 아시아 신기록 릴레이 및 메달 수여식 풀버전';
    if (previewImg) previewImg.src = 'assets/images/swimming.jpg';
  } else if (cardType === 'baseball') {
    if (titleEl) titleEl.textContent = '[KBS 2026 아시안게임] 야구 대표팀 출격! 오늘의 키플레이어 심층 분석';
    if (infoEl) infoEl.textContent = 'KBS 해설위원 총출동! 오프닝 라운드 한일전/대만전 필승 전략 리뷰';
    if (previewImg) previewImg.src = 'assets/images/baseball.jpg';
  } else if (cardType === 'archery') {
    if (titleEl) titleEl.textContent = '[KBS 스포츠] 신궁의 집중력! 대한민국 양궁 10점 릴레이 명장면';
    if (infoEl) infoEl.textContent = '세계 최강 대한민국 양궁 대표팀의 완벽한 텐 샷 모음집';
    if (previewImg) previewImg.src = 'assets/images/archery.jpg';
  }

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
};

window.openMedalModal = function() {
  const modal = document.getElementById('medalModal');
  if (modal) {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
};

window.openScheduleModal = function() {
  const modal = document.getElementById('fullScheduleModal');
  if (modal) {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
};

window.closeAllModals = function() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('is-open'));
  document.body.style.overflow = '';
};

// Modal Close Triggers
document.addEventListener('DOMContentLoaded', () => {
  initScheduleEvents();

  // Close when clicking modal backdrop or close buttons
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeAllModals();
      }
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // ESC key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
});
