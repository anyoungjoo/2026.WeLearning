# AGENTS.md

이 문서는 이 프로젝트에서 AI 에이전트가 지켜야 할 규칙이다.
작업을 시작하기 전에 반드시 이 문서와 `DEVELOPMENT_PLAN.md` 를 먼저 읽는다.

---

## 1. 프로젝트 개요

- **무엇을 만드는가**: 3-Tier 채팅 앱에 **AI 대화 요약(`/요약`)** 기능을 붙인다.
- **누가 쓰는가**: 프로그래밍 비전공 교육 참석자.
- **개발자 수준**: 비전공자다. **설명은 쉬운 말로, 전문 용어는 괄호로 풀어서** 해라.
- **상세 명세**: `DEVELOPMENT_PLAN.md` 에 전부 적혀 있다. 그 문서를 따른다.

### 출발점 (v1_채팅앱(AI기능 X)에서 물려받은 상태)

`chat_messages` 테이블에는 **시간 컬럼이 없다.**

```sql
chat_messages (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,   -- 저장된 순서. 이게 전부다
  room_id TEXT NOT NULL,
  sender  TEXT NOT NULL,
  message TEXT NOT NULL
)
```

- 1~3단계: 이 상태 그대로 **전체 요약**만 만든다.
- **4-1단계**: 여기서 처음으로 `timestamp TEXT NOT NULL` 컬럼을 추가하고,
  조회 기준을 `ORDER BY id` → `ORDER BY timestamp` 로 바꾼다.

## 2. 기술 스택 (고정 — 바꾸지 마라)

| 계층 | 포트 | 스택 |
|---|:---:|---|
| Frontend | 8080 | Vue 3 + Vite + socket.io-client |
| Backend | 4000 | Express 4 + Socket.io |
| Database | 5000 | Express 4 + **`node:sqlite` (Node 내장 모듈)** |

## 3. 절대 하지 말 것 (Don't) ⭐ 가장 중요

- ❌ **`sqlite3`, `better-sqlite3`, `sequelize`, `prisma` 를 설치하지 마라.**
  이 프로젝트는 Node 내장 모듈 `node:sqlite` 를 쓴다.
  `const { DatabaseSync } = require('node:sqlite');` — `db_server.js` 에 이미 이렇게 되어 있다.
- ❌ **`npm install` 로 새 패키지를 추가하지 마라.** `fetch` 는 Node에 내장되어 있다.
- ❌ **지시받은 단계 외의 폴더를 열지 마라.**

  | 단계 | 열어도 되는 폴더 |
  |:---:|---|
  | 1 | `frontend/` |
  | 2 | `backend/` |
  | 3 | `database/` |
  | 4-1 | `database/` |
  | 4-2 | `backend/` |
  | 4-3 | `frontend/` |

- ❌ **API 키를 코드에 직접 써 넣지 마라.** DB의 `settings` 테이블에만 저장한다.
- ❌ **API 키 원문을 프론트엔드로 돌려주지 마라.** 등록 여부(`hasApiKey`)만 알려준다.
- ❌ **기존 기능(로그인, 채팅, 방 만들기, 보고서 등록)을 건드리지 마라.**
- ❌ 한 번에 **파일 3개 이상을 고치지 마라.**
- ❌ 시각 값을 Date 객체나 UNIX 숫자로 바꾸지 마라. **문자열 그대로** 다룬다.
- ❌ **3단계까지는 `chat_messages` 테이블을 건드리지 마라.**
  시간 컬럼(`timestamp`)은 **4-1단계에서만** 추가한다.

## 4. 반드시 지킬 것 (Do)

- 코드를 고치기 전에 **어떤 파일을 왜 고칠지 먼저 한 줄로 말하고 승인을 받아라.**
- 모든 시각은 **`'YYYY-MM-DD HH:MM:SS'` 형식의 문자열**이다.
  SQLite에서 문자열 비교(`>=`, `<=`)만으로 시간 범위를 거를 수 있다.
  `db_server.js` 에 이미 있는 `nowString()` 함수를 그대로 쓴다.
- OpenRouter 응답은 **반드시 `data.choices[0].message.content`** 를 읽어라.
  이 모델은 reasoning 모델이라 `message.reasoning` 이 따로 있다. 그걸 읽으면 안 된다.
- 에러가 나면 **추측하지 말고, 실제 응답값을 `console.log` 로 출력해서 확인해라.**
- 주석과 사용자에게 보이는 문구는 **한국어**로 작성해라.
- 확신이 없으면 **모른다고 말해라.** 그럴듯하게 지어내지 마라.

## 5. 코드 스타일

- 들여쓰기 2칸, 변수·함수명은 camelCase
- 기존 파일에 이미 쓰인 방식을 **그대로 따라 해라.** 새로운 패턴을 도입하지 마라.
- **왜 그렇게 했는지**를 주석으로 남겨라.

## 6. 실행 방법

```bash
# 터미널 3개를 각각 열어서 순서대로 실행한다
cd database && npm install && npm run init-db && npm start   # 5000
cd backend  && npm install && npm start                      # 4000
cd frontend && npm install && npm run dev                    # 8080
```

- 사용자 화면: http://localhost:8080
- 관리자 대시보드: http://localhost:4000/dashboard
- DB 파일: `database/database.sqlite` (VS Code `SQLite Viewer` 로 열람)

## 7. 작업 절차

1. 요청을 **내 말로 한 줄 요약**해서 되물어 확인한다
2. 고칠 파일 목록을 먼저 제시한다
3. 승인을 받고 수정한다
4. **실행해서 동작을 확인한다** (되는지 안 되는지 추측하지 않는다)
5. 어느 단계까지 끝났는지 알려준다

## 8. 보안

- 실제 개인정보를 예시로 쓰지 마라. `홍길동`, `test@example.com` 같은 가짜 값을 써라.
- `.gitignore` 에 `node_modules/`, `database.sqlite`, `.env` 가 포함되어야 한다.
