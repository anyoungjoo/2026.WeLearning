/* ==========================================================================
   KBS PORTAL MAIN APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initSearchToggle();
  initOnAirQuickPlay();
  initMedalCountAnimation();
});

// 1. Search Bar Toggle
function initSearchToggle() {
  const searchBtn = document.getElementById('headerSearchBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  const searchInput = document.getElementById('searchInput');

  if (!searchBtn || !searchOverlay) return;

  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = searchOverlay.classList.contains('is-active');
    if (isOpen) {
      searchOverlay.classList.remove('is-active');
    } else {
      searchOverlay.classList.add('is-active');
      if (searchInput) searchInput.focus();
    }
  });

  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', () => {
      searchOverlay.classList.remove('is-active');
    });
  }

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!searchOverlay.contains(e.target) && !searchBtn.contains(e.target)) {
      searchOverlay.classList.remove('is-active');
    }
  });
}

// 2. ON AIR Quick Live Play
function initOnAirQuickPlay() {
  const onAirBtn = document.getElementById('onAirQuickBtn');
  if (!onAirBtn) return;

  onAirBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof window.openMatchVideo === 'function') {
      window.openMatchVideo('m1'); // Play current live fencing match
    }
  });
}

// 3. Medal Numbers Animation
function initMedalCountAnimation() {
  const goldEl = document.getElementById('goldCount');
  const silverEl = document.getElementById('silverCount');
  const bronzeEl = document.getElementById('bronzeCount');

  if (!goldEl || !silverEl || !bronzeEl) return;

  // Let's animate counts to realistic values or match screenshot (0 0 0 or live counts)
  // Let's display 0 0 0 initially as in the screenshot, and on click or hover reveal live count
  const medalWidget = document.querySelector('.ag-medal-widget');
  if (medalWidget) {
    medalWidget.title = "클릭하여 2026 아시안게임 실시간 메달 종합 순위표 확인";
    medalWidget.addEventListener('click', () => {
      if (typeof window.openMedalModal === 'function') {
        window.openMedalModal();
      }
    });
  }
}
