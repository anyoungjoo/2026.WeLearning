/**
 * 📡 Real-time Sync Engine (Socket.IO Coordinator)
 * 
 * [핵심 기능]
 * 1. 강사-수강생 간 역할(Role) 및 권한 관리
 * 2. 3중 화면 미러링 (문서 이동, 비례 스크롤, 줌 배율)
 * 3. 수강생 Follow(동기화) / Free(자유 탐색) 모드 상태 머신 및 부드러운 Catch-up
 */

export class SyncEngine {
  constructor(callbacks = {}) {
    this.socket = null;
    this.callbacks = callbacks;

    // 로컬 상태
    this.isPresenter = false;
    this.followMode = true; // 수강생 기본 모드는 팔로우(동기화 ON)
    this.hasPresenter = false;
    this.clientCount = 1;

    // 강사의 최신 상태 캐시
    this.presenterState = {
      currentDoc: '',
      scrollRatio: 0,
      zoomLevel: 1.0,
      sourceMode: 'markdown',
      strokes: [],
      notepad: {
        title: '💡 라이브 강의 요약 노트',
        content: '',
        updatedAt: Date.now(),
        scrollRatio: 0
      }
    };

    // 스크롤 루프 방지용 플래그
    this.isProgrammaticScroll = false;
    this.scrollThrottleTimer = null;
    this.notepadScrollThrottleTimer = null;
    this.notepadUpdateThrottleTimer = null;

    this.initSocket();
  }

