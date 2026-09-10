/**
 * 4조 3교대 (일 - 야 - 조 - 비) 순환 계산 엔진
 * 
 * 1. 일근(DAY)  : 09:00 ~ 18:00 (주간 표준 방송업무)
 * 2. 야간(NIGHT): 18:00 ~ 24:00 (심야 방송 송출 및 대기)
 * 3. 조출(EARLY): 00:00 ~ 09:00 (새벽 방송 송출 및 아침 방송 준비)
 * 4. 비번(OFF)  : 비번 및 휴식 (휴무)
 * 
 * 4개 조(1조, 2조, 3조, 4조)가 매일 각각 하나씩 교대하여 빈틈없이 24시간을 유지합니다.
 */

const SHIFT_TYPES = {
  DAY: {
    key: 'DAY',
    code: '일',
    name: '일근 (주간)',
    shortName: '일근',
    time: '09:00 ~ 18:00',
    hours: 9,
    badgeClass: 'shift-day',
    icon: '☀️',
    color: '#2563eb',
    bgColor: '#eff6ff'
  },
  NIGHT: {
    key: 'NIGHT',
    code: '야',
    name: '야간 (심야)',
    shortName: '야간',
    time: '18:00 ~ 24:00',
    hours: 6,
    badgeClass: 'shift-night',
    icon: '🌙',
    color: '#6366f1',
    bgColor: '#eef2ff'
  },
  EARLY: {
    key: 'EARLY',
    code: '조',
    name: '조출 (오전)',
    shortName: '조출',
    time: '00:00 ~ 09:00',
    hours: 9,
    badgeClass: 'shift-early',
    icon: '🌅',
    color: '#f59e0b',
    bgColor: '#fffbeb'
  },
  OFF: {
    key: 'OFF',
    code: '비',
    name: '비번 (휴식)',
    shortName: '비번',
    time: '비번 / 휴무',
    hours: 0,
    badgeClass: 'shift-off',
    icon: '🌿',
    color: '#10b981',
    bgColor: '#ecfdf5'
  }
};

// 4일 순환 패턴: 일 -> 야 -> 조 -> 비
const CYCLE_PATTERN = [
  SHIFT_TYPES.DAY,   // 0: 일
  SHIFT_TYPES.NIGHT, // 1: 야
  SHIFT_TYPES.EARLY, // 2: 조
  SHIFT_TYPES.OFF    // 3: 비
];

// 조별 오프셋 (매일 4개 조가 일, 야, 조, 비를 각각 서로 다르게 수행)
const TEAM_OFFSETS = {
  1: 0, // 1조: 일 -> 야 -> 조 -> 비
  2: 3, // 2조: 비 -> 일 -> 야 -> 조
  3: 2, // 3조: 조 -> 비 -> 일 -> 야
  4: 1  // 4조: 야 -> 조 -> 비 -> 일
};

class ShiftEngine {
  constructor() {
    // 기본 기준일: 2026-09-01 (1조 기준 '일' 근무일)
    // 사용자가 로컬 설정에서 기준일을 변경할 수 있습니다.
    const savedAnchor = localStorage.getItem('kbs_shift_anchor_date');
    this.anchorDate = savedAnchor ? new Date(savedAnchor) : new Date(2026, 8, 1); // 2026-09-01
  }

  /**
   * 기준일 변경 및 저장
   */
  setAnchorDate(dateString) {
    this.anchorDate = new Date(dateString);
    localStorage.setItem('kbs_shift_anchor_date', dateString);
  }

  /**
   * 특정 날짜와 기준일 사이의 날짜 차이(일수) 계산
   */
  getDayDifference(targetDate) {
    // 시간 부분을 00:00:00으로 통일하여 일 단위만 계산
    const d1 = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const d0 = new Date(this.anchorDate.getFullYear(), this.anchorDate.getMonth(), this.anchorDate.getDate());
    const diffMs = d1.getTime() - d0.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * 특정 날짜의 특정 조 근무 타입 반환
   * @param {Date} date 
   * @param {number} team (1, 2, 3, 4)
   * @returns {Object} SHIFT_TYPES 중 하나
   */
  getShiftForDate(date, team = 1) {
    const dayDiff = this.getDayDifference(date);
    const teamOffset = TEAM_OFFSETS[team] ?? 0;
    
    // 모듈로 연산: 음수일 경우에도 0~3 사이가 되도록 보정
    const cycleIndex = (((dayDiff + teamOffset) % 4) + 4) % 4;
    return CYCLE_PATTERN[cycleIndex];
  }

  /**
   * 특정 날짜의 1~4조 전체 근무 상태 반환
   */
  getAllTeamShiftsForDate(date) {
    return {
      date: new Date(date),
      team1: this.getShiftForDate(date, 1),
      team2: this.getShiftForDate(date, 2),
      team3: this.getShiftForDate(date, 3),
      team4: this.getShiftForDate(date, 4)
    };
  }

  /**
   * 특정 년/월의 전체 날짜별 4개 조 근무 일정 배열 생성
   */
  getMonthSchedule(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    const schedule = [];
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(year, month, day);
      schedule.push({
        dayNumber: day,
        date: currentDate,
        dayOfWeek: currentDate.getDay(), // 0: 일요일 ~ 6: 토요일
        shifts: {
          1: this.getShiftForDate(currentDate, 1),
          2: this.getShiftForDate(currentDate, 2),
          3: this.getShiftForDate(currentDate, 3),
          4: this.getShiftForDate(currentDate, 4)
        }
      });
    }

    return schedule;
  }

  /**
   * 특정 년/월, 특정 조의 근무 통계 계산
   */
  calculateMonthlyStats(year, month, team = 1) {
    const schedule = this.getMonthSchedule(year, month);
    const stats = {
      totalDays: schedule.length,
      dayCount: 0,    // 일근 횟수
      nightCount: 0,  // 야간 횟수
      earlyCount: 0,  // 조출 횟수
      offCount: 0,    // 비번 횟수
      totalHours: 0   // 총 예상 근무시간
    };

    schedule.forEach(item => {
      const shift = item.shifts[team];
      if (shift.key === 'DAY') {
        stats.dayCount++;
        stats.totalHours += shift.hours;
      } else if (shift.key === 'NIGHT') {
        stats.nightCount++;
        stats.totalHours += shift.hours;
      } else if (shift.key === 'EARLY') {
        stats.earlyCount++;
        stats.totalHours += shift.hours;
      } else if (shift.key === 'OFF') {
        stats.offCount++;
      }
    });

    return stats;
  }
}

// 전역 싱글톤 인스턴스
window.shiftEngine = new ShiftEngine();
window.SHIFT_TYPES = SHIFT_TYPES;
