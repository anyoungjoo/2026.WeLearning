# HANDOVER - AutoReport 인수인계 정보

## 📍 현재 개발 세션 상태
- **마지막 작업:** `2.,API_TEST` ➔ `2.,AI_APP` 폴더 명칭 변경, 대문(`README.md`) 2·3단계 로드맵 상세화 및 Public GitHub 원격 저장소 동기화 완료 (2026-08-16)
- **상태:** ✅ **완전 완료** — 대문(`README.md`)과 폴더 구조, GitHub 저장소가 완벽히 일치된 상태

## 최종 완료 사항

### 실습 구조 및 로드맵 정비
- **`2.,AI_APP`**: 3-Tier 기본 채팅(v1) 및 AI 대화 요약 에이전트 확장(v2)
- **`README.md`**: 직관적이고 이모지 없는 전문적인 3단계 커리큘럼 대문 확립

### 수강생 자기주도 위키 확장 가이드 (`0-3`)
- **표준 프롬프트 제공**: 복사해서 쓰는 파인만 기법 기반 위키 생성 프롬프트
- **Mermaid 시각화 & 양방향 링크 규칙 정립**: 본문 ⇄ `wiki/` 문서 간 이동 표준화

### 교육 자료 범위 정제 (`1.교육자료/`)
- **개인 학습 자료 격리**: `심화_AI엔지니어링/` 폴더를 `.gitignore`에 등록하여 원격 저장소 제외
- **수강생 교육 과정 일원화**: `기본_AI 이해` 4단계 커리큘럼으로 대문(`README.md`)과 일치시킴

### 신규 GitHub 리포지토리 클린 배포
- **리포지토리 URL**: https://github.com/gkisanet/2026.autoreport (Public)
- **보안 검증 완료**: 과거 커밋 히스토리를 차단한 단일 Initial Commit만 존재하며, `config.js`는 완벽히 로컬에만 격리 보존됨

### 교육 대문 및 저장소 정체성 정립 (`README.md`)
- **3단계 파이프라인 로드맵 시각화**: Mermaid 다이어그램을 통한 학습 흐름 안내
- **각 단계별 핵심 교재 링크 및 5대 지식 베이스 거버넌스 가이드 완비**

### 크롬 확장앱 보안 안전화 & 수업 교재화 (`3.autoreport_크롬확장앱/`)
- **`config.js` & `config.example.js`**: Google RSA 비공개 키, API Key, TVDSS 계정을 `config.js`로 분리하고, 배포용 `config.example.js` 템플릿 제공
- **`.gitignore`**: `config.js` 자동 무시 등록
- **PII 가명화**: `erp_fields.js`, `contentscript.js`, 실습 문서 내 실명/사번을 샘플 가명 데이터로 교체
- **`README.md`**: 수업 안내, 키 설정 방법 2종(별도 파일 주입 vs 템플릿 복사), 실습 로드맵 전면 개정

### 크롬 확장앱 독립 패키지화 (`3.autoreport_크롬확장앱/`)
- **`docs/` 폴더 내 학습 교재 체계화**: `01_TUTORIAL.md`부터 `07_TROUBLESHOOTING.md`까지 학습 순서 번호 부여 완료
- **`README.md` 작성**: 확장 프로그램 소개, 설치 및 로드 방법, 학습 가이드 목차 완비

### AI 교육 자료 정돈 (`1.교육자료/`)
- **`3-3. CONTEXT_관리_실습(LAB).md` 이관**: Context Window 한계/RAG/Vercel 실습 교재를 기본 교육자료 하위로 배치

### 프로젝트 거버넌스 (`docs/`)
- **5대 핵심 지식 베이스만 단일 집중 관리**: `CONTEXT.md`, `TASKS.md`, `CHANGELOG.md`, `HANDOVER.md`, `LESSONS.md`

### 교육 자료 (`docs/교육자료 배포/`)
- **`0. 교육준비물.md`**: 설치 10단계 체크리스트 (Antigravity / WSL / Docker / nvm+Node / GitHub / OpenRouter / opencode), clone vs fork, Rules 등록
- **`0-1. 마크다운_문서_읽는_법.md`**: 마크다운 토큰 효율성 설명 및 크롬 드래그 앤 드롭 렌더링 설정 가이드
- **`0-2. 마크다운_문법.md`**: 마크다운 기본 문법 및 Mermaid.js 텍스트 기반 시퀀스/플로우차트 다이어그램 예시 가이드
- **`참고3_AGENTS_템플릿.md`**: 복사해서 쓰는 `AGENTS.md` 표준 양식
- **`3-0. CONTEXT_관리.md`**: 메인 교재 (기존 `3. CONTEXT_관리.md`에서 개명 — 폴더 정렬용)

