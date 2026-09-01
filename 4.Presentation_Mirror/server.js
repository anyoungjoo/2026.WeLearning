/**
 * 🎓 Presentation Mirror - 실시간 마크다운 교육 발표 미러링 서버
 * 
 * [아키텍처 개요]
 * - Express: 정적 자산 서빙 및 교육자료 파일 탐색 REST API 제공
 * - Socket.IO: 강사-수강생 간 문서 상태와 Markdown/Desktop source 모드 동기화
 * - MediaMTX: 브라우저가 WHIP/WHEP로 연결하는 데스크톱 영상 중계기
 * - State Manager: 문서별 판서 데이터 및 현재 프레젠테이션 상태 메모리 관리
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import os from 'os';
import cors from 'cors';
import { fileURLToPath } from 'url';

// ----------------------------------------------------
// 1. 기본 경로 및 서버 인스턴스 초기화
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;
// 교육자료 폴더 경로 (/home/genk/2026.Study/2026.autoreport/1.교육자료)
const MATERIALS_DIR = path.resolve(__dirname, '../1.교육자료');
// 노트패드 이미지 업로드 디렉토리
const UPLOADS_DIR = path.resolve(__dirname, 'public/uploads/notepad');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const PRESENTER_PIN = process.env.PRESENTER_PIN || '1234'; // 강사 인증 핀코드 기본값
const MEDIA_MTX_WEBRTC_PORT = Number(process.env.MEDIA_MTX_WEBRTC_PORT || 8889);
const MEDIA_MTX_PATH = process.env.MEDIA_MTX_PATH || 'presentation';
const MEDIA_MTX_WEBRTC_URL = (process.env.MEDIA_MTX_WEBRTC_URL || '').replace(/\/+$/, '');

// 대용량 이미지(스크린샷 붙여넣기 등) 처리를 위한 본문 크기 제한 확장
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// 2. 프레젠테이션 실시간 세션 상태 관리 (In-Memory State)
// ----------------------------------------------------
const presentationState = {
  presenterId: null,      // 현재 강사 소켓 ID
  currentDoc: '',         // 현재 선택된 마크다운 문서 상대경로
  scrollRatio: 0,         // 강사의 현재 스크롤 백분율 (0.0 ~ 1.0)
  zoomLevel: 1.0,         // 강사의 현재 화면 확대 배율 (1.0 = 100%)
  sourceMode: 'markdown', // 'markdown' | 'desktop' | 'notepad'
  docStrokes: {},         // 문서별 캔버스 판서 데이터 { [docPath]: Array<Stroke> }
  docAnnotations: {},     // 문서별 CSS 텍스트 어노테이션(밑줄/형광펜) 데이터 { [docPath]: Array<Annotation> }
  notepad: {              // 실시간 노션형 라이브 노트패드 상태
    title: '💡 라이브 강의 요약 노트',
    content: '<h2>📝 실시간 라이브 노트패드</h2><p>강사가 작성하는 텍스트와 클립보드로 붙여넣은 캡처 사진이 모든 수강생 화면에 실시간으로 공유됩니다.</p><blockquote>💡 Tip: 서식 툴바를 이용해 제목, 볼드, 코드블록, 체크리스트를 작성하거나 이미지를 붙여넣어 보세요!</blockquote>',
    updatedAt: Date.now(),
    scrollRatio: 0
  },
  connectedClients: new Map() // connected socketId -> { role: 'presenter' | 'student', joinedAt }
};

// ----------------------------------------------------
// 3. 헬퍼 함수: 파일 시스템 트리 스캔 및 자연 정렬
// ----------------------------------------------------

/**
 * 디렉토리를 재귀적으로 순회하여 파일 트리를 생성합니다.
 * @param {string} dirPath 스캔할 디렉토리 절대경로
 * @param {string} baseDir 기준 디렉토리 절대경로
 * @returns {Array} 트리 노드 배열
 */
