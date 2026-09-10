/**
 * KBS 4조 3교대 스마트 근무표 웹앱 컨트롤러 (app.js)
 * - 모바일 퍼스트 반응형 렌더링
 * - 월간 달력 뷰 & 주간 아젠다 뷰 전환
 * - 내 근무 강조 토글
 * - 실시간 시계, ICS 다운로드, 로컬 메모 저장
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 애플리케이션 상태 (State)
  const now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth(); // 0-indexed (8 = 9월)
  let myTeam = parseInt(localStorage.getItem('kbs_my_team') || '1', 10);
  let showOnlyMyShift = (localStorage.getItem('kbs_show_only_my') === 'true');
  let currentViewMode = 'month'; // 'month' | 'week'
  let memos = JSON.parse(localStorage.getItem('kbs_shift_memos') || '{}');
  let selectedDateString = null;

  // 2. DOM 요소 캐싱
  // 상단 히어로 카드
  const todayFullDateEl = document.getElementById('todayFullDate');
  const liveClockEl = document.getElementById('liveClock');
  const heroTeamTagEl = document.getElementById('heroTeamTag');
  const heroShiftIconEl = document.getElementById('heroShiftIcon');
  const heroShiftTitleEl = document.getElementById('heroShiftTitle');
  const heroShiftTimeEl = document.getElementById('heroShiftTime');
  const tomorrowShiftPreviewEl = document.getElementById('tomorrowShiftPreview');
  const todayTeamsGridEl = document.getElementById('todayTeamsGrid');

  // 세그먼트 컨트롤 버튼들
  const segmentBtns = document.querySelectorAll('.segmented-control .segment-btn');

  // 캘린더 네비게이션
  const currentMonthDisplayEl = document.getElementById('currentMonthDisplay');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const todayJumpBtn = document.getElementById('todayJumpBtn');

  // 뷰 컨트롤러 (필터 & 탭)
  const toggleOnlyMyShiftBtn = document.getElementById('toggleOnlyMyShiftBtn');
  const toggleMyShiftTextEl = document.getElementById('toggleMyShiftText');
  const monthViewTab = document.getElementById('monthViewTab');
  const weekViewTab = document.getElementById('weekViewTab');
  const monthViewContainer = document.getElementById('monthViewContainer');
  const weekViewContainer = document.getElementById('weekViewContainer');
  const calendarAppGridEl = document.getElementById('calendarAppGrid');
  const agendaListEl = document.getElementById('agendaList');

  // 통계 요소들
  const statDayCountEl = document.getElementById('statDayCount');
  const statNightCountEl = document.getElementById('statNightCount');
  const statEarlyCountEl = document.getElementById('statEarlyCount');
  const statOffCountEl = document.getElementById('statOffCount');
  const statTotalHoursEl = document.getElementById('statTotalHours');

  // 모달(바텀시트)
  const detailModal = document.getElementById('detailModal');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const modalDateDisplayEl = document.getElementById('modalDateDisplay');
  const modalTeamsListEl = document.getElementById('modalTeamsList');
  const dateMemoInput = document.getElementById('dateMemoInput');
  const saveMemoBtn = document.getElementById('saveMemoBtn');
  const cancelMemoBtn = document.getElementById('cancelMemoBtn');

  // 설정 모달
  const settingsModal = document.getElementById('settingsModal');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
  const anchorDateInput = document.getElementById('anchorDateInput');
  const saveAnchorBtn = document.getElementById('saveAnchorBtn');
  const resetAnchorBtn = document.getElementById('resetAnchorBtn');

  // 툴바 버튼들
  const exportIcsBtn = document.getElementById('exportIcsBtn');
  const printBtn = document.getElementById('printBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ==========================================
  // A. 오늘의 근무 히어로 카드 & 실시간 시계
  // ==========================================
  function updateClock() {
    const t = new Date();
    if (liveClockEl) {
      const hh = String(t.getHours()).padStart(2, '0');
      const mm = String(t.getMinutes()).padStart(2, '0');
      const ss = String(t.getSeconds()).padStart(2, '0');
      liveClockEl.textContent = `${hh}:${mm}:${ss}`;
    }
  }

  function renderTodayHero() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const dayName = WEEKDAYS_KO[today.getDay()];

    todayFullDateEl.textContent = `${y}년 ${m}월 ${d}일 (${dayName})`;
    heroTeamTagEl.textContent = `내 소속: ${myTeam}조`;

    // 오늘 내 조 근무
    const todayShift = window.shiftEngine.getShiftForDate(today, myTeam);
    heroShiftIconEl.textContent = todayShift.icon;
    heroShiftTitleEl.textContent = todayShift.name;
    heroShiftTimeEl.textContent = `${todayShift.time} (${todayShift.hours}시간 인정)`;

    // 내일 내 조 근무 프리뷰
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowShift = window.shiftEngine.getShiftForDate(tomorrow, myTeam);
    tomorrowShiftPreviewEl.textContent = `내일: ${tomorrowShift.icon} ${tomorrowShift.shortName} (${tomorrowShift.time})`;

    // 오늘 4개 조 상태 칩 목록
    todayTeamsGridEl.innerHTML = '';
    for (let t = 1; t <= 4; t++) {
      const shift = window.shiftEngine.getShiftForDate(today, t);
      const isMy = (t === myTeam);
      const chip = document.createElement('div');
      chip.className = `hero-chip ${isMy ? 'is-my' : ''}`;
      chip.innerHTML = `
        <span>${t}조${isMy ? '★' : ''}</span>
        <span class="legend-badge ${shift.badgeClass}">${shift.code}</span>
      `;
      todayTeamsGridEl.appendChild(chip);
    }
  }

  // ==========================================
  // B. 월간 통계 요약 갱신
  // ==========================================
  function renderStats() {
    const stats = window.shiftEngine.calculateMonthlyStats(currentYear, currentMonth, myTeam);
    statDayCountEl.textContent = stats.dayCount;
    statNightCountEl.textContent = stats.nightCount;
    statEarlyCountEl.textContent = stats.earlyCount;
    statOffCountEl.textContent = stats.offCount;
    statTotalHoursEl.textContent = stats.totalHours;
  }

  // ==========================================
  // C. 월간 달력 그리드 렌더링 (CSS Grid)
  // ==========================================
  function renderCalendarGrid() {
    const displayMonth = String(currentMonth + 1).padStart(2, '0');
    currentMonthDisplayEl.textContent = `${currentYear}. ${displayMonth}`;

    const firstDate = new Date(currentYear, currentMonth, 1);
    const lastDate = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDate.getDate();
    const startDayOfWeek = firstDate.getDay();

    calendarAppGridEl.innerHTML = '';

    // 1) 시작 전 이전 달 빈 셀
    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'grid-day-cell is-other-month';
      calendarAppGridEl.appendChild(emptyCell);
    }

    // 2) 이번 달 날짜 셀
    const today = new Date();
    const isThisCurrentMonth = (today.getFullYear() === currentYear && today.getMonth() === currentMonth);

    for (let dayCounter = 1; dayCounter <= totalDays; dayCounter++) {
      const cellDate = new Date(currentYear, currentMonth, dayCounter);
      const dayOfWeek = cellDate.getDay();
      const dateKey = formatDateKey(cellDate);
      const isToday = isThisCurrentMonth && (dayCounter === today.getDate());

      const cell = document.createElement('div');
      cell.className = `grid-day-cell ${dayOfWeek === 0 ? 'sun' : (dayOfWeek === 6 ? 'sat' : '')} ${isToday ? 'is-today' : ''}`;

      const myShift = window.shiftEngine.getShiftForDate(cellDate, myTeam);
      const hasMemo = Boolean(memos[dateKey]);

      // 다른 조 미니 도트/칩
      let otherChipsHtml = '';
      if (!showOnlyMyShift) {
        otherChipsHtml = '<div class="other-chips-bar">';
        for (let t = 1; t <= 4; t++) {
          if (t === myTeam) continue;
          const otherShift = window.shiftEngine.getShiftForDate(cellDate, t);
          otherChipsHtml += `
            <span class="other-mini-dot ${otherShift.badgeClass}" title="${t}조: ${otherShift.name}">
              ${t}조:${otherShift.code}
            </span>
          `;
        }
        otherChipsHtml += '</div>';
      }

      cell.innerHTML = `
        <div class="cell-header">
          <span class="day-num">${dayCounter}</span>
          ${hasMemo ? '<span class="memo-icon" title="메모 있음">📝</span>' : ''}
        </div>

        <!-- 내 조 메인 뱃지 -->
        <div class="my-badge ${myShift.badgeClass}">
          <span>${myShift.icon}</span>
          <span>${myShift.code}</span>
        </div>

        ${otherChipsHtml}
      `;

      cell.addEventListener('click', () => openDetailModal(cellDate));
      calendarAppGridEl.appendChild(cell);
    }

    renderStats();
  }

  // ==========================================
  // D. 주간 / 아젠다 리스트 뷰 렌더링 (모바일 최적화)
  // ==========================================
  function renderAgendaView() {
    agendaListEl.innerHTML = '';
    const today = new Date();

    // 현재 선택된 월의 1일부터 말일까지 아젠다 카드 생성
    const lastDate = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDate.getDate();

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(currentYear, currentMonth, day);
      const dayOfWeek = cellDate.getDay();
      const dateKey = formatDateKey(cellDate);
      const isToday = (today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day);

      const item = document.createElement('div');
      item.className = `agenda-item ${isToday ? 'is-today' : ''}`;

      const myShift = window.shiftEngine.getShiftForDate(cellDate, myTeam);
      const hasMemo = Boolean(memos[dateKey]);

      let otherBadges = '';
      for (let t = 1; t <= 4; t++) {
        const s = window.shiftEngine.getShiftForDate(cellDate, t);
        otherBadges += `
          <span class="legend-badge ${s.badgeClass}" style="font-size:11px;">
            ${t}조:${s.code}
          </span>
        `;
      }

      item.innerHTML = `
        <div class="agenda-date-box">
          <div class="agenda-day-pill ${dayOfWeek === 0 ? 'sun' : (dayOfWeek === 6 ? 'sat' : '')}">
            ${day}
          </div>
          <div>
            <div class="agenda-day-name">${currentMonth + 1}월 ${day}일 (${WEEKDAYS_KO[dayOfWeek]}) ${isToday ? '★오늘' : ''}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              ${hasMemo ? '📝 ' + memos[dateKey] : myShift.time}
            </div>
          </div>
        </div>

        <div class="agenda-shift-box">
          <div class="my-badge ${myShift.badgeClass}" style="font-size: 13px; padding: 6px 12px;">
            ${myShift.icon} 내 근무: ${myShift.shortName}
          </div>
        </div>
      `;

      item.addEventListener('click', () => openDetailModal(cellDate));
      agendaListEl.appendChild(item);
    }
  }

  function refreshViews() {
    if (currentViewMode === 'month') {
      monthViewContainer.style.display = 'flex';
      weekViewContainer.style.display = 'none';
      renderCalendarGrid();
    } else {
      monthViewContainer.style.display = 'none';
      weekViewContainer.style.display = 'block';
      renderAgendaView();
    }
  }

  // ==========================================
  // E. 상세 모달 (바텀 시트) 핸들러
  // ==========================================
  function openDetailModal(date) {
    selectedDateString = formatDateKey(date);
    const dayName = WEEKDAYS_KO[date.getDay()];
    modalDateDisplayEl.textContent = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${dayName})`;

    modalTeamsListEl.innerHTML = '';
    for (let t = 1; t <= 4; t++) {
      const shift = window.shiftEngine.getShiftForDate(date, t);
      const isMy = (t === myTeam);
      const row = document.createElement('div');
      row.className = `sheet-team-row ${isMy ? 'is-my' : ''}`;
      row.innerHTML = `
        <div>
          <strong style="font-size: 15px;">${t}조</strong>
          ${isMy ? '<span style="color:var(--brand-primary); font-size:12px; font-weight:800; margin-left:6px;">(내 소속)</span>' : ''}
          <div style="font-size: 12px; color: var(--text-muted);">${shift.time}</div>
        </div>
        <span class="legend-badge ${shift.badgeClass}" style="font-size: 14px; padding: 5px 10px;">
          ${shift.icon} ${shift.name}
        </span>
      `;
      modalTeamsListEl.appendChild(row);
    }

    dateMemoInput.value = memos[selectedDateString] || '';
    detailModal.classList.add('is-active');
  }

  function closeDetailModal() {
    detailModal.classList.remove('is-active');
    selectedDateString = null;
  }

  closeDetailModalBtn.addEventListener('click', closeDetailModal);
  cancelMemoBtn.addEventListener('click', closeDetailModal);

  saveMemoBtn.addEventListener('click', () => {
    if (!selectedDateString) return;
    const val = dateMemoInput.value.trim();
    if (val) {
      memos[selectedDateString] = val;
    } else {
      delete memos[selectedDateString];
    }
    localStorage.setItem('kbs_shift_memos', JSON.stringify(memos));
    closeDetailModal();
    refreshViews();
  });

  // ==========================================
  // F. 내 조 선택 리스너 (세그먼트 컨트롤)
  // ==========================================
  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      myTeam = parseInt(btn.dataset.team, 10);
      localStorage.setItem('kbs_my_team', myTeam);

      renderTodayHero();
      refreshViews();
    });
  });

  // 초기 내 조 세그먼트 활성화 복원
  const initialSegment = document.querySelector(`.segmented-control .segment-btn[data-team="${myTeam}"]`);
  if (initialSegment) {
    segmentBtns.forEach(b => b.classList.remove('active'));
    initialSegment.classList.add('active');
  }

  // ==========================================
  // G. 뷰 모드 및 필터 스위치 리스너
  // ==========================================
  // 내 근무만 보기 토글
  function updateFilterBtnUI() {
    if (showOnlyMyShift) {
      toggleOnlyMyShiftBtn.classList.add('active');
      toggleMyShiftTextEl.textContent = '내 근무만';
    } else {
      toggleOnlyMyShiftBtn.classList.remove('active');
      toggleMyShiftTextEl.textContent = '전체 조 보기';
    }
  }

  updateFilterBtnUI();

  toggleOnlyMyShiftBtn.addEventListener('click', () => {
    showOnlyMyShift = !showOnlyMyShift;
    localStorage.setItem('kbs_show_only_my', showOnlyMyShift);
    updateFilterBtnUI();
    refreshViews();
  });

  // 월간 / 주간 탭 전환
  monthViewTab.addEventListener('click', () => {
    currentViewMode = 'month';
    monthViewTab.classList.add('active');
    weekViewTab.classList.remove('active');
    refreshViews();
  });

  weekViewTab.addEventListener('click', () => {
    currentViewMode = 'week';
    weekViewTab.classList.add('active');
    monthViewTab.classList.remove('active');
    refreshViews();
  });

  // ==========================================
  // H. 월 이동 네비게이션
  // ==========================================
  prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    refreshViews();
  });

  nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    refreshViews();
  });

  todayJumpBtn.addEventListener('click', () => {
    const t = new Date();
    currentYear = t.getFullYear();
    currentMonth = t.getMonth();
    refreshViews();
  });

  // ==========================================
  // I. 다크 모드 토글
  // ==========================================
  const savedTheme = localStorage.getItem('kbs_shift_theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = '☀️';
  }

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      themeToggleBtn.textContent = '🌙';
      localStorage.setItem('kbs_shift_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggleBtn.textContent = '☀️';
      localStorage.setItem('kbs_shift_theme', 'dark');
    }
  });

  // ==========================================
  // J. A4 인쇄
  // ==========================================
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // ==========================================
  // K. 스마트폰 캘린더 등록 (ICS 다운로드)
  // ==========================================
  exportIcsBtn.addEventListener('click', () => {
    const schedule = window.shiftEngine.getMonthSchedule(currentYear, currentMonth);
    let icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KBS 4조3교대 스마트 근무표//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:송출센터 ${myTeam}조 ${currentYear}년 ${currentMonth + 1}월 근무표`
    ];

    schedule.forEach(item => {
      const shift = item.shifts[myTeam];
      if (shift.key === 'OFF') return;

      const y = item.date.getFullYear();
      const m = String(item.date.getMonth() + 1).padStart(2, '0');
      const d = String(item.date.getDate()).padStart(2, '0');
      const dateStr = `${y}${m}${d}`;

      let dtStart = '';
      let dtEnd = '';

      if (shift.key === 'DAY') {
        // 일근: 09:00 ~ 18:00
        dtStart = `${dateStr}T090000`;
        dtEnd = `${dateStr}T180000`;
      } else if (shift.key === 'NIGHT') {
        // 야간: 18:00 ~ 24:00 (익일 00:00)
        const nextDay = new Date(item.date);
        nextDay.setDate(nextDay.getDate() + 1);
        const ny = nextDay.getFullYear();
        const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
        const nd = String(nextDay.getDate()).padStart(2, '0');
        dtStart = `${dateStr}T180000`;
        dtEnd = `${ny}${nm}${nd}T000000`;
      } else if (shift.key === 'EARLY') {
        // 조출: 00:00 ~ 09:00
        dtStart = `${dateStr}T000000`;
        dtEnd = `${dateStr}T090000`;
      }

      icsLines.push(
        'BEGIN:VEVENT',
        `UID:center-shift-${dateStr}-${myTeam}@welearning.kbs`,
        `DTSTAMP:${dateStr}T000000Z`,
        `DTSTART;TZID=Asia/Seoul:${dtStart}`,
        `DTEND;TZID=Asia/Seoul:${dtEnd}`,
        `SUMMARY:[송출센터 ${myTeam}조] ${shift.name}`,
        `DESCRIPTION:근무 형태: ${shift.name} (${shift.time})\\n소속: 송출센터 ${myTeam}조`,
        'END:VEVENT'
      );
    });

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `송출센터_${myTeam}조_${currentYear}년_${currentMonth + 1}월_근무표.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // ==========================================
  // L. 기준일 설정 모달
  // ==========================================
  openSettingsBtn.addEventListener('click', () => {
    const curAnchor = window.shiftEngine.anchorDate;
    const y = curAnchor.getFullYear();
    const m = String(curAnchor.getMonth() + 1).padStart(2, '0');
    const d = String(curAnchor.getDate()).padStart(2, '0');
    anchorDateInput.value = `${y}-${m}-${d}`;
    settingsModal.classList.add('is-active');
  });

  closeSettingsModalBtn.addEventListener('click', () => {
    settingsModal.classList.remove('is-active');
  });

  saveAnchorBtn.addEventListener('click', () => {
    const val = anchorDateInput.value;
    if (val) {
      window.shiftEngine.setAnchorDate(val);
      settingsModal.classList.remove('is-active');
      renderTodayHero();
      refreshViews();
    }
  });

  resetAnchorBtn.addEventListener('click', () => {
    window.shiftEngine.setAnchorDate('2026-09-01');
    anchorDateInput.value = '2026-09-01';
    settingsModal.classList.remove('is-active');
    renderTodayHero();
    refreshViews();
  });

  // 모달 배경 클릭 시 닫기
  [detailModal, settingsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-active');
      }
    });
  });

  // 초기 구동
  renderTodayHero();
  refreshViews();
  setInterval(updateClock, 1000);
  updateClock();
});