### API_TEST (`API_TEST/`)
- **`v1_basic/`**: ✅ 완성된 3-Tier 채팅앱. **수강생은 실행하고 관찰만 함**
  - DB는 **진짜 SQLite** (`node:sqlite` 내장 모듈, `npm install` 불필요)
  - 테이블: `users` / `reports` / `chat_rooms` / `chat_messages`
  - 채팅 조회 정렬은 **`ORDER BY id`** (저장 순서) ← v2에서 `created_at`으로 바뀌는 것이 실습 핵심
- **`v2_extended/`**: 🤖 **AI가 만들 작업대**. v1과 동일한 코드 + 계획서 2종
  - `DEVELOPMENT_PLAN.md` — 수강생이 AI에게 단계별로 던지는 지시서
  - `AGENTS.md` — Antigravity Custom Rules에 등록할 규칙

## ⚠️ 실패 이력 (지뢰밭)
- **확장자만 `.sqlite`인 JSON 파일**: v1_basic의 DB가 실제로는 JSON 텍스트여서 SQLite Viewer로 열리지 않았음. 매뉴얼은 열린다고 안내하고 있었음 → **문서와 코드가 어긋난 대표 사례**
- **채팅이 DB를 거치지 않던 문제**: Socket.io 브로드캐스트만 하고 저장하지 않아 새로고침하면 소멸. 3-Tier라고 말하면서 실제로는 2-Tier였음
- **`better-sqlite3` / `sqlite3` 사용 금지**: 윈도우에서 네이티브 컴파일 실패 시 수업 전체가 멈춤. 반드시 Node 내장 `node:sqlite` 사용
- **reasoning 모델 응답 파싱**: `message.reasoning`과 `message.content`가 분리되어 나옴. **`choices[0].message.content`** 를 읽어야 함
- **무료 모델의 속도 제한(429)**: 다수가 동시에 요약을 요청하면 실패. 조를 나눠 시차를 둘 것
- **CRLF 줄바꿈 오염**: WSL에서 `/mnt/d`의 파일을 편집하면 전체 파일이 재작성된 것처럼 표시됨 → `.gitattributes`로 차단함
- **ChatGPT 웹 UI 복사/붙여넣기 방식**: 파일이 5개 이상 넘어가면 Context 누락으로 복잡한 개발 실패. CLI 또는 Agentic IDE 활용 필수
- **파일 업로드를 AI 학습으로 착각하는 문제**: 파일 업로드는 단순 오픈북(Context 주입)일 뿐이며, RAG 또는 Fine-Tuning과 구별하여 설명해야 함
- **localhost 주소를 외부 사용자에게 전달**: `127.0.0.1` 또는 `localhost`는 내 PC 전용이므로 외부 공유 불가. 반드시 Vercel 등의 퍼블릭 호스팅 배포 필요

## 🚀 다음 스텝 (Immediate Next Step)
1. `v2_extended`를 실제 약한 모델(무료 티어)로 1회 완주하여 계획서의 빈틈 검증
2. 수강생용 GitHub 및 Vercel 무료 계정 사전 가이드 배포
3. AutoReport Chrome Extension 사내망 배포 및 교육 세션 진행

## 💡 TL;DR — 오늘 배운 핵심 개념
- **id ≠ created_at**: `id`는 "몇 번째로 저장됐는가", `created_at`은 "몇 시에 말했는가". 평소엔 같아 보이지만 근본적으로 다른 정보다.
- **"영상이 존재한다" ≠ "학습 데이터가 존재한다"**: 학습에 쓰려면 정답과 짝지어져 있어야 한다. 음성인식은 자막이, 이미지생성은 alt 텍스트가 공짜 짝이었다.
- **Context Window**: AI의 작업 기억 책상. 대화가 길어지면 슬라이딩 윈도우로 옛 지침을 잊는다.
- **RAG vs Context 주입**: 5,000p 사내 매뉴얼은 RAG(검색 조각 주입)를 통해 토큰 비용과 지연시간을 대폭 감소시킨다.
- **로컬 vs 퍼블릭**: `localhost`는 우리 집 거실 TV, `Vercel`은 지상파/유튜브 방송과 같다.