  initSocket() {
    if (typeof io === 'undefined') {
      console.error('Socket.IO client library is missing.');
      return;
    }

    this.socket = io();

    // 1) 초기 세션 상태 수신
    this.socket.on('init-state', (data) => {
      this.presenterState.currentDoc = data.currentDoc;
      this.presenterState.scrollRatio = data.scrollRatio;
      this.presenterState.zoomLevel = data.zoomLevel;
      this.presenterState.sourceMode = data.sourceMode || 'markdown';
      this.presenterState.strokes = data.strokes || [];
      this.presenterState.annotations = data.annotations || [];
      this.presenterState.notepad = data.notepad || this.presenterState.notepad;
      this.hasPresenter = data.hasPresenter;
      this.clientCount = data.clientCount;
      this.isPresenter = data.isYouPresenter;

      if (this.callbacks.onInit) {
        this.callbacks.onInit(data);
      }
    });

    // 2) 강사 입장/퇴장 상태 변화
    this.socket.on('presenter-changed', ({ hasPresenter }) => {
      this.hasPresenter = hasPresenter;
      if (this.callbacks.onPresenterChanged) {
        this.callbacks.onPresenterChanged(hasPresenter);
      }
    });

    // 3) 접속자 수 갱신
    this.socket.on('client-count-updated', ({ count }) => {
      this.clientCount = count;
      if (this.callbacks.onClientCountUpdated) {
        this.callbacks.onClientCountUpdated(count);
      }
    });

    // 4) 문서 변경 수신 (강사 -> 수강생)
    this.socket.on('doc-changed', (data) => {
      this.presenterState.currentDoc = data.docPath;
      this.presenterState.scrollRatio = data.scrollRatio;
      this.presenterState.strokes = data.strokes || [];
      this.presenterState.annotations = data.annotations || [];

      if (this.followMode && !this.isPresenter) {
        if (this.callbacks.onRemoteDocChanged) {
          this.callbacks.onRemoteDocChanged(data);
        }
      }
    });

    // 5) 스크롤 동기화 수신 (강사 -> 수강생)
    this.socket.on('scroll-synced', ({ scrollRatio }) => {
      this.presenterState.scrollRatio = scrollRatio;

      if (this.followMode && !this.isPresenter) {
        if (this.callbacks.onRemoteScrollSynced) {
          this.callbacks.onRemoteScrollSynced(scrollRatio);
        }
      }
    });

    // 6) 줌 동기화 수신 (강사 -> 수강생)
    this.socket.on('zoom-synced', ({ zoomLevel }) => {
      this.presenterState.zoomLevel = zoomLevel;

      if (this.followMode && !this.isPresenter) {
        if (this.callbacks.onRemoteZoomSynced) {
          this.callbacks.onRemoteZoomSynced(zoomLevel);
        }
      }
    });

    // 7) 마크다운 / 전체 화면 source 전환
    this.socket.on('source-mode-changed', ({ sourceMode }) => {
      this.presenterState.sourceMode = sourceMode;

      if (this.isPresenter || this.followMode) {
        if (this.callbacks.onRemoteSourceModeChanged) {
          this.callbacks.onRemoteSourceModeChanged(sourceMode);
        }
      }
    });

    // 8) 판서 이벤트 수신
    this.socket.on('stroke-added', ({ docPath, stroke }) => {
      if (docPath === this.presenterState.currentDoc) {
        this.presenterState.strokes = [...this.presenterState.strokes, stroke];
      }
      if (this.callbacks.onRemoteStrokeAdded) {
        this.callbacks.onRemoteStrokeAdded(docPath, stroke);
      }
    });

    this.socket.on('strokes-cleared', ({ docPath }) => {
      if (docPath === this.presenterState.currentDoc) {
        this.presenterState.strokes = [];
      }
      if (this.callbacks.onRemoteStrokesCleared) {
        this.callbacks.onRemoteStrokesCleared(docPath);
      }
    });

    this.socket.on('strokes-updated', ({ docPath, strokes }) => {
      if (docPath === this.presenterState.currentDoc) {
        this.presenterState.strokes = strokes;
      }
      if (this.callbacks.onRemoteStrokesUpdated) {
        this.callbacks.onRemoteStrokesUpdated(docPath, strokes);
      }
    });

    // 9) CSS 텍스트 어노테이션(밑줄/형광펜) 이벤트 수신
    this.socket.on('annotation-added', ({ docPath, annotation }) => {
      if (this.callbacks.onRemoteAnnotationAdded) {
        this.callbacks.onRemoteAnnotationAdded(docPath, annotation);
      }
    });

    this.socket.on('annotation-removed', ({ docPath, annotationId }) => {
      if (this.callbacks.onRemoteAnnotationRemoved) {
        this.callbacks.onRemoteAnnotationRemoved(docPath, annotationId);
      }
    });

    this.socket.on('annotations-cleared', ({ docPath }) => {
      if (this.callbacks.onRemoteAnnotationsCleared) {
        this.callbacks.onRemoteAnnotationsCleared(docPath);
      }
    });

    this.socket.on('annotations-updated', ({ docPath, annotations }) => {
      if (this.callbacks.onRemoteAnnotationsUpdated) {
        this.callbacks.onRemoteAnnotationsUpdated(docPath, annotations);
      }
    });

    this.socket.on('laser-pointer-moved', ({ x, y, visible }) => {
      if (this.callbacks.onRemoteLaserMoved) {
        this.callbacks.onRemoteLaserMoved(x, y, visible);
      }
    });

    // 10) 강사 실시간 도구 커서(형광펜, 밑줄, 펜, 지우개 등) 이동 이벤트 수신
    this.socket.on('cursor-moved', (cursorData) => {
      if (this.followMode && !this.isPresenter) {
        if (this.callbacks.onRemoteCursorMoved) {
          this.callbacks.onRemoteCursorMoved(cursorData);
        }
      }
    });

    // 11) 실시간 노션형 라이브 노트패드 동기화 이벤트 수신
    this.socket.on('notepad-updated', (data) => {
      this.presenterState.notepad = data;
      if (this.callbacks.onRemoteNotepadUpdated) {
        this.callbacks.onRemoteNotepadUpdated(data);
      }
    });

    this.socket.on('notepad-scroll-synced', ({ scrollRatio }) => {
      this.presenterState.notepad.scrollRatio = scrollRatio;
      if (this.followMode && !this.isPresenter && this.callbacks.onRemoteNotepadScrollSynced) {
        this.callbacks.onRemoteNotepadScrollSynced(scrollRatio);
      }
    });

    this.socket.on('notepad-cleared', (data) => {
      this.presenterState.notepad = data;
      if (this.callbacks.onRemoteNotepadCleared) {
        this.callbacks.onRemoteNotepadCleared(data);
      }
    });
  }

  // ----------------------------------------------------
  // 강사 인증 & 상태 제어
  // ----------------------------------------------------

  authPresenter(pin, callback) {
    this.socket.emit('auth-presenter', { pin }, (res) => {
      if (res.success) {
        this.isPresenter = true;
        this.followMode = false; // 강사는 팔로우 대상이 됨
      }
      if (callback) callback(res);
    });
  }

  releasePresenter() {
    this.socket.emit('release-presenter');
    this.isPresenter = false;
    this.followMode = true;
    this.presenterState.sourceMode = 'markdown';
  }

  setFollowMode(enable) {
    this.followMode = enable;
    if (this.callbacks.onFollowModeChanged) {
      this.callbacks.onFollowModeChanged(enable);
    }
  }

