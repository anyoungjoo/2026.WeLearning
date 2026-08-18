# CHANGELOG — AutoReport 변경 이력

## 2026-08-18 — 원격 저장소 이관 및 심화 교육자료 저장소 포함 (`.gitignore` 정비)

### 저장소 관리 및 거버넌스
- **원격 저장소 URL 이관**: `2026.09-kbs-vibe-coding` ➔ `2026.autoreport` 원격 저장소(`main` 브랜치)로 동기화 완료.
- **`.gitignore` 갱신 및 심화 교육자료 포함**:
  - `1.교육자료/심화_AI엔지니어링/` 폴더 내 심화 마크다운 교재 9종을 원격 저장소에 포함.
  - 불필요한 예외 규칙을 정리하여 저장소 일관성 확보.

---

## 2026-08-16 — `2.AI_APP` 폴더 명칭 변경 및 대문(`README.md`) 2·3단계 로드맵 상세화

### 교육 과정 및 문서 체계화
- **실습 폴더 명칭 변경**: `2.,API_TEST` ➔ `2.,AI_APP` (실제 앱 개발 성격을 명확히 반영)
- **루트 `README.md` 교육 목적 상세화**:
  - 1단계: 마크다운 습득 ➔ 나만의 위키 확장 ➔ AI 본질/원리 이해 순서로 재정렬.
  - 2단계: 3-Tier 아키텍처 이해 및 v1 기본 채팅 ➔ v2 AI Agent 대화 요약 기능 확장 목표 명시.
  - 3단계: 독립 웹앱(2단계)과 브라우저 제어 크롬 확장앱(3단계)의 차이점 비교 설명 추가.
- **`docs/CONTEXT.md` 아키텍처 다이어그램 및 설명 최신화**.

---

### 교육 교재 및 문서 체계화
- **`1.교육자료/0-3. 나만의_AI_학습위키_확장가이드.md` 신설**:
  - 수강생이 교재 본문(`2. AI의_이해.md` 등)을 읽다가 모르는 개념(트랜스포머, 토큰 등)을 만났을 때, AI에게 복사해 명령하는 **[표준 프롬프트 템플릿]** 제공.
  - `wiki/` 서브폴더 기반 점진적 정보 공개(Progressive Disclosure) 아키텍처 및 상대경로 양방향 하이퍼링크 표준 제정.
  - ELIF 1분 비유 + Mermaid.js 흐름도 + Why 혁신 배경으로 구성된 위키 문서 표준 템플릿 및 예시 수록.
  - 루트 `README.md`의 Step 1 커리큘럼에 해당 가이드 반영.

---

### 저장소 관리 및 거버넌스
- **`1.교육자료/심화_AI엔지니어링/` 폴더 원격 저장소 제외**:
  - 로컬 디스크의 원본 파일은 그대로 유지하면서 `git rm -r --cached`로 Git 인덱스(추적 대상)에서만 분리.
  - `.gitignore`에 `1.교육자료/심화_AI엔지니어링/` 등록하여 향후 변경 사항이 원격 저장소로 유입되지 않도록 차단.
  - `README.md`에서 심화 자료 항목을 정돈하고, `기본_AI 이해` 중심의 통일된 강의 교재 구성 확립.

---

