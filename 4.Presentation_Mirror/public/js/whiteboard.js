/**
 * 🎨 Whiteboard & Laser Pointer Annotation Engine
 * 
 * [설계 철학 & 핵심 원리]
 * 1. 투명 Canvas 오버레이: 마크다운 문서 컨테이너 위에 완벽하게 포개어짐
 * 2. 해상도 독립적 벡터 좌표계 (Relative Coordinate System):
 *    - 사용자의 모니터 해상도가 달라도 비율(0.0~1.0)로 정규화하여 일치된 위치에 판서 재현
 * 3. 도구 모음: 펜(Pen), 형광펜(Highlighter), 레이저 포인터(Laser), 지우개(Eraser), Undo
 */

export class WhiteboardEngine {
  constructor(canvasElement, laserElement, hostElement, onStrokeAdded, onLaserMoved) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.laserDot = laserElement;
    this.host = hostElement; // #document-canvas-host
    
    // 콜백 함수 (서버 통신용)
    this.onStrokeAdded = onStrokeAdded;
    this.onLaserMoved = onLaserMoved;

    // 현재 설정 상태
    this.currentTool = 'cursor'; // 'cursor' | 'pen' | 'highlighter' | 'eraser' | 'laser'
    this.currentColor = '#ef4444'; // 기본 빨강
    this.currentSize = 4;
    this.isDrawing = false;
    this.currentStrokePoints = [];
    this.strokes = []; // 현재 문서의 전체 스트로크 목록
    this.isPresenter = false;

    this.initEvents();
    this.resize();

