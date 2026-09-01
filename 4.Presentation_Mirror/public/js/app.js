/**
 * 🚀 Presentation Mirror - Main Client Application
 * 
 * [오케스트레이션 개요]
 * - UI 이벤트 및 사이드바 내비게이션 트리 바인딩
 * - MarkdownRenderer, WhiteboardEngine, SyncEngine 유기적 결합
 * - 수강생 자유 탐색(Free Browsing) 감지 및 원클릭 복귀(Catch-up) 인터랙션
 */

import { MarkdownRenderer } from './markdownRenderer.js';
import { WhiteboardEngine } from './whiteboard.js';
import { SyncEngine } from './syncEngine.js';
import { ScreenShareManager } from './screenShare.js';
import { TextAnnotationEngine } from './textAnnotation.js';
import { NotepadEngine } from './notepad.js';

class PresentationApp {
  constructor() {
    this.currentDocPath = '';
    this.allDocPaths = []; // 다음/이전 문서 이동용 평탄화 배열
    this.currentZoom = 1.0;
    this.sourceMode = 'markdown'; // 'markdown' | 'notepad' | 'desktop'
    this.activeTool = 'cursor';
    this.activeColor = '#ef4444';
    this.remoteCursorFadeTimer = null;
    this.userInteractedTimeout = null;
    this.mediaConfigPromise = null;
    this.viewerConnectionGeneration = 0;
    this.isScreenShareTransitioning = false;

    // DOM 요소 캐싱
    this.dom = {
      sidebar: document.getElementById('sidebar'),
      btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
      btnCloseSidebar: document.getElementById('btn-close-sidebar'),
      btnTreeToggleAll: document.getElementById('btn-tree-toggle-all'),
      treeToggleText: document.getElementById('tree-toggle-text'),
      sidebarTree: document.getElementById('sidebar-tree'),
      inputSearch: document.getElementById('sidebar-search-input'),
      currentDocTitle: document.getElementById('current-doc-title'),
      currentSourceIcon: document.getElementById('current-source-icon'),
      statusPill: document.getElementById('status-pill'),
      clientCountBadge: document.getElementById('client-count-badge'),
      syncToggle: document.getElementById('sync-mode-toggle'),
      viewerContainer: document.getElementById('viewer-container'),
      zoomWrapper: document.getElementById('content-zoom-wrapper'),
      zoomControls: document.getElementById('zoom-controls'),
      canvasHost: document.getElementById('document-canvas-host'),
      markdownContent: document.getElementById('markdown-content'),
      whiteboardCanvas: document.getElementById('whiteboard-canvas'),
      laserDot: document.getElementById('laser-pointer-dot'),
      presenterLiveCursor: document.getElementById('presenter-live-cursor'),
      presenterCursorIcon: document.getElementById('presenter-cursor-icon'),
      presenterCursorBadge: document.getElementById('presenter-cursor-badge'),
      presenterToolbar: document.getElementById('presenter-toolbar'),
      btnModeMarkdown: document.getElementById('tool-btn-mode-markdown'),
      btnModeNotepad: document.getElementById('tool-btn-mode-notepad'),
      btnScreenShare: document.getElementById('tool-btn-screen-share'),
      notepadStage: document.getElementById('notepad-stage'),
      notepadToolbar: document.getElementById('notepad-formatting-toolbar'),
      notepadTitleInput: document.getElementById('notepad-title-input'),
      notepadEditor: document.getElementById('notepad-editor'),
      notepadFileInput: document.getElementById('notepad-file-input'),
      btnNotepadCopy: document.getElementById('btn-notepad-copy'),
      btnNotepadExportMd: document.getElementById('btn-notepad-export-md'),
      btnNotepadClear: document.getElementById('btn-notepad-clear'),
      desktopShareStage: document.getElementById('desktop-share-stage'),
      desktopShareVideo: document.getElementById('desktop-share-video'),
      desktopShareState: document.getElementById('desktop-share-state'),
      desktopShareStateIcon: document.getElementById('desktop-share-state-icon'),
      desktopShareStateTitle: document.getElementById('desktop-share-state-title'),
      desktopShareStateDetail: document.getElementById('desktop-share-state-detail'),
      desktopLiveBadge: document.getElementById('desktop-live-badge'),
      btnRetryScreenShare: document.getElementById('btn-retry-screen-share'),
      btnCatchUp: document.getElementById('btn-catch-up'),
      btnThemeToggle: document.getElementById('btn-theme-toggle'),
      btnPresenterLogin: document.getElementById('btn-presenter-login'),
      btnShareLink: document.getElementById('btn-share-link'),
      btnZoomIn: document.getElementById('btn-zoom-in'),
      btnZoomOut: document.getElementById('btn-zoom-out'),
      btnZoomReset: document.getElementById('btn-zoom-reset'),
      zoomLevelDisplay: document.getElementById('zoom-level-display'),
      modalAuth: document.getElementById('modal-presenter-auth'),
      inputPin: document.getElementById('input-presenter-pin'),
      btnPinSubmit: document.getElementById('btn-pin-submit'),
      btnPinCancel: document.getElementById('btn-pin-cancel'),
      modalHostIps: document.getElementById('modal-host-ips'),
      hostIpList: document.getElementById('host-ip-list'),
      btnHostModalClose: document.getElementById('btn-host-modal-close'),
      toastContainer: document.getElementById('toast-container')
    };

    this.renderer = new MarkdownRenderer();
    this.initScreenShare();
    this.initSyncEngine();
    this.initWhiteboard();
    this.initTextAnnotation();
    this.initNotepad();
    this.initLiveCursorTracking();
    this.initUIEvents();
    this.initTheme();
    document.body.dataset.sourceMode = 'markdown';
    
    // 모바일 기기 접속 시 사이드바 기본 닫힘 처리
    if (window.innerWidth <= 768) {
      this.dom.sidebar.classList.add('collapsed');
    }

    void this.loadRuntimeConfig().catch(error => console.warn('미디어 설정 사전 로드 실패:', error));
    this.loadDocTree();
  }

  initNotepad() {
    this.notepad = new NotepadEngine({
      container: this.dom.notepadStage?.querySelector('.notepad-content-wrapper'),
      titleEl: this.dom.notepadTitleInput,
      editorEl: this.dom.notepadEditor,
      toolbarEl: this.dom.notepadToolbar,
      fileInput: this.dom.notepadFileInput,
      onContentChange: (title, content) => {
        this.sync.broadcastNotepadUpdate(title, content);
      },
      onScrollChange: (ratio) => {
        this.sync.broadcastNotepadScroll(ratio);
      },
      showToast: (msg) => this.showToast(msg)
    });

    if (this.dom.btnNotepadCopy) {
      this.dom.btnNotepadCopy.addEventListener('click', () => this.notepad.copyMarkdownToClipboard());
    }
    if (this.dom.btnNotepadExportMd) {
      this.dom.btnNotepadExportMd.addEventListener('click', () => this.notepad.exportMarkdownFile());
    }
    if (this.dom.btnNotepadClear) {
      this.dom.btnNotepadClear.addEventListener('click', () => {
        if (confirm('실시간 라이브 노트 내용을 모두 지우시겠습니까?')) {
          this.notepad.clear();
          this.sync.broadcastClearNotepad();
        }
      });
    }
  }