### 배포 및 저장소 거버넌스
- **과거 히스토리가 완전히 배제된 신규 리포지토리 생성 및 푸시**:
  - GitHub 리포지토리 생성: [`https://github.com/gkisanet/2026.09-kbs-vibe-coding`](https://github.com/gkisanet/2026.09-kbs-vibe-coding) (Public)
  - 기존의 과거 커밋 히스토리에 포함되었을 수 있는 모든 민감 정보(키, 사번 등)를 원천 차단하기 위해 **단일 클린 Initial Commit**으로 푸시 완료.
  - `config.js`가 `.gitignore`에 의해 완벽히 격리된 상태로 배포됨.

---

### 교육 과정 및 문서 체계화
- **루트 `README.md` 전면 재작성**:
  - 단일 Chrome 확장 프로그램 안내 문서에서 **"KBS 청주방송총국 AI 바이브 코딩(Vibe Coding) 실무 교육 통합 워크스페이스"** 대문으로 전면 전환.
  - 3단계 학습 파이프라인(Step 1: AI 이론/Context 엔지니어링 ➔ Step 2: 3-Tier 풀스택 API 협업 실습 ➔ Step 3: 사내 레거시 ERP 자동화 크롬 확장앱) 로드맵 및 Mermaid 다이어그램 추가.
  - 5대 엔지니어링 지식 베이스(`docs/`) 거버넌스 가이드 및 권장 개발 환경 명시.

---

### 보안 및 자격 증명 안전화
- **`config.js` / `config.example.js` 분리 아키텍처 도입**:
  - `sheet.js`에 하드코딩되어 있던 Google Service Account RSA Private Key(PEM), API Key, Sheet ID를 `config.js`로 분리.
  - `tvdss.js`의 TVDSS 로그인 계정(ID/PW)을 `config.js`로 분리.
  - 저장소 공개를 위한 플레이스홀더 템플릿 `config.example.js` 신설.
  - `3.autoreport_크롬확장앱/.gitignore` 및 루트 `.gitignore`에 `**/config.js`를 등록하여 커밋 누출 원천 차단.
- **임직원 개인정보(PII) 가명화**:
  - `erp_fields.js`, `contentscript.js`, `docs/03_CLONE_CODING.md`, `docs/05_CODE_STUDY.md`의 실제 직원 실명 및 사번을 샘플 가명 데이터(홍길동, 김철수 등)로 일체 교체.
- **수업 교재용 `README.md` 전면 개정**:
  - 공개 저장소로서의 교육 목표, `config.example.js`를 통한 키 설정법, 부서원 명단 커스터마이징 실습 안내, 단계별 학습 커리큘럼 완비.

### 기술적 이점
- **Secret Management 모범 사례 준수**: 코드베이스와 인증 자격 증명의 라이프사이클을 분리하여 GitHub 공개 저장소 배포 시 보안 사고를 100% 예방.

---

### 교육 교재 및 문서 체계화
- **`3.autoreport_크롬확장앱/docs/` 신설 및 학습 순서 번호화**:
  - `01_TUTORIAL.md` (입문 및 IDE 환경)
  - `02_ERP_REVERSE_ENG.md` (ERP F12 분석)
  - `03_CLONE_CODING.md` (8단계 클론 코딩 실습)
  - `04_DEVLOG.md` (개발자 사고 흐름)
  - `05_CODE_STUDY.md` (코드 기법 10선)
  - `06_REDIRECT_FIX.md` (MAIN world 리다이렉트 방지 가이드)
  - `07_TROUBLESHOOTING.md` (실전 버그 5건 트러블슈팅)
  - `README.md` (확장앱 개요, 설치법, 학습 로드맵 완비)
- **`1.교육자료/기본_AI 이해/`로 실습 교재 이관**:
  - `CONTEXT_MANAGEMENT_LAB.md` ➔ `3-3. CONTEXT_관리_실습(LAB).md`
- **루트 `docs/`의 순수 5대 거버넌스 지식 베이스 정예화**:
  - `CONTEXT.md`, `TASKS.md`, `CHANGELOG.md`, `HANDOVER.md`, `LESSONS.md` 유지

### 기술적 이점
- **독자별 관심사 분리 (Audience Separation)**: 수강생용 도메인 튜토리얼과 개발/인수인계용 거버넌스 문서의 경계가 명확해져 온보딩 시간 단축 및 문서 유지보수 비용 절감.

---

## 2026-08-16 — Chrome 확장 프로그램 소스 `autoreport/` 분리 및 디렉토리 구조 리팩토링

### 아키텍처 및 저장소 관리
- **`autoreport/` 전용 폴더 신설 및 확장 프로그램 리소스 이관**:
  - 기존 루트에 분산되어 있던 크롬 확장 프로그램 파일(`manifest.json`, `background.js`, `contentscript.js`, `popup.html`, `popup.js`, `erp_fields.js`, `excel_parser.js`, `override_checksave2.js`, `save_no_redirect.js`, `sheet.js`, `tvdss.js`, `xlsx.full.min.js`, `favicon.ico`, `data/`, `_locales/`)을 `autoreport/` 하위로 격리 이관.
- **문서 및 가이드 최신화**:
  - `README.md` 프로젝트 구조 및 확장 프로그램 설치 경로(`autoreport/` 폴더 선택) 업데이트.
  - `docs/CONTEXT.md`, `docs/TASKS.md`, `docs/HANDOVER.md`, `docs/LESSONS.md` 최신 구조 반영.

### 기술적 이점
- **관심사 분리 (Separation of Concerns)**: 프로젝트 루트에서 크롬 확장 프로그램(`autoreport/`), API 실습 샌드박스(`API_TEST/`), 교재 및 아키텍처 문서(`docs/`)의 경계가 명확해져 유지보수성 및 인수인계 명확성 대폭 향상.

---

### 교육 자료
- **`0. 교육준비물.md` 신설**: Antigravity IDE / WSL / Docker / nvm+Node / GitHub / OpenRouter / opencode 설치 10단계 체크리스트, clone vs fork 비교, Antigravity Custom Rules 등록 절차
- **`참고3_AGENTS_템플릿.md` 신설**: 복사해서 쓰는 `AGENTS.md` 표준 양식 및 글로벌 규칙(`GEMINI.md`) 예시
- **`3-2. 사례연구_AI_수어통역.md` 개정**: 외부 대화에 의존해 맥락이 끊기던 6곳 제거. Part 4에 `4.0`(회의에서 나오는 말 4가지) 신설 → `4.5`에서 채점하는 구조로 재구성
- **파일명 정렬**: `3. CONTEXT_관리.md` → `3-0. CONTEXT_관리.md` (개명으로 끊어진 문서 간 링크 16곳 일괄 수정)

### API_TEST — v1_basic
- **⭐ 가짜 SQLite → 진짜 SQLite 전환**: `database.sqlite`가 확장자만 `.sqlite`인 JSON 텍스트 파일이어서 SQLite Viewer로 열리지 않았음. Node 내장 `node:sqlite` 모듈로 전환 (`npm install` 불필요, 윈도우 네이티브 빌드 실패 위험 제거)
- **`chat_rooms` / `chat_messages` 테이블 추가**: 채팅이 Socket.io 브로드캐스트만 되고 어디에도 저장되지 않던 문제 해결. 새로고침해도 대화가 유지되며, DB 계층을 끄면 채팅이 멈추므로 3-Tier 의존 관계를 체감 가능
- **`GET /api/chat/messages` 추가**: 브라우저 주소창만으로 백엔드 경유 조회와 DB 직접 조회를 비교할 수 있음
- **타임스탬프 형식**: `created_at`을 `YYYY-MM-DD HH:MM:SS` 문자열로 저장 (SQLite Viewer에서 직접 수정 가능한 형식)

### API_TEST — v2_extended
- **기존 코드 전면 삭제 후 바이브 코딩 실습 작업대로 재구성**
- **`DEVELOPMENT_PLAN.md` 신설**: 수강생이 AI에게 그대로 던지는 개발계획서. 프론트(404) → 백엔드(500) → DB(성공) 순으로 한 계층씩만 수정하게 하여 단계마다 다른 창구(DevTools / 터미널 / SQLite Viewer)에서 서로 다른 에러를 관찰하도록 설계
- **4단계 실습**: SQLite Viewer에서 `created_at`을 직접 수정한 뒤 `/요약 15:00-17:00` 검증 → "id 순서 ≠ 시간 순서"를 손으로 체득
- **`AGENTS.md` 신설**: `sqlite3` 설치 금지, `message.content` 파싱 등 코딩 능력이 낮은 모델이 자주 틀리는 지점을 규칙으로 고정
- **요약 모델**: `nvidia/nemotron-3-ultra-550b-a55b:free` (OpenRouter API로 무료·컨텍스트 100만 검증)

### 저장소 관리
- **`.gitattributes` 추가**: WSL/Windows 혼용으로 줄바꿈(CRLF↔LF)만 바뀐 파일이 전체 재작성으로 표시되던 문제 차단 (`* text=auto eol=lf`)

---

## 2026-08-06 — 원격 저장소 동기화 (`git pull`) 및 교육 자료 개정 반영

### 최신화 이력
- **원격 변경 사항 동기화 (Fast-forward)**: `origin/main` (commit `e50c2d8`) 동기화 완료
- **교육자료 배포 문서 개정**: `0-1. 마크다운_문서_읽는_법.md` (초보자용 쉽게 읽기 도입부 재작성), `0-2. 마크다운_문법.md` (기본 문법별 렌더링 미리보기 화면 추가) 신규 작성 및 `0. 교육준비물.md` 체크리스트 링크 추가
- **교육자료 배포 문서 개정 (원격)**: `3-1. 영상생성AI의_Context.md`, `3-2. 사례연구_AI_수어통역.md`, `3. CONTEXT_관리.md`, `참고2_AI_도입_판별표.md` 추가 및 개정
- **API_TEST v1_basic 프론트엔드 개정**: Vue 3 + Vite 기반 대시보드, 인증, 채팅 뷰 구현 및 패키지 최신화

### 기술적 이점
- **최신 3-Tier 실습 코드 및 교육 문서 통합**: 원격 저장소의 교육 교재와 Vue 3 프론트엔드 실습용 싱글 페이지 애플리케이션(SPA) 최신 소스코드 동기화

---

## 2026-08-05 — 3-Tier API 실습 프로젝트 (`API_TEST`) 가동 및 매뉴얼 개정

### 개정 및 가동 이력
- `API_TEST/v1_basic/` — 1차 기본 3-Tier 서버 전체 가동 성공 (Frontend Port 8080, Backend Port 4000, DB Port 5000)
- `API_TEST/v2_extended/` — 2차 확장 3-Tier 프로젝트 (`category`, `priority` REST API/대시보드 & Socket.io 채팅 병합)
- `API_TEST/MANUAL_VIBE_CODING.md` — 영문 호환 경로(`v1_basic`, `v2_extended`) 및 포트 8080 반영 매뉴얼 개정

### 이점 및 기술적 특징
- **REST API + WebSocket(Socket.io) 융합 3-Tier 아키텍처**: 독립된 프론트엔드/백엔드 계층 간 REST API(데이터 등록/조회)와 Socket.io 양방향 통신(방 생성, 방 입장, 실시간 채팅)을 통합 가동하여 종합적인 API 실습 환경 구축
- `docs/1. 교육과정.md` (기존 `TRAINING_PLAN.md` 변경 및 정비)
- `docs/2. AI의_이해.md` (신규 교재 구조 및 내용 생성)
- `docs/3. CONTEXT_MANAGEMENT.md` (기존 `CONTEXT_MANAGEMENT.md` 번호 부여)
- `docs/참고1_AI_TOOLS_COMPARISON.md` (기존 `AI_TOOLS_COMPARISON.md` 번호 부여)
- 백업 문서 분리: `docs/2. AI의_이해_OLD.md`, `docs/CONTEXT_MANAGEMENT_OLD.md`

### 이점 및 기술적 특징
- **SQLite 네트워킹 한계 극복**: SQLite REST Gateway Server(Express)를 구현하여 독립된 IP(PC 3)에서 SQLite DB 모니터링(`SQLite Viewer`)과 백엔드 HTTP 통신을 동시에 지원
- **실무형 애자일 개편 시뮬레이션**: 1차 ➡️ 2차 스키마 변경 시 DB 마이그레이션(`ALTER TABLE`), REST API 변경, 프론트엔드 UI 폼 확장의 전체 협업 흐름 체득

---

## 2026-07-30 — 교육 과정 5종 개정 및 Vercel 배포 실습 추가

### 개정 및 작성 문서
- `docs/CONTEXT_MANAGEMENT.md`
  - **7개 Part 전면 재구조화**: Context Window, 토큰 비용, Chat vs CLI vs Agentic IDE 도구 비교, 방송기술 사내 RAG 사례, Chrome Extension vs Vercel 호스팅, Vercel Step-by-Step 실습 교재 작성 (~600줄)
- `docs/CONTEXT_MANAGEMENT_LAB.md`
  - **실습 1~4 실습서 개정**: Context Window 체험(20분), RAG 시뮬레이션(20분), 나만의 웹앱 제작 + Vercel 배포(60분), AutoReport HANDOVER.md 인수인계 시연(20분) (~300줄)
- `docs/AI_TOOLS_COMPARISON.md`
  - **종합 비교 명세표 추가**: Chat UI vs CLI vs Agentic IDE 비교 명세표 및 Vercel, Netlify, GitHub Pages, AWS, 자체 서버 호스팅 특성 및 난이도 비교표 (~200줄)
- `docs/TRAINING_PLAN.md`
  - **교육 계획서 전면 개정**: 3시간 × 2일 시간표, 최종/세부 학습 목표 및 교재 매핑 정리
- `docs/TUTORIAL.md`
  - **Part 0 섹션 추가**: Context 관리 핵심 원리, 지식 주입 3가지 방식(Context 주입, RAG, 학습) 비교 및 AutoReport `docs/` 연동 구조 포함

---

## 2026-05-04 — 드롭다운 선택 버그 수정

### 버그 수정
- popup.js
  - **통신 에러 핸들링 추가**: 확장 프로그램 재로드 시 기존 탭에 주입된 구버전 Content Script와의 통신이 끊어져 발생하는 Receiving end does not exist 에러를 포착
  - **해결**: chrome.tabs.sendMessage의 콜백 함수에서 chrome.runtime.lastError 존재 여부를 검사하고, 사용자에게 명시적으로 페이지 새로고침을 안내하는 alert 창 띄움
  - **이점**: 사용자가 에러 발생 원인을 모른 채 앱 삭제 후 재설치하는 불편함(UX 저하) 해소
- contentscript.js
  - **드롭다운 선택 버그 수정**: indOptionByText 함수에서 includes 방식의 문자열 포함 검사로 인해, 키워드 '송출' 검색 시 'CM SPOT 및 SCROLL 송출'(A2000130)이 실제 '송출'(A2000145)보다 먼저 일치되어 잘못 선택되는 문제
  - **원인**: ERP 옵션 텍스트(A2000130 : CM SPOT 및 SCROLL 송출) 내에 검색어('송출')가 포함되어 있어 includes로 검색 시 오탐 발생
  - **해결**: 구분자(:) 뒤의 텍스트를 파싱하여 정확히 일치(Exact Match)하는 옵션을 우선적으로 찾도록 검색 우선순위 변경
  - **이점**: 옵션 문자열의 부분 포함으로 인한 예기치 않은 오매핑 방지, 향후 유사 텍스트를 가진 코드 추가 시에도 안정적인 매핑 보장

---

## 2026-03-09 — 교육자료 3종 작성

### 신규 파일
- `docs/TUTORIAL.md` — AI와 함께하는 업무 자동화 개발 교육자료 (사고 구조, Antigravity IDE 세팅, AI 프롬프트 작성법)
- `docs/CLONE_CODING_GUIDE.md` — 8단계 클론 코딩 실습 가이드 (빈 폴더 → 완성까지 단계별 AI 프롬프트 포함)
- `docs/ERP_REVERSE_ENGINEERING.md` — 콘솔 로그로 ERP 시스템 리버스 엔지니어링한 전체 과정 재현

### 기술적 포인트
- 프로그래밍 비전공자 대상: 코드가 아닌 **사고 구조**와 **문제 정의 능력** 중심
- 콘솔 로그 50건 이상의 사용 패턴을 4가지 유형(로드확인/동작추적/데이터검증/매핑결과)으로 분류
- ERP 시스템 분석 과정: 필드 스캔 → 함수 스캔 → 네트워크 감시 → 저장 흐름 추적 → API 형식 파악