function scanDirectory(dirPath, baseDir) {
  if (!fs.existsSync(dirPath)) return [];

  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const result = [];

  // 자연 정렬 (Natural Sort: 0-1, 0-2, 1-1, 2, 10 순차 정렬)
  items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  for (const item of items) {
    // 숨김 파일이나 임시 파일 무시
    if (item.name.startsWith('.')) continue;

    const fullPath = path.join(dirPath, item.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (item.isDirectory()) {
      const children = scanDirectory(fullPath, baseDir);
      result.push({
        type: 'directory',
        name: item.name,
        path: relPath,
        children
      });
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      result.push({
        type: 'file',
        name: item.name,
        path: relPath,
        ext: ext,
        isMarkdown: ext === '.md' || ext === '.markdown'
      });
    }
  }

  return result;
}

/**
 * 안전한 경로 검증 (Path Traversal 공격 방지)
 */
function isSafePath(baseDir, targetRelPath) {
  const safePath = path.resolve(baseDir, targetRelPath);
  return safePath.startsWith(baseDir);
}

// ----------------------------------------------------
// 4. REST API 라우트 정의
// ----------------------------------------------------

// 1) 교육자료 파일 목록 트리 조회
app.get('/api/materials/tree', (req, res) => {
  try {
    const tree = scanDirectory(MATERIALS_DIR, MATERIALS_DIR);
    res.json({ success: true, tree });
  } catch (error) {
    console.error('교육자료 트리 조회 실패:', error);
    res.status(500).json({ success: false, message: '파일 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 2) 특정 마크다운 문서 내용 조회
app.get('/api/materials/file', (req, res) => {
  let filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ success: false, message: '파일 경로(path)가 지정되지 않았습니다.' });
  }

  // 모바일 브라우저 한글 파라미터 안전 디코딩
  try {
    if (filePath.includes('%')) {
      filePath = decodeURIComponent(filePath);
    }
  } catch (e) {
    // 디코딩 실패 시 원본 사용
  }

  if (!isSafePath(MATERIALS_DIR, filePath)) {
    return res.status(403).json({ success: false, message: '접근이 허용되지 않은 경로입니다.' });
  }

  const fullPath = path.resolve(MATERIALS_DIR, filePath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return res.status(404).json({ success: false, message: '요청한 문서를 찾을 수 없습니다.' });
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({
      success: true,
      path: filePath,
      name: path.basename(filePath),
      content
    });
  } catch (error) {
    console.error('파일 읽기 실패:', error);
    res.status(500).json({ success: false, message: '파일 내용을 읽는 데 실패했습니다.' });
  }
});

// 3) 마크다운 내부 이미지 및 첨부파일 서빙 (Raw Media Streaming)
app.get('/api/materials/raw/*', (req, res) => {
  const reqPath = decodeURIComponent(req.params[0] || '');
  if (!isSafePath(MATERIALS_DIR, reqPath)) {
    return res.status(403).send('Forbidden');
  }

  const fullPath = path.resolve(MATERIALS_DIR, reqPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return res.status(404).send('File Not Found');
  }

  res.sendFile(fullPath);
});

/**
 * 로컬 네트워크(LAN)의 IPv4 주소 목록을 반환합니다.
 */
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4이면서 루프백(127.0.0.1)이 아닌 실제 LAN IP 필터링
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          ip: iface.address
        });
      }
    }
  }
  return addresses;
}

// 4) 서버 기본 상태 및 호스트 IP 목록 조회
app.get('/api/status', (req, res) => {
  const hostIps = getLocalIPs();
  res.json({
    success: true,
    port: PORT,
    currentDoc: presentationState.currentDoc,
    sourceMode: presentationState.sourceMode,
    hasPresenter: !!presentationState.presenterId,
    clientCount: presentationState.connectedClients.size,
    hostIps: hostIps
  });
});