  // ----------------------------------------------------
  // 강사 발신 액션 메서드들 (Presenter Actions)
  // ----------------------------------------------------

  broadcastDocChange(docPath) {
    if (!this.isPresenter) return;
    this.presenterState.currentDoc = docPath;
    this.socket.emit('change-doc', { docPath });
  }

  broadcastScroll(scrollRatio) {
    if (!this.isPresenter) return;
    
    // 쓰로틀링 (30ms 간격 발송)
    if (this.scrollThrottleTimer) return;
    this.scrollThrottleTimer = setTimeout(() => {
      this.socket.emit('sync-scroll', { scrollRatio });
      this.scrollThrottleTimer = null;
    }, 30);
  }

  broadcastZoom(zoomLevel) {
    if (!this.isPresenter) return;
    this.presenterState.zoomLevel = zoomLevel;
    this.socket.emit('sync-zoom', { zoomLevel });
  }

  broadcastSourceMode(sourceMode) {
    if (!this.isPresenter) {
      return Promise.resolve({ success: false, message: '강사 권한이 필요합니다.' });
    }

    return new Promise((resolve) => {
      this.socket.emit('set-source-mode', { sourceMode }, (response) => {
        if (response?.success) this.presenterState.sourceMode = sourceMode;
        resolve(response || { success: false, message: '화면 모드 변경 응답이 없습니다.' });
      });
    });
  }

  broadcastStroke(docPath, stroke) {
    if (!this.isPresenter) return;
    this.socket.emit('draw-stroke', { docPath, stroke });
  }

  broadcastClearStrokes(docPath) {
    if (!this.isPresenter) return;
    this.socket.emit('clear-strokes', { docPath });
  }

  broadcastUndoStroke(docPath) {
    if (!this.isPresenter) return;
    this.socket.emit('undo-stroke', { docPath });
  }

  // CSS 텍스트 어노테이션 발신
  broadcastAnnotation(docPath, annotation) {
    if (!this.isPresenter) return;
    this.socket.emit('add-annotation', { docPath, annotation });
  }

  broadcastRemoveAnnotation(docPath, annotationId) {
    if (!this.isPresenter) return;
    this.socket.emit('remove-annotation', { docPath, annotationId });
  }

  broadcastClearAnnotations(docPath) {
    if (!this.isPresenter) return;
    this.socket.emit('clear-annotations', { docPath });
  }

  broadcastUndoAnnotation(docPath) {
    if (!this.isPresenter) return;
    this.socket.emit('undo-annotation', { docPath });
  }

  broadcastClearAll(docPath) {
    if (!this.isPresenter) return;
    this.socket.emit('clear-all-drawings', { docPath });
  }

  // 실시간 마우스 커서 및 도구 모양 브로드캐스트 (30ms 쓰로틀링)
  broadcastCursorMove(cursorData) {
    if (!this.isPresenter) return;
    if (this.cursorThrottleTimer) return;

    this.cursorThrottleTimer = setTimeout(() => {
      this.socket.emit('cursor-move', cursorData);
      this.cursorThrottleTimer = null;
    }, 30);
  }

  // ----------------------------------------------------
  // 실시간 노션형 라이브 노트패드 발신 메서드
  // ----------------------------------------------------

  /**
   * 노트패드 제목 및 본문 변경사항 브로드캐스트 (50ms 디바운스/쓰로틀)
   */
  broadcastNotepadUpdate(title, content) {
    if (!this.isPresenter) return;
    if (title !== undefined) this.presenterState.notepad.title = title;
    if (content !== undefined) this.presenterState.notepad.content = content;

    clearTimeout(this.notepadUpdateThrottleTimer);
    this.notepadUpdateThrottleTimer = setTimeout(() => {
      this.socket.emit('update-notepad', {
        title: this.presenterState.notepad.title,
        content: this.presenterState.notepad.content
      });
    }, 50);
  }

  /**
   * 노트패드 내부 스크롤 비율 브로드캐스트 (30ms 쓰로틀링)
   */
  broadcastNotepadScroll(scrollRatio) {
    if (!this.isPresenter) return;
    if (this.notepadScrollThrottleTimer) return;

    this.notepadScrollThrottleTimer = setTimeout(() => {
      this.socket.emit('sync-notepad-scroll', { scrollRatio });
      this.notepadScrollThrottleTimer = null;
    }, 30);
  }

  /**
   * 노트패드 초기화 브로드캐스트
   */
  broadcastClearNotepad() {
    if (!this.isPresenter) return;
    this.socket.emit('clear-notepad');
  }
}