  initScreenShare() {
    this.screenShare = new ScreenShareManager({
      videoElement: this.dom.desktopShareVideo,
      onCaptureEnded: () => this.handleCaptureEnded(),
      onStateChange: (state) => {
        this.screenShareConnectionState = state;
      }
    });
  }

  async loadRuntimeConfig() {
    if (this.mediaConfigPromise) return this.mediaConfigPromise;

    this.mediaConfigPromise = fetch('/api/runtime-config')
      .then(async (response) => {
        if (!response.ok) throw new Error('화면 공유 설정을 불러오지 못했습니다.');
        const data = await response.json();
        const media = data.media || {};
        const baseUrl = media.baseUrl
          || `${window.location.protocol}//${window.location.hostname}:${media.port || 8889}`;
        const config = {
          baseUrl,
          path: media.path || 'presentation'
        };
        this.screenShare.setConfig(config);
        return config;
      })
      .catch((error) => {
        this.mediaConfigPromise = null;
        throw error;
      });

    return this.mediaConfigPromise;
  }

  async startDesktopShare() {
    if (!this.sync.isPresenter || this.isScreenShareTransitioning) return;

    this.isScreenShareTransitioning = true;
    this.updateScreenShareButton('requesting');

    try {
      await this.loadRuntimeConfig();
      await this.screenShare.startPublishing();

      const response = await this.sync.broadcastSourceMode('desktop');
      if (!response?.success) {
        throw new Error(response?.message || '수강생 화면을 데스크톱 모드로 전환하지 못했습니다.');
      }

      await this.applySourceMode('desktop');
      this.showToast('<i class="fas fa-display"></i> 전체 화면 공유를 시작했습니다. 코딩 도구로 전환하세요.');
    } catch (error) {
      await this.screenShare.stopPublishing();
      await this.applySourceMode('markdown');
      this.showToast(`<i class="fas fa-circle-exclamation"></i> ${this.getScreenShareErrorMessage(error)}`);
    } finally {
      this.isScreenShareTransitioning = false;
      this.updateScreenShareButton(this.sourceMode === 'desktop' ? 'live' : 'idle');
    }
  }

  async stopDesktopShare({ announce = true, targetMode = 'markdown' } = {}) {
    if (this.isScreenShareTransitioning) return;

    this.isScreenShareTransitioning = true;
    this.updateScreenShareButton('stopping');

    try {
      await this.screenShare.stopPublishing();
      if (this.sync.isPresenter) {
        await this.sync.broadcastSourceMode(targetMode);
      }
      await this.applySourceMode(targetMode);
      if (announce) {
        const modeLabel = targetMode === 'notepad' ? '라이브 노트' : '교재';
        this.showToast(`<i class="fas fa-file-lines"></i> 화면 공유를 종료하고 ${modeLabel}로 돌아왔습니다.`);
      }
    } finally {
      this.isScreenShareTransitioning = false;
      this.updateScreenShareButton('idle');
    }
  }

  handleCaptureEnded() {
    if (!this.sync.isPresenter) return;
    void this.stopDesktopShare({ announce: true, targetMode: 'markdown' });
  }

  async applySourceMode(sourceMode) {
    let nextMode = 'markdown';
    if (sourceMode === 'desktop') nextMode = 'desktop';
    else if (sourceMode === 'notepad') nextMode = 'notepad';

    this.sourceMode = nextMode;
    document.body.dataset.sourceMode = nextMode;
    this.updateModeButtons(nextMode);

    if (nextMode === 'desktop') {
      this.dom.zoomWrapper.classList.add('hidden');
      if (this.dom.notepadStage) this.dom.notepadStage.classList.add('hidden');
      this.dom.desktopShareStage.classList.remove('hidden');
      if (this.dom.currentSourceIcon) this.dom.currentSourceIcon.className = 'fas fa-display';
      if (this.dom.currentDocTitle) this.dom.currentDocTitle.textContent = '데스크톱 화면 공유';
      this.dom.viewerContainer.scrollTop = 0;
      this.whiteboard.setTool('cursor');

      if (this.sync.isPresenter) {
        await this.screenShare.stopViewing();
        this.setDesktopShareState('presenter');
      } else {
        await this.connectDesktopViewer();
      }
    } else if (nextMode === 'notepad') {
      this.viewerConnectionGeneration += 1;
      await this.screenShare.stopViewing();
      this.dom.desktopShareStage.classList.add('hidden');
      this.dom.desktopShareStage.className = 'desktop-share-stage hidden';
      this.dom.desktopLiveBadge.classList.add('hidden');
      this.dom.zoomWrapper.classList.add('hidden');
      if (this.dom.notepadStage) this.dom.notepadStage.classList.remove('hidden');

      if (this.dom.currentSourceIcon) this.dom.currentSourceIcon.className = 'fas fa-edit';
      if (this.dom.currentDocTitle) this.dom.currentDocTitle.textContent = '실시간 라이브 노트';

      this.whiteboard.setTool('cursor');
    } else {
      // markdown
      this.viewerConnectionGeneration += 1;
      await this.screenShare.stopViewing();
      this.dom.desktopShareStage.classList.add('hidden');
      this.dom.desktopShareStage.className = 'desktop-share-stage hidden';
      this.dom.desktopLiveBadge.classList.add('hidden');
      if (this.dom.notepadStage) this.dom.notepadStage.classList.add('hidden');
      this.dom.zoomWrapper.classList.remove('hidden');

      if (this.dom.currentSourceIcon) this.dom.currentSourceIcon.className = 'fas fa-file-alt';
      if (this.dom.currentDocTitle) this.dom.currentDocTitle.textContent = this.getDocName(this.currentDocPath);
      setTimeout(() => this.whiteboard.resize(), 50);
    }

    this.updateScreenShareButton(nextMode === 'desktop' ? 'live' : 'idle');
    if (this.sync.isPresenter) {
      this.updatePresenterStatus(true, true);
    } else {
      this.updateSyncUIState(this.sync.followMode);
    }
  }

  updateModeButtons(mode) {
    if (this.dom.btnModeMarkdown) this.dom.btnModeMarkdown.classList.toggle('active', mode === 'markdown');
    if (this.dom.btnModeNotepad) this.dom.btnModeNotepad.classList.toggle('active', mode === 'notepad');
    if (this.dom.btnScreenShare) this.dom.btnScreenShare.classList.toggle('active', mode === 'desktop');
  }