// 5) 브라우저가 MediaMTX WHIP/WHEP 주소를 구성하는 데 필요한 공개 설정
app.get('/api/runtime-config', (req, res) => {
  res.json({
    success: true,
    media: {
      baseUrl: MEDIA_MTX_WEBRTC_URL || null,
      port: MEDIA_MTX_WEBRTC_PORT,
      path: MEDIA_MTX_PATH
    }
  });
});

// 6) 실시간 노션형 라이브 노트패드 상태 조회 API
app.get('/api/notepad', (req, res) => {
  res.json({
    success: true,
    notepad: presentationState.notepad
  });
});

// 7) 실시간 노션형 노트패드 이미지 업로드 API (클립보드 붙여넣기 및 파일 드롭)
app.post('/api/notepad/upload', (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: '이미지 데이터가 전달되지 않았습니다.' });
    }

    // 1단계: Data URL 헤더 파싱 (예: "data:image/png;base64,....")
    const match = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: '유효한 Base64 이미지 포맷이 아닙니다.' });
    }

    const mimeType = match[1].toLowerCase();
    const base64Data = match[2];

    // 2단계: 안전한 이미지 확장자 검증
    let ext = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('svg')) ext = 'svg';

    // 3단계: 안전한 고유 파일명 생성 및 파일 쓰기
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const safeFileName = `note-img-${timestamp}-${randomSuffix}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/notepad/${safeFileName}`;
    console.log(`[노트패드] 이미지 업로드 완료: ${publicUrl} (${(buffer.length / 1024).toFixed(1)} KB)`);

    res.json({
      success: true,
      url: publicUrl,
      fileName: safeFileName
    });
  } catch (error) {
    console.error('노트패드 이미지 업로드 실패:', error);
    res.status(500).json({ success: false, message: '이미지 업로드 처리 중 오류가 발생했습니다.' });
  }
});

function resetSourceMode() {
  if (presentationState.sourceMode === 'markdown') return;
  presentationState.sourceMode = 'markdown';
  io.emit('source-mode-changed', { sourceMode: 'markdown' });
}

// ----------------------------------------------------
// 5. Socket.IO 실시간 미러링 & 판서 이벤트 처리
// ----------------------------------------------------