    // 윈도우 리사이즈 옵저버
    this.resizeObserver = new ResizeObserver(() => this.resize());
    if (this.host) this.resizeObserver.observe(this.host);
  }

  setPresenterMode(isPresenter) {
    this.isPresenter = isPresenter;
    if (!isPresenter) {
      this.setTool('cursor');
    }
  }

  setTool(tool) {
    this.currentTool = tool;
    if (tool === 'cursor') {
      this.canvas.classList.remove('drawing-active');
      this.hideLaser();
    } else {
      this.canvas.classList.add('drawing-active');
      if (tool !== 'laser') {
        this.hideLaser();
      }
    }
  }

  setColor(color) {
    this.currentColor = color;
  }

  setSize(size) {
    this.currentSize = size;
  }

  /**
   * 마크다운 본문 크기에 맞추어 캔버스 해상도를 조정하고 다시 그립니다.
   */
  resize() {
    if (!this.host || !this.canvas) return;

    const width = this.host.scrollWidth;
    const height = Math.max(this.host.scrollHeight, 800);

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.scale(dpr, dpr);
    this.redrawAll();
  }

  initEvents() {
    // 마우스 및 터치 이벤트 바인딩
    this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
    window.addEventListener('mousemove', (e) => this.handleMove(e));
    window.addEventListener('mouseup', (e) => this.handleEnd(e));

    // 터치 지원
    this.canvas.addEventListener('touchstart', (e) => this.handleStart(e.touches[0]));
    window.addEventListener('touchmove', (e) => this.handleMove(e.touches[0]));
    window.addEventListener('touchend', () => this.handleEnd());
  }

  getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0, normX: 0, normY: 0 };

    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const normX = Math.min(1.0, Math.max(0.0, relX / rect.width));
    const normY = Math.min(1.0, Math.max(0.0, relY / rect.height));

    const x = normX * (this.canvas.offsetWidth || rect.width);
    const y = normY * (this.canvas.offsetHeight || rect.height);

    return { x, y, normX, normY };
  }

  handleStart(e) {
    if (!this.isPresenter || this.currentTool === 'cursor') return;

    const pt = this.getCanvasPoint(e);
    if (pt.x < 0 || pt.y < 0 || pt.x > this.canvas.offsetWidth || pt.y > this.canvas.offsetHeight) return;

    this.isDrawing = true;
    this.currentStrokePoints = [pt];
    this.activeAnchorBlockId = this.detectAnchorBlock(pt.y);
  }

  detectAnchorBlock(canvasY) {
    if (!this.host) return null;
    const blocks = this.host.querySelectorAll('[data-block-id]');
    let closestBlockId = null;
    let minDistance = Infinity;

    blocks.forEach((block) => {
      const top = block.offsetTop;
      const height = block.offsetHeight;
      const center = top + height / 2;
      const dist = Math.abs(canvasY - center);
      if (dist < minDistance) {
        minDistance = dist;
        closestBlockId = block.getAttribute('data-block-id');
      }
    });

    return closestBlockId;
  }

  handleMove(e) {
    if (!this.isDrawing) return;

    const pt = this.getCanvasPoint(e);
    this.currentStrokePoints.push(pt);

    // 실시간 로컬 렌더링
    const prev = this.currentStrokePoints[this.currentStrokePoints.length - 2];
    this.drawSegment(prev, pt, this.currentTool, this.currentColor, this.currentSize);
  }

  handleEnd(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.currentStrokePoints.length > 0) {
      // 블록 기준 앵커 좌표 계산
      const anchorBlock = this.activeAnchorBlockId
        ? this.host.querySelector(`[data-block-id="${this.activeAnchorBlockId}"]`)
        : null;

      const anchorTop = anchorBlock ? anchorBlock.offsetTop : 0;
      const anchorNormY = anchorTop / (this.canvas.offsetHeight || 1);

      // 정규화된 포인트로 스트로크 데이터 패키징 (블록 앵커 오프셋 포함)
      const strokeData = {
        tool: this.currentTool,
        color: this.currentColor,
        size: this.currentSize,
        anchorBlockId: this.activeAnchorBlockId,
        anchorNormY: anchorNormY,
        points: this.currentStrokePoints.map(p => ({
          nx: p.normX,
          ny: p.normY,
          relY: p.normY - anchorNormY // 앵커 블록 기준 상대 Y 오프셋
        }))
      };

      this.strokes.push(strokeData);
      if (this.onStrokeAdded) {
        this.onStrokeAdded(strokeData);
      }
    }

    this.currentStrokePoints = [];
    this.activeAnchorBlockId = null;
  }

  /**
   * 점과 점 사이의 세그먼트를 캔버스에 그립니다.
   */
  drawSegment(p1, p2, tool, color, size) {
    if (!p1 || !p2) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
      this.ctx.lineWidth = size * 4;
    } else {
      this.ctx.globalAlpha = 1.0;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = size;
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * 전체 스트로크 목록을 화면에 다시 렌더링합니다. (블록 앵커 자동 보정)
   */
  redrawAll() {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    this.ctx.clearRect(0, 0, w, h);

    for (const stroke of this.strokes) {
      if (!stroke.points || stroke.points.length < 2) continue;

      // 앵커 블록 기반 상대 Y 위치 재계산
      let yOffsetMultiplier = 0;
      let useAnchor = false;

      if (stroke.anchorBlockId && this.host) {
        const anchorEl = this.host.querySelector(`[data-block-id="${stroke.anchorBlockId}"]`);
        if (anchorEl) {
          const currentAnchorNormY = anchorEl.offsetTop / (h || 1);
          yOffsetMultiplier = currentAnchorNormY;
          useAnchor = true;
        }
      }

      this.ctx.save();
      this.ctx.beginPath();

      const first = stroke.points[0];
      const startX = first.nx * w;
      const startY = useAnchor && first.relY !== undefined
        ? (yOffsetMultiplier + first.relY) * h
        : first.ny * h;

      this.ctx.moveTo(startX, startY);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        const px = pt.nx * w;
        const py = useAnchor && pt.relY !== undefined
          ? (yOffsetMultiplier + pt.relY) * h
          : pt.ny * h;

        this.ctx.lineTo(px, py);
      }

      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (stroke.tool === 'eraser') {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.strokeStyle = 'rgba(0,0,0,1)';
        this.ctx.lineWidth = stroke.size * 4;
      } else {
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineWidth = stroke.size;
      }

      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  /**
   * 원격에서 전달받은 신규 스트로크 추가 및 렌더링
   */
  addRemoteStroke(stroke) {
    this.strokes.push(stroke);
    this.redrawAll();
  }

  /**
   * 원격에서 스트로크 전체 갱신 (Undo 등)
   */
  setStrokes(strokes) {
    this.strokes = strokes || [];
    this.redrawAll();
  }

  /**
   * 전체 판서 지우기
   */
  clear() {
    this.strokes = [];
    this.redrawAll();
  }

  /**
   * 레이저 포인터 위치 업데이트
   */
  updateLaser(normX, normY, visible) {
    if (!this.laserDot || !this.host) return;

    if (!visible) {
      this.hideLaser();
      return;
    }

    const hostW = this.host.offsetWidth;
    const hostH = this.host.offsetHeight;
    const px = normX * hostW;
    const py = normY * hostH;

    this.laserDot.style.display = 'block';
    this.laserDot.style.left = `${px}px`;
    this.laserDot.style.top = `${py}px`;
  }

  hideLaser() {
    if (this.laserDot) {
      this.laserDot.style.display = 'none';
    }
  }
}