  async connectDesktopViewer() {
    const generation = ++this.viewerConnectionGeneration;
    this.setDesktopShareState('connecting');

    try {
      await this.loadRuntimeConfig();
    } catch (error) {
      if (generation === this.viewerConnectionGeneration) {
        this.setDesktopShareState('error', this.getScreenShareErrorMessage(error));
      }
      return;
    }

    const maxAttempts = 8;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (generation !== this.viewerConnectionGeneration || this.sourceMode !== 'desktop') return;

      try {
        await this.screenShare.startViewing();
        if (generation !== this.viewerConnectionGeneration || this.sourceMode !== 'desktop') {
          await this.screenShare.stopViewing();
          return;
        }
        this.setDesktopShareState('live');
        return;
      } catch (error) {
        if (generation !== this.viewerConnectionGeneration || this.sourceMode !== 'desktop') return;

        if (attempt === maxAttempts) {
          this.setDesktopShareState('error', this.getScreenShareErrorMessage(error));
          return;
        }

        this.setDesktopShareState('connecting', `강사 영상 신호를 찾는 중입니다. (${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, Math.min(500 * attempt, 2000)));
      }
    }
  }

  setDesktopShareState(state, detail = '') {
    const isLive = state === 'live' || state === 'presenter';
    const isPresenter = state === 'presenter';
    const isError = state === 'error';

    if (this.sourceMode !== 'desktop') {
      this.dom.desktopShareStage.className = 'desktop-share-stage hidden';
      return;
    }

    this.dom.desktopShareStage.className = [
      'desktop-share-stage',
      isLive ? 'is-live' : '',
      isPresenter ? 'presenter-view' : ''
    ].filter(Boolean).join(' ');
    this.dom.desktopShareState.className = `desktop-share-state ${isError ? 'is-error' : 'is-loading'}`;
    this.dom.btnRetryScreenShare.classList.toggle('hidden', !isError);
    this.dom.desktopLiveBadge.classList.toggle('hidden', !isLive);

    if (state === 'presenter') {
      this.dom.desktopShareStateIcon.innerHTML = '<i class="fas fa-tower-broadcast"></i>';
      this.dom.desktopShareStateTitle.textContent = '전체 화면을 공유하고 있습니다';
      this.dom.desktopShareStateDetail.textContent = '이제 VS Code나 다른 코딩 도구로 전환해도 수강생 화면에 계속 표시됩니다.';
    } else if (state === 'live') {
      this.dom.desktopShareStateIcon.innerHTML = '<i class="fas fa-display"></i>';
      this.dom.desktopShareStateTitle.textContent = '강사 화면 연결됨';
      this.dom.desktopShareStateDetail.textContent = '';
    } else if (state === 'error') {
      this.dom.desktopShareStateIcon.innerHTML = '<i class="fas fa-triangle-exclamation"></i>';
      this.dom.desktopShareStateTitle.textContent = '강사 화면에 연결할 수 없습니다';
      this.dom.desktopShareStateDetail.textContent = detail || 'MediaMTX 실행 상태와 네트워크 연결을 확인한 뒤 다시 시도해 주세요.';
    } else {
      this.dom.desktopShareStateIcon.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
      this.dom.desktopShareStateTitle.textContent = '강사 화면 연결 중';
      this.dom.desktopShareStateDetail.textContent = detail || '실시간 영상 신호를 준비하고 있습니다.';
    }
  }

  updateScreenShareButton(state) {
    const isLive = state === 'live';
    const isBusy = ['requesting', 'stopping'].includes(state);
    this.dom.btnScreenShare.disabled = isBusy;
    this.dom.btnScreenShare.classList.toggle('is-sharing', isLive);
    this.dom.btnScreenShare.setAttribute('aria-pressed', String(isLive));

    if (state === 'requesting') {
      this.dom.btnScreenShare.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i><span>화면 선택 중</span>';
    } else if (state === 'stopping') {
      this.dom.btnScreenShare.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i><span>종료 중</span>';
    } else if (isLive) {
      this.dom.btnScreenShare.innerHTML = '<i class="fas fa-stop"></i><span>공유 종료</span>';
    } else {
      this.dom.btnScreenShare.innerHTML = '<i class="fas fa-display"></i><span>화면 공유</span>';
    }
  }

  getScreenShareErrorMessage(error) {
    if (error?.name === 'NotAllowedError') {
      return '화면 공유가 취소되었거나 권한이 거부되었습니다.';
    }
    if (error?.name === 'NotReadableError') {
      return '운영체제가 선택한 화면을 캡처하지 못했습니다. 다른 화면을 선택해 주세요.';
    }
    if (this.sync?.isPresenter && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && !/^127\./.test(window.location.hostname)) {
      return '강사 화면 캡처는 localhost 또는 HTTPS에서만 시작할 수 있습니다.';
    }
    if (error?.status === 404) {
      return '아직 강사 영상 신호가 시작되지 않았습니다.';
    }
    return error?.message || '화면 공유 연결 중 알 수 없는 오류가 발생했습니다.';
  }

  // ----------------------------------------------------
  // 1. SyncEngine 초기화 및 소켓 리스너 연결
  // ----------------------------------------------------
  initSyncEngine() {
    this.sync = new SyncEngine({
      onInit: (data) => {
        this.updateClientCount(data.clientCount);
        this.updatePresenterStatus(data.hasPresenter, data.isYouPresenter);

        if (data.notepad) {
          this.notepad.setDocument(data.notepad.title, data.notepad.content);
        }
        if (data.currentDoc) {
          this.loadDocument(data.currentDoc, data.scrollRatio, data.strokes, data.annotations);
        }
        if (data.zoomLevel) {
          this.setZoom(data.zoomLevel, false);
        }
        if (data.sourceMode && data.sourceMode !== 'markdown') {
          void this.applySourceMode(data.sourceMode);
        }
      },
      onPresenterChanged: (hasPresenter) => {
        this.updatePresenterStatus(hasPresenter, this.sync.isPresenter);
      },
      onClientCountUpdated: (count) => {
        this.updateClientCount(count);
      },
      onRemoteDocChanged: (data) => {
        this.showToast(`📄 강사가 '${this.getDocName(data.docPath)}' 문서를 열었습니다.`);
        this.loadDocument(data.docPath, data.scrollRatio, data.strokes, data.annotations);
      },
      onRemoteScrollSynced: (scrollRatio) => {
        this.applyScrollRatio(scrollRatio);
      },
      onRemoteZoomSynced: (zoomLevel) => {
        this.setZoom(zoomLevel, false);
      },
      onRemoteSourceModeChanged: (sourceMode) => {
        void this.applySourceMode(sourceMode);
      },
      onRemoteNotepadUpdated: (data) => {
        this.notepad.setDocument(data.title, data.content);
      },
      onRemoteNotepadScrollSynced: (scrollRatio) => {
        this.notepad.setScrollRatio(scrollRatio);
      },
      onRemoteNotepadCleared: (data) => {
        this.notepad.clear();
        this.showToast('📝 강사가 라이브 노트를 초기화했습니다.');
      },
      onRemoteStrokeAdded: (docPath, stroke) => {
        if (this.currentDocPath === docPath) {
          this.whiteboard.addRemoteStroke(stroke);
        }
      },
      onRemoteStrokesCleared: (docPath) => {
        if (this.currentDocPath === docPath) {
          this.whiteboard.clear();
        }
      },
      onRemoteStrokesUpdated: (docPath, strokes) => {
        if (this.currentDocPath === docPath) {
          this.whiteboard.setStrokes(strokes);
        }
      },
      onRemoteAnnotationAdded: (docPath, annotation) => {
        if (this.currentDocPath === docPath) {
          this.textAnnotation.addAnnotation(annotation);
        }
      },
      onRemoteAnnotationRemoved: (docPath, annotationId) => {
        if (this.currentDocPath === docPath) {
          this.textAnnotation.removeAnnotation(annotationId);
        }
      },
      onRemoteAnnotationsCleared: (docPath) => {
        if (this.currentDocPath === docPath) {
          this.textAnnotation.clear();
        }
      },
      onRemoteAnnotationsUpdated: (docPath, annotations) => {
        if (this.currentDocPath === docPath) {
          this.textAnnotation.renderAll(annotations);
        }
      },
      onRemoteCursorMoved: (cursorData) => {
        this.renderRemoteCursor(cursorData);
      },
      onFollowModeChanged: (isFollow) => {
        this.updateSyncUIState(isFollow);
      }
    });
  }

  // ----------------------------------------------------
  // 2. Whiteboard & TextAnnotation 엔진 초기화
  // ----------------------------------------------------
  initWhiteboard() {
    this.whiteboard = new WhiteboardEngine(
      this.dom.whiteboardCanvas,
      this.dom.laserDot,
      this.dom.canvasHost,
      (stroke) => {
        this.sync.broadcastStroke(this.currentDocPath, stroke);
      },
      (x, y, visible) => {
        // laser optional
      }
    );
  }

  initTextAnnotation() {
    this.textAnnotation = new TextAnnotationEngine(
      this.dom.markdownContent,
      (annotation) => {
        this.sync.broadcastAnnotation(this.currentDocPath, annotation);
      },
      (annotationId) => {
        this.sync.broadcastRemoveAnnotation(this.currentDocPath, annotationId);
      }
    );
  }

  // ----------------------------------------------------
  // 2-1. 강사 실시간 도구 커서 포인터 동기화
  // ----------------------------------------------------
  initLiveCursorTracking() {
    const host = this.dom.canvasHost;
    if (!host) return;

    const handlePointerMove = (e) => {
      if (!this.sync.isPresenter || this.sourceMode !== 'markdown') return;

      const rect = host.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || y < 0 || x > host.offsetWidth || y > host.offsetHeight) {
        this.sync.broadcastCursorMove({ visible: false });
        return;
      }

      const normX = x / (host.offsetWidth || 1);
      const normY = y / (host.offsetHeight || 1);
      const anchorBlockId = this.whiteboard.detectAnchorBlock(y);

      let relY = 0;
      if (anchorBlockId) {
        const anchorEl = host.querySelector(`[data-block-id="${anchorBlockId}"]`);
        if (anchorEl) {
          const anchorNormY = anchorEl.offsetTop / (host.offsetHeight || 1);
          relY = normY - anchorNormY;
        }
      }

      this.sync.broadcastCursorMove({
        docPath: this.currentDocPath,
        normX,
        normY,
        anchorBlockId,
        relY,
        tool: this.activeTool,
        color: this.activeColor,
        visible: true
      });
    };

    host.addEventListener('mousemove', handlePointerMove);
    host.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) handlePointerMove(e.touches[0]);
    }, { passive: true });

    host.addEventListener('mouseleave', () => {
      if (this.sync.isPresenter) {
        this.sync.broadcastCursorMove({ visible: false });
      }
    });
  }

  renderRemoteCursor(cursorData) {
    const cursorEl = this.dom.presenterLiveCursor;
    if (!cursorEl || !this.dom.canvasHost) return;

    if (!cursorData || !cursorData.visible || (cursorData.docPath && cursorData.docPath !== this.currentDocPath)) {
      cursorEl.classList.add('hidden');
      return;
    }

    const host = this.dom.canvasHost;
    const hostW = host.offsetWidth;
    const hostH = host.offsetHeight;

    let targetY = cursorData.normY * hostH;

    // 앵커 블록 기준 상대 Y 위치 보정
    if (cursorData.anchorBlockId) {
      const anchorEl = host.querySelector(`[data-block-id="${cursorData.anchorBlockId}"]`);
      if (anchorEl && cursorData.relY !== undefined) {
        targetY = anchorEl.offsetTop + cursorData.relY * hostH;
      }
    }

    const targetX = cursorData.normX * hostW;

    // 도구별 아이콘 및 뱃지 텍스트 갱신
    cursorEl.dataset.tool = cursorData.tool || 'cursor';

    if (this.dom.presenterCursorIcon) {
      let iconClass = 'fas fa-mouse-pointer';
      let badgeText = '강사';

      if (cursorData.tool === 'highlight') {
        iconClass = 'fas fa-highlighter';
        badgeText = '형광펜';
      } else if (cursorData.tool === 'underline') {
        iconClass = 'fas fa-underline';
        badgeText = '밑줄';
      } else if (cursorData.tool === 'draw') {
        iconClass = 'fas fa-paint-brush';
        badgeText = '판서';
      } else if (cursorData.tool === 'eraser') {
        iconClass = 'fas fa-eraser';
        badgeText = '지우개';
      }

      this.dom.presenterCursorIcon.className = iconClass;
      if (this.dom.presenterCursorBadge) {
        this.dom.presenterCursorBadge.innerText = badgeText;
      }
    }

    cursorEl.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
    cursorEl.classList.remove('hidden');

    // 2.5초 동안 입력 없으면 자동 숨김
    clearTimeout(this.remoteCursorFadeTimer);
    this.remoteCursorFadeTimer = setTimeout(() => {
      cursorEl.classList.add('hidden');
    }, 2500);
  }

  // ----------------------------------------------------
  // 3. UI 및 사용자 인터랙션 이벤트 바인딩
  // ----------------------------------------------------
  initUIEvents() {
    // 1) 사이드바 열기/닫기 토글
    this.dom.btnToggleSidebar.addEventListener('click', () => {
      this.dom.sidebar.classList.toggle('collapsed');
      setTimeout(() => this.whiteboard.resize(), 300);
    });

    if (this.dom.btnCloseSidebar) {
      this.dom.btnCloseSidebar.addEventListener('click', () => {
        this.dom.sidebar.classList.add('collapsed');
        setTimeout(() => this.whiteboard.resize(), 300);
      });
    }

    // 1-1) 교육자료 목차 모두 접기/모두 펴기 토글
    if (this.dom.btnTreeToggleAll) {
      this.dom.btnTreeToggleAll.addEventListener('click', () => {
        this.toggleAllFolders();
      });
    }

    // 2) 사이드바 검색
    this.dom.inputSearch.addEventListener('input', (e) => {
      this.filterSidebarTree(e.target.value.trim().toLowerCase());
    });

    // 3) 수강생 동기화 스위치 토글
    this.dom.syncToggle.addEventListener('change', (e) => {
      if (this.sync.isPresenter) {
        this.dom.syncToggle.checked = true;
        return;
      }
      this.sync.setFollowMode(e.target.checked);
      if (e.target.checked) {
        this.catchUpToPresenter();
      } else if (this.sourceMode === 'desktop') {
        void this.applySourceMode('markdown');
      }
    });

    // 4) 강사 화면 따라가기 (Catch Up) 버튼 클릭
    this.dom.btnCatchUp.addEventListener('click', () => {
      this.catchUpToPresenter();
    });

    // 5) 뷰어 수동 조작 감지 및 스크롤 동기화
    let isUserDirectInteracting = false;
    let userInteractTimer = null;

    const markUserInteraction = () => {
      isUserDirectInteracting = true;
      clearTimeout(userInteractTimer);
      userInteractTimer = setTimeout(() => {
        isUserDirectInteracting = false;
      }, 800);
    };

    this.dom.viewerContainer.addEventListener('wheel', markUserInteraction, { passive: true });
    this.dom.viewerContainer.addEventListener('touchstart', markUserInteraction, { passive: true });
    this.dom.viewerContainer.addEventListener('touchmove', markUserInteraction, { passive: true });
    this.dom.viewerContainer.addEventListener('pointerdown', markUserInteraction, { passive: true });

    this.dom.viewerContainer.addEventListener('scroll', () => {
      // 프로그램에 의해 실행된 스크롤(강사 동기화, 페이지 전환 등)은 완전히 무시
      if (this.sync.isProgrammaticScroll) return;

      if (this.sync.isPresenter) {
        // 강사 스크롤 -> 상대 비율 계산 후 실시간 브로드캐스트
        const ratio = this.getScrollRatio();
        this.sync.broadcastScroll(ratio);
      } else {
        // 수강생이 '실제로 휠이나 터치로 직접 스크롤했을 때만' 자유 모드로 전환
        if (isUserDirectInteracting && this.sync.followMode) {
          this.sync.setFollowMode(false);
          this.showToast('🟡 수동 스크롤로 자유 탐색 모드로 전환되었습니다.');
          isUserDirectInteracting = false;
        }
      }
    }, { passive: true });

    // 6) 줌 컨트롤
    this.dom.btnZoomIn.addEventListener('click', () => this.adjustZoom(0.1));
    this.dom.btnZoomOut.addEventListener('click', () => this.adjustZoom(-0.1));
    this.dom.btnZoomReset.addEventListener('click', () => this.setZoom(1.0, true));

    // 7) 테마 전환
    this.dom.btnThemeToggle.addEventListener('click', () => this.toggleTheme());

    // 8) 강사 로그인 모달
    this.dom.btnPresenterLogin.addEventListener('click', async () => {
      if (this.sync.isPresenter) {
        // 로그아웃 확인
        if (confirm('강사 권한을 반납하시겠습니까?')) {
          if (this.sourceMode === 'desktop' || this.screenShare.publisher) {
            await this.stopDesktopShare({ announce: false });
          }
          this.sync.releasePresenter();
          this.updatePresenterStatus(this.sync.hasPresenter, false);
          this.showToast('강사 모드가 종료되었습니다.');
        }
      } else {
        this.dom.modalAuth.classList.add('active');
        this.dom.inputPin.value = '';
        this.dom.inputPin.focus();
      }
    });

    this.dom.btnPinCancel.addEventListener('click', () => {
      this.dom.modalAuth.classList.remove('active');
    });

    this.dom.btnPinSubmit.addEventListener('click', () => this.submitPresenterPin());
    this.dom.inputPin.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submitPresenterPin();
    });

    // 8-1) 호스트 IP 및 접속 링크 안내 모달
    this.dom.btnShareLink.addEventListener('click', () => this.showHostIpModal());
    this.dom.btnHostModalClose.addEventListener('click', () => {
      this.dom.modalHostIps.classList.remove('active');
    });

    // 9) 강사 판서 툴바 도구 선택
    this.initToolbarEvents();

    this.dom.btnRetryScreenShare.addEventListener('click', () => {
      void this.connectDesktopViewer();
    });

    // 10) 단축키 지원
    window.addEventListener('keydown', (e) => this.handleGlobalShortcuts(e));
    window.addEventListener('beforeunload', () => {
      void this.screenShare.stopAll();
    });
  }

  initToolbarEvents() {
    const toolBtns = this.dom.presenterToolbar.querySelectorAll('[data-tool]');
    toolBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tool = btn.getAttribute('data-tool');
        this.activeTool = tool;

        if (tool === 'cursor') {
          this.whiteboard.setTool('cursor');
          this.textAnnotation.setMode('cursor');
          document.body.classList.remove('eraser-mode');
        } else if (tool === 'highlight') {
          this.whiteboard.setTool('cursor');
          this.textAnnotation.setMode('highlight');
          document.body.classList.remove('eraser-mode');
          this.showToast('🖍️ 형광펜 모드: 원하는 텍스트를 마우스로 드래그하면 형광펜이 칠해집니다.');
        } else if (tool === 'underline') {
          this.whiteboard.setTool('cursor');
          this.textAnnotation.setMode('underline');
          document.body.classList.remove('eraser-mode');
          this.showToast('📏 밑줄 모드: 원하는 텍스트를 마우스로 드래그하면 밑줄이 그어집니다.');
        } else if (tool === 'draw') {
          this.whiteboard.setTool('pen');
          this.textAnnotation.setMode('draw');
          document.body.classList.remove('eraser-mode');
          this.showToast('🎨 자유 판서 모드: 마우스로 그림이나 도표 위에 자유롭게 판서합니다.');
        } else if (tool === 'eraser') {
          this.whiteboard.setTool('eraser');
          this.textAnnotation.setMode('eraser');
          document.body.classList.add('eraser-mode');
          this.showToast('🧽 지우개 모드: 삭제할 밑줄/형광펜을 클릭하거나 판서를 문지릅니다.');
        }
      });
    });

    // 색상 팔레트
    const colorDots = this.dom.presenterToolbar.querySelectorAll('[data-color]');
    colorDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const color = dot.getAttribute('data-color');
        this.activeColor = color;
        this.whiteboard.setColor(color);
        this.textAnnotation.setColor(color);
      });
    });

    // 판서 및 어노테이션 전체 지우기
    const btnClear = document.getElementById('tool-btn-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('현재 문서의 모든 밑줄, 형광펜, 판서를 지우시겠습니까?')) {
          this.whiteboard.clear();
          this.textAnnotation.clear();
          this.sync.broadcastClearAll(this.currentDocPath);
        }
      });
    }

    // 실행 취소 (Undo)
    const btnUndo = document.getElementById('tool-btn-undo');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        this.sync.broadcastUndoStroke(this.currentDocPath);
        this.sync.broadcastUndoAnnotation(this.currentDocPath);
      });
    }

    // 이전/다음 문서 내비게이션
    const btnPrevDoc = document.getElementById('tool-btn-prev');
    const btnNextDoc = document.getElementById('tool-btn-next');
    if (btnPrevDoc) btnPrevDoc.addEventListener('click', () => this.navigateDoc(-1));
    if (btnNextDoc) btnNextDoc.addEventListener('click', () => this.navigateDoc(1));

    // 전체화면 토글
    const btnFullscreen = document.getElementById('tool-btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    }

    // 화면 소스 모드 전환: 교재 (Markdown)
    if (this.dom.btnModeMarkdown) {
      this.dom.btnModeMarkdown.addEventListener('click', async () => {
        if (this.sourceMode === 'markdown') return;
        if (this.sourceMode === 'desktop' || this.screenShare.publisher) {
          await this.stopDesktopShare({ announce: false, targetMode: 'markdown' });
        } else {
          await this.sync.broadcastSourceMode('markdown');
          await this.applySourceMode('markdown');
        }
        this.showToast('📖 교육자료 교재 화면으로 전환했습니다.');
      });
    }

    // 화면 소스 모드 전환: 라이브 노트 (Notepad)
    if (this.dom.btnModeNotepad) {
      this.dom.btnModeNotepad.addEventListener('click', async () => {
        if (this.sourceMode === 'notepad') return;
        if (this.sourceMode === 'desktop' || this.screenShare.publisher) {
          await this.stopDesktopShare({ announce: false, targetMode: 'notepad' });
        } else {
          await this.sync.broadcastSourceMode('notepad');
          await this.applySourceMode('notepad');
        }
        this.showToast('📝 실시간 라이브 노트패드 화면으로 전환했습니다.');
      });
    }

    // 화면 소스 모드 전환: 화면 공유 (Desktop)
    if (this.dom.btnScreenShare) {
      this.dom.btnScreenShare.addEventListener('click', () => {
        if (this.sourceMode === 'desktop' || this.screenShare.publisher) {
          void this.stopDesktopShare({ announce: true, targetMode: 'markdown' });
        } else {
          void this.startDesktopShare();
        }
      });
    }
  }

  // ----------------------------------------------------
  // 4. 교육자료 트리 및 마크다운 로딩
  // ----------------------------------------------------
  async loadDocTree() {
    try {
      const res = await fetch('/api/materials/tree');
      const data = await res.json();
      if (data.success && data.tree) {
        this.allDocPaths = [];
        this.dom.sidebarTree.innerHTML = '';
        this.dom.sidebarTree.appendChild(this.buildTreeDOM(data.tree));
      }
    } catch (err) {
      console.error('교육자료 트리 로드 오류:', err);
    }
  }

  buildTreeDOM(nodes) {
    const ul = document.createElement('div');
    ul.className = 'tree-group';

    for (const node of nodes) {
      const item = document.createElement('div');
      item.className = 'tree-node';

      if (node.type === 'directory') {
        item.classList.add('tree-folder-node');

        const header = document.createElement('div');
        header.className = 'tree-folder-title';
        header.innerHTML = `
          <span class="tree-caret"><i class="fas fa-chevron-down"></i></span>
          <i class="fas fa-folder-open tree-folder-icon"></i>
          <span>${node.name}</span>
        `;

        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-folder-children';
        childrenContainer.appendChild(this.buildTreeDOM(node.children));

        header.addEventListener('click', (e) => {
          e.stopPropagation();
          const isCollapsed = item.classList.toggle('collapsed');
          const folderIcon = header.querySelector('.tree-folder-icon');
          if (folderIcon) {
            folderIcon.className = isCollapsed ? 'fas fa-folder tree-folder-icon' : 'fas fa-folder-open tree-folder-icon';
          }
        });

        item.appendChild(header);
        item.appendChild(childrenContainer);
      } else if (node.type === 'file' && node.isMarkdown) {
        this.allDocPaths.push(node.path);

        const fileEl = document.createElement('div');
        fileEl.className = 'tree-file-item';
        fileEl.dataset.path = node.path;
        fileEl.innerHTML = `<i class="far fa-file-alt"></i> <span>${node.name.replace(/\.md$/i, '')}</span>`;

        fileEl.addEventListener('click', () => {
          // 모바일에서는 문서 선택 시 사이드바 자동 닫기
          if (window.innerWidth <= 768) {
            this.dom.sidebar.classList.add('collapsed');
          }

          if (this.sync.isPresenter) {
            // 강사가 클릭하면 전체 문서 변경 브로드캐스트
            this.sync.broadcastDocChange(node.path);
            this.loadDocument(node.path);
          } else {
            // 수강생이 클릭하면 독자적 열람 -> 자유 탐색 모드 전환
            this.sync.setFollowMode(false);
            this.loadDocument(node.path);
            this.showToast(`🟡 '${node.name}' 문서를 열람합니다. (자유 모드)`);
          }
        });

        item.appendChild(fileEl);
      }

      ul.appendChild(item);
    }

    return ul;
  }

  toggleAllFolders(forceCollapse = null) {
    const folderNodes = this.dom.sidebarTree.querySelectorAll('.tree-folder-node');
    if (folderNodes.length === 0) return;

    const anyOpen = Array.from(folderNodes).some(node => !node.classList.contains('collapsed'));
    const shouldCollapse = forceCollapse !== null ? forceCollapse : anyOpen;

    folderNodes.forEach(node => {
      if (shouldCollapse) {
        node.classList.add('collapsed');
        const icon = node.querySelector('.tree-folder-icon');
        if (icon) icon.className = 'fas fa-folder tree-folder-icon';
      } else {
        node.classList.remove('collapsed');
        const icon = node.querySelector('.tree-folder-icon');
        if (icon) icon.className = 'fas fa-folder-open tree-folder-icon';
      }
    });

    if (this.dom.treeToggleText) {
      this.dom.treeToggleText.innerText = shouldCollapse ? '모두 펴기' : '모두 접기';
    }
  }

  async loadDocument(docPath, targetScrollRatio = 0, strokes = null, annotations = null) {
    if (!docPath) return;
    this.currentDocPath = docPath;

    // 사이드바 활성 아이템 갱신
    this.dom.sidebarTree.querySelectorAll('.tree-file-item').forEach(el => {
      if (el.dataset.path === docPath) {
        el.classList.add('active');
        // 부모 폴더 자동 열기
        let parent = el.parentElement;
        while (parent && parent !== this.dom.sidebarTree) {
          if (parent.classList.contains('tree-folder-node')) {
            parent.classList.remove('collapsed');
            const icon = parent.querySelector('.tree-folder-icon');
            if (icon) icon.className = 'fas fa-folder-open tree-folder-icon';
          }
          parent = parent.parentElement;
        }
      } else {
        el.classList.remove('active');
      }
    });

    // 헤더 제목 갱신
    if (this.sourceMode === 'markdown' && this.dom.currentDocTitle) {
      this.dom.currentDocTitle.innerText = this.getDocName(docPath);
    }

    try {
      const res = await fetch(`/api/materials/file?path=${encodeURIComponent(docPath)}`);
      const data = await res.json();

      if (data.success) {
        // 1) 마크다운 파싱 및 렌더링
        const html = this.renderer.render(data.content, docPath);
        this.dom.markdownContent.innerHTML = html;
        this.renderer.postProcess(this.dom.markdownContent);

        // 2) CSS 어노테이션 렌더링
        if (annotations !== null) {
          this.textAnnotation.renderAll(annotations);
        }

        // 3) 판서 스트로크 복원
        if (strokes !== null) {
          this.whiteboard.setStrokes(strokes);
        }

        // 4) 1차 즉시 스크롤 적용
        this.applyScrollRatio(targetScrollRatio);

        // 5) 이미지 로딩 완료 후 2차 정밀 스크롤 보정 및 캔버스 리사이즈
        await this.waitForImagesAndResize();
        this.applyScrollRatio(targetScrollRatio);

        // 레이아웃 안정화 후 3차 미세 보정 (300ms)
        setTimeout(() => {
          this.applyScrollRatio(targetScrollRatio);
        }, 300);
      } else {
        throw new Error(data.message || '문서를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('문서 내용 로드 실패:', err);
      this.dom.markdownContent.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 60px 16px;">
          <i class="fas fa-exclamation-circle" style="font-size: 2.5rem; color: var(--accent-warning); margin-bottom: 16px;"></i>
          <h3 style="margin-bottom: 8px;">문서 로드 실패</h3>
          <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem;">${err.message || '네트워크 연결을 확인해 주세요.'}</p>
          <button class="btn-primary" onclick="window.app.loadDocument('${docPath}', ${targetScrollRatio})">
            <i class="fas fa-redo"></i> 다시 시도
          </button>
        </div>
      `;
    }
  }

  waitForImagesAndResize() {
    const images = this.dom.markdownContent.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    return Promise.all(promises).then(() => {
      this.whiteboard.resize();
    });
  }

  // ----------------------------------------------------
  // 5. 스크롤 및 줌 제어 (정밀 비례 동기화)
  // ----------------------------------------------------
  getScrollRatio() {
    const container = this.dom.viewerContainer;
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) return 0;
    return Math.min(1.0, Math.max(0.0, container.scrollTop / maxScroll));
  }

