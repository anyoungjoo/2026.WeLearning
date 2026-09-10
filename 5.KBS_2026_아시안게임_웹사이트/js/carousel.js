/* ==========================================================================
   CAROUSEL SLIDER CONTROLLER
   ========================================================================== */

class AsianGamesCarousel {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;

    this.track = this.container.querySelector('.carousel-track');
    this.cards = this.container.querySelectorAll('.ag-video-card');
    this.prevBtn = this.container.querySelector('.carousel-arrow.prev');
    this.nextBtn = this.container.querySelector('.carousel-arrow.next');
    
    this.currentIndex = 0;
    this.maxIndex = Math.max(0, this.cards.length - this.getVisibleCardsCount());
    this.autoPlayInterval = null;

    this.init();
  }

  getVisibleCardsCount() {
    const width = window.innerWidth;
    if (width <= 640) return 1;
    if (width <= 1024) return 2;
    return 3;
  }

  init() {
    if (!this.track || !this.cards.length) return;

    // Attach listeners
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.prev();
        this.resetAutoPlay();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.next();
        this.resetAutoPlay();
      });
    }

    // Window resize handler
    window.addEventListener('resize', () => {
      this.maxIndex = Math.max(0, this.cards.length - this.getVisibleCardsCount());
      if (this.currentIndex > this.maxIndex) {
        this.currentIndex = this.maxIndex;
      }
      this.updateSlide();
    });

    // Touch & Swipe Support
    let startX = 0;
    let endX = 0;

    this.track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    this.track.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) this.next();
        else this.prev();
        this.resetAutoPlay();
      }
    }, { passive: true });

    // Keyboard navigation when focused
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.prev();
      } else if (e.key === 'ArrowRight') {
        this.next();
      }
    });

    // Hover pause
    this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
    this.container.addEventListener('mouseleave', () => this.startAutoPlay());

    this.updateSlide();
    this.startAutoPlay();
  }

  next() {
    this.maxIndex = Math.max(0, this.cards.length - this.getVisibleCardsCount());
    if (this.currentIndex < this.maxIndex) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Loop back
    }
    this.updateSlide();
  }

  prev() {
    this.maxIndex = Math.max(0, this.cards.length - this.getVisibleCardsCount());
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.maxIndex; // Loop to end
    }
    this.updateSlide();
  }

  updateSlide() {
    if (!this.cards[0]) return;
    const cardRect = this.cards[0].getBoundingClientRect();
    const gap = 20; // css gap
    const shiftAmount = (cardRect.width + gap) * this.currentIndex;

    this.track.style.transform = `translateX(-${shiftAmount}px)`;
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.next();
    }, 5500);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  resetAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.agCarousel = new AsianGamesCarousel('.ag-carousel-wrapper');
});