io.on('connection', (socket) => {
  // 1단계: 신규 접속자 등록 (기본값은 수강생 role)
  presentationState.connectedClients.set(socket.id, {
    role: 'student',
    joinedAt: Date.now()
  });

  // 2단계: 신규 접속자에게 현재 프레젠테이션 전체 상태 전송 (초기화)
  socket.emit('init-state', {
    currentDoc: presentationState.currentDoc,
    scrollRatio: presentationState.scrollRatio,
    zoomLevel: presentationState.zoomLevel,
    sourceMode: presentationState.sourceMode,
    strokes: presentationState.docStrokes[presentationState.currentDoc] || [],
    annotations: presentationState.docAnnotations[presentationState.currentDoc] || [],
    notepad: presentationState.notepad,
    hasPresenter: !!presentationState.presenterId,
    clientCount: presentationState.connectedClients.size,
    isYouPresenter: presentationState.presenterId === socket.id
  });

  // 전체 클라이언트에게 접속자 수 업데이트 브로드캐스트
  io.emit('client-count-updated', { count: presentationState.connectedClients.size });

  console.log(`[접속] 소켓 연결됨: ${socket.id} (현재 접속자: ${presentationState.connectedClients.size}명)`);

  // ----------------------------------------
  // 강사 인증 및 역할 관리
  // ----------------------------------------
  socket.on('auth-presenter', ({ pin }, callback) => {
    if (pin === PRESENTER_PIN || PRESENTER_PIN === '') {
      presentationState.presenterId = socket.id;
      const client = presentationState.connectedClients.get(socket.id);
      if (client) client.role = 'presenter';

      // 강사 본인에게 승인 알림
      if (typeof callback === 'function') callback({ success: true });
      socket.emit('presenter-status', { isPresenter: true });

      // 모든 수강생에게 강사 입장 알림
      io.emit('presenter-changed', { hasPresenter: true });
      console.log(`[권한] 강사 권한 획득: ${socket.id}`);
    } else {
      if (typeof callback === 'function') callback({ success: false, message: '강사 핀 번호가 일치하지 않습니다.' });
    }
  });

  // 강사 권한 자진 반납
  socket.on('release-presenter', () => {
    if (presentationState.presenterId === socket.id) {
      resetSourceMode();
      presentationState.presenterId = null;
      const client = presentationState.connectedClients.get(socket.id);
      if (client) client.role = 'student';

      socket.emit('presenter-status', { isPresenter: false });
      io.emit('presenter-changed', { hasPresenter: false });
      console.log(`[권한] 강사 권한 반납됨: ${socket.id}`);
    }
  });

  // ----------------------------------------
  // 실시간 화면 동기화 (강사 -> 수강생)
  // ----------------------------------------

  // 0) 마크다운 문서 / 라이브 노트패드 / 전체 데스크톱 source 전환
  socket.on('set-source-mode', ({ sourceMode }, callback) => {
    if (socket.id !== presentationState.presenterId) {
      if (typeof callback === 'function') callback({ success: false, message: '강사 권한이 필요합니다.' });
      return;
    }

    if (!['markdown', 'desktop', 'notepad'].includes(sourceMode)) {
      if (typeof callback === 'function') callback({ success: false, message: '지원하지 않는 화면 모드입니다.' });
      return;
    }

    presentationState.sourceMode = sourceMode;
    io.emit('source-mode-changed', { sourceMode });
    if (typeof callback === 'function') callback({ success: true, sourceMode });
  });

  // 0-1) 실시간 노션형 라이브 노트패드 동기화 이벤트
  socket.on('update-notepad', (data) => {
    if (socket.id !== presentationState.presenterId) return;

    if (data.title !== undefined) presentationState.notepad.title = data.title;
    if (data.content !== undefined) presentationState.notepad.content = data.content;
    presentationState.notepad.updatedAt = Date.now();

    // 강사를 제외한 모든 수강생에게 실시간 브로드캐스트
    socket.broadcast.emit('notepad-updated', presentationState.notepad);
  });

  // 0-2) 노트패드 내부 스크롤 비율 동기화
  socket.on('sync-notepad-scroll', ({ scrollRatio }) => {
    if (socket.id !== presentationState.presenterId) return;
    presentationState.notepad.scrollRatio = scrollRatio;
    socket.broadcast.emit('notepad-scroll-synced', { scrollRatio });
  });

  // 0-3) 노트패드 초기화
  socket.on('clear-notepad', () => {
    if (socket.id !== presentationState.presenterId) return;

    presentationState.notepad.title = '💡 라이브 강의 요약 노트';
    presentationState.notepad.content = '<p></p>';
    presentationState.notepad.updatedAt = Date.now();
    presentationState.notepad.scrollRatio = 0;

    io.emit('notepad-cleared', presentationState.notepad);
  });

  // 1) 문서 변경 이벤트
  socket.on('change-doc', ({ docPath }) => {
    if (socket.id !== presentationState.presenterId) return;

    presentationState.currentDoc = docPath;
    presentationState.scrollRatio = 0; // 새 문서 열람 시 스크롤 맨 위로 초기화

    // 해당 문서의 기존 판서 및 CSS 어노테이션 데이터 불러오기
    const strokes = presentationState.docStrokes[docPath] || [];
    const annotations = presentationState.docAnnotations[docPath] || [];

    // 모든 클라이언트에게 문서 변경 전파
    io.emit('doc-changed', {
      docPath,
      scrollRatio: 0,
      strokes,
      annotations
    });
  });

  // 2) 스크롤 비율 동기화 이벤트
  socket.on('sync-scroll', ({ scrollRatio }) => {
    if (socket.id !== presentationState.presenterId) return;

    presentationState.scrollRatio = scrollRatio;
    // 강사 본인을 제외한 모든 수강생에게 전파
    socket.broadcast.emit('scroll-synced', { scrollRatio });
  });

  // 3) 줌 배율 동기화 이벤트
  socket.on('sync-zoom', ({ zoomLevel }) => {
    if (socket.id !== presentationState.presenterId) return;

    presentationState.zoomLevel = zoomLevel;
    socket.broadcast.emit('zoom-synced', { zoomLevel });
  });

  // ----------------------------------------
  // 실시간 CSS 텍스트 어노테이션 (밑줄 / 형광펜)
  // ----------------------------------------

  // 1) 신규 CSS 텍스트 어노테이션 추가
  socket.on('add-annotation', ({ docPath, annotation }) => {
    if (socket.id !== presentationState.presenterId) return;

    const targetDoc = docPath || presentationState.currentDoc;
    if (!presentationState.docAnnotations[targetDoc]) {
      presentationState.docAnnotations[targetDoc] = [];
    }
    presentationState.docAnnotations[targetDoc].push(annotation);

    socket.broadcast.emit('annotation-added', { docPath: targetDoc, annotation });
  });

  // 2) 특정 CSS 어노테이션 삭제
  socket.on('remove-annotation', ({ docPath, annotationId }) => {
    if (socket.id !== presentationState.presenterId) return;

    const targetDoc = docPath || presentationState.currentDoc;
    if (presentationState.docAnnotations[targetDoc]) {
      presentationState.docAnnotations[targetDoc] = presentationState.docAnnotations[targetDoc].filter(
        a => a.id !== annotationId
      );
      io.emit('annotation-removed', { docPath: targetDoc, annotationId });
    }
  });

  // 3) CSS 어노테이션 전체 지우기
  socket.on('clear-annotations', ({ docPath }) => {
    if (socket.id !== presentationState.presenterId) return;

    const targetDoc = docPath || presentationState.currentDoc;
    presentationState.docAnnotations[targetDoc] = [];

    io.emit('annotations-cleared', { docPath: targetDoc });
  });

  // 4) 마지막 CSS 어노테이션 실행 취소 (Undo)
  socket.on('undo-annotation', ({ docPath }) => {
    if (socket.id !== presentationState.presenterId) return;

    const targetDoc = docPath || presentationState.currentDoc;
    if (presentationState.docAnnotations[targetDoc]?.length > 0) {
      presentationState.docAnnotations[targetDoc].pop();
      const updated = presentationState.docAnnotations[targetDoc];
      io.emit('annotations-updated', { docPath: targetDoc, annotations: updated });
    }
  });

  // ----------------------------------------
  // 실시간 자유 판서 (Whiteboard Canvas)
  // ----------------------------------------

  // 1) 드로잉 스트로크 추가 (선 그리기 완료 or 실시간 세그먼트)
  socket.on('draw-stroke', ({ docPath, stroke }) => {
    if (socket.id !== presentationState.presenterId) return;

    const targetDoc = docPath || presentationState.currentDoc;
    if (!presentationState.docStrokes[targetDoc]) {
      presentationState.docStrokes[targetDoc] = [];
    }
    presentationState.docStrokes[targetDoc].push(stroke);

    // 수강생들에게 실시간 렌더링 전달
    socket.broadcast.emit('stroke-added', { docPath: targetDoc, stroke });
  });

  // 2) 실시간 드로잉 진행 중인 포인트 스트리밍
  socket.on('drawing-point', ({ point, tool, color, size }) => {
    if (socket.id !== presentationState.presenterId) return;
    socket.broadcast.emit('drawing-point-stream', { point, tool, color, size });
  });

  // 3) 실시간 강사 마우스 커서 위치 및 도구 모양 브로드캐스트
  socket.on('cursor-move', (cursorData) => {
    if (socket.id !== presentationState.presenterId) return;
    socket.broadcast.emit('cursor-moved', cursorData);
  });

  // 3) 현재 문서 판서 전체 지우기
  socket.on('clear-strokes', ({ docPath }) => {
    if (socket.id !== presentationState.presenterId) return;

    const targetDoc = docPath || presentationState.currentDoc;
    presentationState.docStrokes[targetDoc] = [];

    io.emit('strokes-cleared', { docPath: targetDoc });
  });

  // 4) 마지막 판서 실행 취소 (Undo)
  socket.on('undo-stroke', ({ docPath }) => {
    if (socket.id !== presentationState.presenterId) return;

    const targetDoc = docPath || presentationState.currentDoc;
    if (presentationState.docStrokes[targetDoc]?.length > 0) {
      presentationState.docStrokes[targetDoc].pop();
      const updatedStrokes = presentationState.docStrokes[targetDoc];
      io.emit('strokes-updated', { docPath: targetDoc, strokes: updatedStrokes });
    }
  });

  // 5) 문서의 모든 판서 + 어노테이션 일괄 초기화
  socket.on('clear-all-drawings', ({ docPath }) => {
    if (socket.id !== presentationState.presenterId) return;

    const targetDoc = docPath || presentationState.currentDoc;
    presentationState.docStrokes[targetDoc] = [];
    presentationState.docAnnotations[targetDoc] = [];

    io.emit('strokes-cleared', { docPath: targetDoc });
    io.emit('annotations-cleared', { docPath: targetDoc });
  });

  // ----------------------------------------
  // 연결 종료 처리
  // ----------------------------------------
  socket.on('disconnect', () => {
    const wasPresenter = presentationState.presenterId === socket.id;
    if (wasPresenter) {
      resetSourceMode();
      presentationState.presenterId = null;
      io.emit('presenter-changed', { hasPresenter: false });
      console.log(`[퇴장] 강사 연결 종료됨: ${socket.id}`);
    }

    presentationState.connectedClients.delete(socket.id);
    io.emit('client-count-updated', { count: presentationState.connectedClients.size });
    console.log(`[퇴장] 소켓 연결 종료: ${socket.id} (남은 인원: ${presentationState.connectedClients.size}명)`);
  });
});