  applyScrollRatio(ratio) {
    if (ratio === undefined || ratio === null) return;
    const container = this.dom.viewerContainer;
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (maxScroll <= 0) return;

    const targetTop = ratio * maxScroll;
    if (Math.abs(container.scrollTop - targetTop) < 1) return;

    this.sync.isProgrammaticScroll = true;
    container.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    });

    clearTimeout(this.programmaticScrollTimeout);
    this.programmaticScrollTimeout = setTimeout(() => {
      this.sync.isProgrammaticScroll = false;
    }, 500);
  }

  adjustZoom(delta) {
    if (this.sourceMode !== 'markdown') return;
    const newZoom = Math.min(2.0, Math.max(0.7, +(this.currentZoom + delta).toFixed(1)));
    this.setZoom(newZoom, true);
  }

  setZoom(zoom, broadcast = false) {
    this.currentZoom = zoom;
    this.dom.zoomWrapper.style.transform = `scale(${zoom})`;
    this.dom.zoomLevelDisplay.innerText = `${Math.round(zoom * 100)}%`;

    if (broadcast && this.sync.isPresenter) {
      this.sync.broadcastZoom(zoom);
    }
    setTimeout(() => this.whiteboard.resize(), 200);
  }

  // ----------------------------------------------------
  // 6. 강사 화면 따라가기 (Catch Up)
  // ----------------------------------------------------
  async catchUpToPresenter() {
    this.sync.setFollowMode(true);
    const pState = this.sync.presenterState;

    await this.applySourceMode(pState.sourceMode || 'markdown');
    if (pState.sourceMode === 'desktop') {
      this.showToast('<i class="fas fa-bolt"></i> 강사의 데스크톱 화면으로 복귀했습니다.');
      return;
    }

    if (pState.sourceMode === 'notepad') {
      if (pState.notepad) {
        this.notepad.setDocument(pState.notepad.title, pState.notepad.content);
        this.notepad.setScrollRatio(pState.notepad.scrollRatio);
      }
      this.showToast('⚡ 강사의 실시간 라이브 노트와 동기화되었습니다!');
      return;
    }

    if (pState.currentDoc) {
      if (pState.currentDoc !== this.currentDocPath) {
        // 다른 문서에 있었다면 해당 문서로 로드 및 스크롤 이동
        await this.loadDocument(pState.currentDoc, pState.scrollRatio, pState.strokes, pState.annotations);
      } else {
        // 동일 문서라면 스크롤 및 판서/어노테이션 즉시 보정
        this.applyScrollRatio(pState.scrollRatio);
        if (pState.strokes) {
          this.whiteboard.setStrokes(pState.strokes);
        }
        if (pState.annotations) {
          this.textAnnotation.renderAll(pState.annotations);
        }
      }
    }

    if (pState.zoomLevel) {
      this.setZoom(pState.zoomLevel, false);
    }

    this.showToast('⚡ 강사 화면과 완전히 동기화되었습니다!');
  }

  // ----------------------------------------------------
  // 7. 역할 및 상태 UI 갱신
  // ----------------------------------------------------
  updatePresenterStatus(hasPresenter, isYouPresenter) {
    this.whiteboard.setPresenterMode(isYouPresenter);
    this.textAnnotation.setPresenterMode(isYouPresenter);
    this.notepad.setPresenterMode(isYouPresenter);

    if (isYouPresenter) {
      this.dom.statusPill.className = 'status-pill presenter';
      let statusText = '강사 발표 모드';
      if (this.sourceMode === 'desktop') statusText = '내 화면 공유 중';
      else if (this.sourceMode === 'notepad') statusText = '라이브 노트 작성 중';

      this.dom.statusPill.innerHTML = `<span class="pulse-dot"></span> ${statusText}`;
      this.dom.presenterToolbar.classList.remove('hidden');
      this.dom.btnCatchUp.classList.add('hidden');
      this.dom.syncToggle.parentElement.style.display = 'none';
      this.dom.btnPresenterLogin.innerHTML = '<i class="fas fa-sign-out-alt"></i> 강사 종료';
    } else {
      this.dom.presenterToolbar.classList.add('hidden');
      this.dom.syncToggle.parentElement.style.display = 'flex';
      this.dom.btnPresenterLogin.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> 강사 모드';
      document.body.classList.remove('eraser-mode');
      this.updateSyncUIState(this.sync.followMode);
    }
  }

  updateSyncUIState(isFollow) {
    if (this.sync.isPresenter) return;

    this.dom.syncToggle.checked = isFollow;
    if (isFollow) {
      this.dom.statusPill.className = 'status-pill follow-on';
      let statusText = '강사 동기화 중';
      if (this.sourceMode === 'desktop') statusText = '강사 화면 시청 중';
      else if (this.sourceMode === 'notepad') statusText = '라이브 노트 동기화 중';

      this.dom.statusPill.innerHTML = `<span class="pulse-dot"></span> ${statusText}`;
      this.dom.btnCatchUp.classList.add('hidden');
    } else {
      this.dom.statusPill.className = 'status-pill follow-off';
      this.dom.statusPill.innerHTML = '<i class="fas fa-compass"></i> 자유 탐색 중';
      this.dom.btnCatchUp.classList.remove('hidden');
    }
  }

  updateClientCount(count) {
    this.dom.clientCountBadge.innerHTML = `<i class="fas fa-users"></i> ${count}명`;
  }

  submitPresenterPin() {
    const pin = this.dom.inputPin.value.trim();
    this.sync.authPresenter(pin, (res) => {
      if (res.success) {
        this.dom.modalAuth.classList.remove('active');
        this.updatePresenterStatus(true, true);
        this.showToast('🎉 강사 권한을 획득하였습니다! 발표 도구가 활성화됩니다.');
      } else {
        alert(res.message || '인증에 실패했습니다.');
      }
    });
  }

  async showHostIpModal() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      const port = data.port || window.location.port || 4000;
      const hostIps = data.hostIps || [];

      this.dom.hostIpList.innerHTML = '';

      // 1) 현재 브라우저가 접속한 주소
      const currentOrigin = window.location.origin;
      const currentItem = this.createIpRow('현재 접속 주소', currentOrigin, true);
      this.dom.hostIpList.appendChild(currentItem);

      // 2) 서버의 로컬 네트워크(LAN) IP 주소들
      hostIps.forEach(({ interface: iface, ip }) => {
        const lanUrl = `http://${ip}:${port}`;
        if (lanUrl !== currentOrigin) {
          const row = this.createIpRow(`사내망 / LAN (${iface})`, lanUrl, false);
          this.dom.hostIpList.appendChild(row);
        }
      });

      this.dom.modalHostIps.classList.add('active');
    } catch (err) {
      console.error('호스트 정보 조회 실패:', err);
      this.showToast('호스트 접속 정보를 가져오는 데 실패했습니다.');
    }
  }

  createIpRow(label, url, isPrimary) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.background = 'var(--bg-primary)';
    row.style.padding = '10px 14px';
    row.style.borderRadius = '8px';
    row.style.border = '1px solid var(--border-color)';
    row.style.gap = '10px';

    row.innerHTML = `
      <div style="overflow: hidden;">
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${label}</div>
        <div style="font-size: 0.92rem; font-weight: 600; color: var(--accent-primary); word-break: break-all;">${url}</div>
      </div>
      <button class="btn-icon" style="flex-shrink: 0; padding: 6px 12px; font-weight: 600;">
        <i class="fas fa-copy"></i> 복사
      </button>
    `;

    const btnCopy = row.querySelector('button');
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(url).then(() => {
        btnCopy.innerHTML = '<i class="fas fa-check"></i> 복사됨';
        setTimeout(() => {
          btnCopy.innerHTML = '<i class="fas fa-copy"></i> 복사';
        }, 2000);
        this.showToast(`📋 '${url}' 주소가 클립보드에 복사되었습니다!`);
      });
    });

    return row;
  }

  // ----------------------------------------------------
  // 8. 헬퍼 및 유틸리티
  // ----------------------------------------------------
  navigateDoc(direction) {
    if (this.allDocPaths.length === 0) return;
    const currentIndex = this.allDocPaths.indexOf(this.currentDocPath);
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= this.allDocPaths.length) nextIndex = this.allDocPaths.length - 1;

    const nextDoc = this.allDocPaths[nextIndex];
    if (nextDoc && nextDoc !== this.currentDocPath) {
      if (this.sync.isPresenter) {
        this.sync.broadcastDocChange(nextDoc);
      }
      this.loadDocument(nextDoc);
    }
  }

  getDocName(path) {
    if (!path) return '문서 선택';
    const filename = path.split('/').pop();
    return filename.replace(/\.md$/i, '');
  }

  filterSidebarTree(query) {
    const items = this.dom.sidebarTree.querySelectorAll('.tree-file-item');
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      if (text.includes(query)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('pm_theme', next);
    this.dom.btnThemeToggle.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  initTheme() {
    const saved = localStorage.getItem('pm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    this.dom.btnThemeToggle.innerHTML = saved === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = message;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  handleGlobalShortcuts(e) {
    // 모달이나 텍스트 입력 중일 때는 무시
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key === 'f' || e.key === 'F') {
      this.toggleFullscreen();
    } else if (e.key === '[' && this.sync.isPresenter && this.sourceMode === 'markdown') {
      this.navigateDoc(-1);
    } else if (e.key === ']' && this.sync.isPresenter && this.sourceMode === 'markdown') {
      this.navigateDoc(1);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && this.sync.isPresenter && this.sourceMode === 'markdown') {
      e.preventDefault();
      this.sync.broadcastUndoStroke(this.currentDocPath);
    }
  }
}

// 앱 실행
window.addEventListener('DOMContentLoaded', () => {
  window.app = new PresentationApp();
});