// ----------------------------------------------------
// 6. 서버 기동 및 최초 기본 문서 탐색 (0.0.0.0 바인딩)
// ----------------------------------------------------
server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIPs();

  console.log('====================================================');
  console.log(`🚀 Presentation Mirror 서버가 정상 실행되었습니다!`);
  console.log(`📡 [로컬 접속]   http://localhost:${PORT}`);
  if (localIps.length > 0) {
    localIps.forEach(({ interface: iface, ip }) => {
      console.log(`🌐 [호스트/LAN 접속] http://${ip}:${PORT}  (${iface})`);
    });
  } else {
    console.log(`🌐 [호스트/LAN 접속] http://0.0.0.0:${PORT}`);
  }
  console.log(`📂 교육자료 경로: ${MATERIALS_DIR}`);
  console.log(`🎥 MediaMTX WebRTC: ${MEDIA_MTX_WEBRTC_URL || `브라우저 호스트:${MEDIA_MTX_WEBRTC_PORT}`}/${MEDIA_MTX_PATH}`);
  console.log(`🔑 강사 기본 PIN 코드: ${PRESENTER_PIN}`);
  console.log('====================================================');

  // 서버 시작 시 첫 번째 마크다운 문서를 찾아 기본 문서로 설정
  try {
    const tree = scanDirectory(MATERIALS_DIR, MATERIALS_DIR);
    function findFirstMd(nodes) {
      for (const node of nodes) {
        if (node.type === 'file' && node.isMarkdown) return node.path;
        if (node.type === 'directory' && node.children) {
          const found = findFirstMd(node.children);
          if (found) return found;
        }
      }
      return '';
    }
    const defaultDoc = findFirstMd(tree);
    if (defaultDoc) {
      presentationState.currentDoc = defaultDoc;
      console.log(`📄 기본 시작 문서 설정됨: ${defaultDoc}`);
    }
  } catch (err) {
    console.warn('기본 문서 자동 탐색 중 알림:', err.message);
  }
});
