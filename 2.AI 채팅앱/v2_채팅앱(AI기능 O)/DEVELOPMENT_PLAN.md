# 🚀 v2_채팅앱(AI기능 O) 개발계획서 — 복사·붙여넣기로 만드는 채팅 요약 기능

> **여러분은 코드를 한 줄도 짜지 않습니다.**
> 아래에 나오는 **회색 상자**를 위에서부터 순서대로 **복사(Ctrl+C) → AI 채팅창에 붙여넣기(Ctrl+V) → Enter**.
> 그게 전부입니다.

---

## 📌 시작 전 30초 안내

```
이 문서에는 두 종류의 회색 상자만 있습니다.

  📋 [AI에게 붙여넣기]   → Antigravity(또는 Cursor) 채팅창에 붙여넣습니다
  💻 [터미널에 붙여넣기]  → 검은 터미널 창에 붙여넣고 Enter 를 칩니다

그 외의 글은 "지금 무슨 일이 일어나는지" 설명일 뿐입니다.
급하면 회색 상자만 따라가도 완성됩니다.
```

> ### 🚨 단 하나의 규칙
> **한 번에 한 단계만 시킵니다.** "전부 다 만들어줘"라고 하면 반드시 망가집니다.
> 1단계가 끝나고 확인이 될 때까지 2단계 상자를 건드리지 마십시오.

---

## 🗺 전체 지도

| 단계 | 무엇을 시키나 | 고쳐지는 폴더 | 끝나면 이렇게 됨 |
|:---:|---|---|---|
| **0** | 규칙 등록 | — | AI가 규칙을 외운다 |
| **1** | `/요약` 화면 만들기 | `frontend/` | ❌ **404 에러** (정상입니다) |
| **2** | 요약 기능 만들기 | `backend/` | ❌ **500 에러** (정상입니다) |
| **3** | 저장소 만들기 | `database/` | ✅ **전체 요약 성공!** |
| **4** | ⭐ **시간(timestamp) 붙이기** | `database/`→`backend/`→`frontend/` | ✅ **시간별 요약 성공!** |
| **5** | 시간을 손으로 고쳐서 검증 | (코드 수정 없음) | 🎓 **DB를 다룰 줄 알게 됨** |

> ### ⚠️ 1단계와 2단계에서 에러가 나는 것은 **고장이 아니라 설계입니다.**
> 한 계층씩만 만들기 때문에, **아직 안 만든 계층 때문에** 에러가 납니다.
> 그 에러를 눈으로 보는 것이 이 실습의 목적입니다.

---

## 🎯 다 만들면 이렇게 됩니다

```
┌──────────────────────────────────────────────────────┐
│  💬 자유 수다방                            ⚙️        │
├──────────────────────────────────────────────────────┤
│  홍길동   오늘 회의는 3시에 시작합니다        15:10   │
│  김철수   네 자료는 준비됐습니다              15:12   │
│  홍길동   장소는 3층 회의실입니다             16:40   │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ 🤖 AI 요약  (15:00 ~ 17:00 · 메시지 3건)        │  │
│  │                                                │  │
│  │ 오늘 회의는 오후 3시 3층 회의실에서 진행되며,   │  │
│  │ 발표 자료는 이미 준비 완료된 상태입니다.        │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  [ /요약 15:00-17:00              ]      [ 전송 ]    │
└──────────────────────────────────────────────────────┘
```

| 입력 | 동작 | 만들어지는 단계 |
|------|------|:---:|
| `/요약` | 이 방의 **전체** 대화 요약 | 3단계 |
| `/요약 15:00-17:00` | 그 **시간대**만 요약 | **4단계** ⭐ |
| `/요약 오후 3시부터 5시까지` | 위와 동일 | **4단계** ⭐ |

---
---

# 0단계 — 규칙 등록 (딱 한 번, 2분)

## ① Antigravity 로 `v2_채팅앱(AI기능 O)` 폴더를 엽니다

## ② 규칙 파일을 등록합니다

```
… (점 3개) → Customizations → Rules → [+ Workspace]
→ AGENTS.md 내용을 통째로 붙여넣기 → Always On 체크
```

## ③ 📋 AI에게 붙여넣기 — 첫 대화

```
[절대 규칙 — 작업 내내 지킬 것]

1. DB는 Node.js 내장 모듈 node:sqlite 만 쓴다.
   sqlite3, better-sqlite3, sequelize, prisma 를 절대 설치하지 마라.
   npm install 로 새 패키지를 추가하지 마라.
   const { DatabaseSync } = require('node:sqlite'); 를 쓴다.
   database/db_server.js 에 이미 그렇게 되어 있으니 그대로 따라 해라.

2. 내가 지시한 단계의 폴더만 열어라. 다른 폴더는 열지도 마라.

3. 시각은 'YYYY-MM-DD HH:MM:SS' 형식의 문자열로만 다룬다.
   Date 객체나 UNIX timestamp 로 바꾸지 마라.

4. 이미 잘 되는 기능(로그인, 채팅, 방 만들기, 보고서 등록)을 건드리지 마라.

5. API 키를 코드에 직접 써 넣지 마라. 화면에 그대로 표시하지도 마라.

6. 한 번에 파일 3개 이상 고치지 마라. 고치기 전에 무엇을 고칠지 먼저 말해라.

7. 주석과 화면 문구는 한국어로 써라.

이해했으면 "확인했습니다"라고만 답하고 대기해라.
```

---
---

# 🥇 1단계 — 화면 만들기 (frontend)

> **끝나면**: 버튼과 입력창이 생깁니다. **아직 아무것도 동작하지 않습니다. 그게 정상입니다.**

## ① 📋 AI에게 붙여넣기

```
DEVELOPMENT_PLAN.md 의 [1단계] 만 구현해줘.
backend/ 와 database/ 폴더는 절대 열지 마.
고칠 파일은 frontend/src/views/ChatView.vue 하나뿐이야.

--- 만들 것 4가지 ---

(1) ⚙️ 설정 모달
   · 채팅 카드 제목 오른쪽에 ⚙️ 버튼을 추가한다
   · 누르면 모달이 열린다
   · 입력칸 2개:
       - OpenRouter API 키   → 반드시 type="password"
       - 모델 ID             → 기본값 nvidia/nemotron-3-ultra-550b-a55b:free
   · 모달이 열릴 때  GET  http://localhost:4000/api/settings 를 호출한다
       응답 { hasApiKey: true/false, model: "..." }
       ⚠️ 키 원문은 서버가 안 준다. 등록 여부만 "✅ 등록됨 / ❌ 미등록"으로 표시한다
   · [저장] 을 누르면 POST http://localhost:4000/api/settings 를 호출한다
       보내는 값 { "apiKey": "...", "model": "..." }

(2) /요약 명령 가로채기
   sendMessage() 맨 앞에 이 분기를 넣는다:

     function sendMessage() {
       const text = inputMessage.value.trim();
       if (!text) return;

       if (text.startsWith('/요약')) {
         requestSummary(text);
         inputMessage.value = '';
         return;
       }

       socket.value.emit('send_message', { message: text });
       inputMessage.value = '';
     }

(3) requestSummary() 함수 — 이 코드 그대로 넣어라

     async function requestSummary(command) {
       summaryLoading.value = true;
       summaryError.value = '';
       try {
         const res = await fetch(`${BACKEND_URL}/api/summary`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             room_id: currentRoomId.value,
             command: command
           })
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || '요약 실패');

         messages.value.push({
           type: 'summary',
           sender: '🤖 AI 요약',
           message: data.summary,
           rangeLabel: data.range_label,
           messageCount: data.message_count
         });
         scrollToBottom();
       } catch (err) {
         summaryError.value = err.message;
         messages.value.push({ sender: '⚠️ 시스템', message: err.message });
         scrollToBottom();
       } finally {
         summaryLoading.value = false;
       }
     }

   ⚠️ 명령어에서 시간을 뽑아내는 일은 프론트에서 하지 마라.
      "/요약 15:00-17:00" 문자열을 그대로 백엔드에 넘긴다.

(4) 요약 말풍선 스타일
   · type === 'summary' 인 메시지는 일반 채팅과 눈에 띄게 다르게 표시한다
     (연한 보라/파랑 배경, 폭을 넓게)
   · 말풍선 위에 🤖 AI 요약 · {rangeLabel} · 메시지 {messageCount}건 을 표시한다
   · 요약 중일 때는 "요약하는 중..." 로딩 표시를 띄운다
   · 입력창 아래에 작게 안내를 넣는다:  💡 /요약  → 전체 대화 요약

--- 주의 ---
· 지금 화면에 표시되는 #1, #2 같은 메시지 번호(msg.id)는 그대로 둬라. 지우지 마라.
· 백엔드에 /api/summary 가 아직 없어서 404 가 나는 것이 정상이다. 그걸 고치려 하지 마라.
```

## ② 💻 터미널에 붙여넣기 — 터미널 3개를 각각 엽니다

```bash
cd "v2_채팅앱(AI기능 O)/database" && npm install && npm run init-db && npm start
```

```bash
cd "v2_채팅앱(AI기능 O)/backend" && npm install && npm start
```

```bash
cd "v2_채팅앱(AI기능 O)/frontend" && npm install && npm run dev
```

## ③ 👀 확인 — Chrome 에서 `F12`

`http://localhost:8080` 접속 → 채팅방 입장 → 입력창에 **`/요약`** 치고 전송 → **F12** → **Network** 탭

```
┌─ Network 탭 ─────────────────────────────────────────┐
│                                                      │
│  Name          Status    Type                        │
│  ─────────────────────────────────────────           │
│  summary       404       fetch      ← ⭐ 이것        │
│                ^^^                                   │
│                                                      │
│  클릭 → Response 탭 → "Cannot POST /api/summary"     │
└──────────────────────────────────────────────────────┘
```

> **404 = "백엔드에 그런 주소가 없다"**
> 프론트엔드는 할 일을 다 했습니다. 받아 줄 상대가 아직 없을 뿐입니다.

## ✔ 1단계 통과 조건

- [ ] ⚙️ 버튼을 누르면 모달이 열린다
- [ ] API 키 입력칸이 `●●●●` 로 가려진다
- [ ] `/요약` 을 치면 **채팅 메시지로 전송되지 않는다**
- [ ] Network 탭에 `summary` 가 **404** 로 보인다
- [ ] 에러가 나도 **화면이 멈추지 않는다**

---
---

# 🥈 2단계 — 요약 기능 만들기 (backend)

> **끝나면**: 요약 로직이 생깁니다. **이번엔 500 에러가 납니다. 그게 정상입니다.**

## ① 📋 AI에게 붙여넣기

```
DEVELOPMENT_PLAN.md 의 [2단계] 만 구현해줘.
frontend/ 와 database/ 폴더는 절대 열지 마.
고칠 파일은 backend/server.js 하나뿐이야.
새 npm 패키지를 설치하지 마. fetch 는 Node에 내장돼 있으니 그대로 써.

--- 만들 것 3가지 ---

(1) 설정 API 2개

    app.get('/api/settings', ...)
      · DB Tier에서 'openrouter_api_key' 와 'openrouter_model' 을 읽어온다
        GET {DB_TIER_URL}/db/settings/openrouter_api_key
        GET {DB_TIER_URL}/db/settings/openrouter_model
      · 응답: { hasApiKey: true/false, model: "..." }
      · ⚠️ 키 원문은 절대 응답에 넣지 마라. 있는지 없는지만 알려준다.

    app.post('/api/settings', ...)
      · req.body 의 { apiKey, model } 을 받는다
      · DB Tier에 2건을 저장한다
        POST {DB_TIER_URL}/db/settings  { key: 'openrouter_api_key', value: apiKey }
        POST {DB_TIER_URL}/db/settings  { key: 'openrouter_model',   value: model }
      · 응답: { success: true }

(2) 요약 API

    app.post('/api/summary', async (req, res) => {
      const { room_id } = req.body;
      if (!room_id) return res.status(400).json({ error: 'room_id가 없습니다.' });

      try {
        // ① DB에서 API 키와 모델을 가져온다
        //    키가 없으면 → res.status(400).json({ error: 'API 키가 등록되지 않았습니다. ⚙️ 설정에서 등록하세요.' })

        // ② DB에서 이 방의 대화를 전부 가져온다
        //    GET {DB_TIER_URL}/db/chat_messages?room_id=...&limit=100
        //    0건이면 → res.status(400).json({ error: '요약할 대화가 없습니다.' })

        // ③ 대화를 문자열 하나로 합친다
        //    "홍길동: 오늘 회의는 3시입니다\n김철수: 네 알겠습니다"

        // ④ OpenRouter 를 호출한다  (아래 (3) 코드 그대로)

        // ⑤ 결과를 DB에 저장한다
        //    POST {DB_TIER_URL}/db/summaries
        //    { room_id, range_label: '전체', message_count, summary_text, model }

        // ⑥ 응답
        res.json({
          success: true,
          summary: summaryText,
          range_label: '전체',
          message_count: messages.length,
          model: model
        });
      } catch (err) {
        console.error(`❌ [요약 실패] ${err.message}`);
        res.status(500).json({ error: err.message });
      }
    });

    ⚠️ 이번 단계에서는 시간 범위를 다루지 않는다.
       "/요약 15:00-17:00" 이 들어와도 전체를 요약하면 된다. 시간은 4단계에서 붙인다.

(3) OpenRouter 호출 — 이 코드를 그대로 써라

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: '당신은 회의록 요약 전문가입니다. 주어진 대화를 한국어로 요약하세요. ' +
                     '핵심 논의 사항, 결정된 내용, 할 일을 구분해서 정리하세요. ' +
                     '5줄 이내로 간결하게 작성하세요.'
          },
          { role: 'user', content: `다음 대화를 요약해 주세요.\n\n${conversationText}` }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();

    // ⚠️⚠️ 매우 중요 ⚠️⚠️
    // 이 모델은 reasoning 모델이라 응답에 message.reasoning 과 message.content 가 따로 있다.
    // 반드시 message.content 를 읽어라. reasoning 을 읽으면 요약이 빈 문자열로 나온다.
    const summaryText = data.choices[0].message.content;

--- 에러 처리 (반드시 넣을 것) ---

    API 키 미등록  → 'API 키가 등록되지 않았습니다. ⚙️ 설정에서 등록하세요.'
    HTTP 401       → 'API 키가 올바르지 않습니다. 키를 다시 확인하세요.'
    HTTP 429       → '요청이 너무 많습니다. 30초 뒤에 다시 시도하세요.'
    메시지 0건     → '요약할 대화가 없습니다.'

--- 주의 ---
· DB에 settings 테이블이 아직 없어서 500 이 나는 것이 정상이다. 그걸 고치려 하지 마라.
```

## ② 💻 백엔드 터미널에서 `Ctrl+C` 후 다시

```bash
npm start
```

## ③ 👀 확인 — 이번엔 **Chrome이 아니라 터미널**

브라우저에서 다시 `/요약` 을 칩니다. 그리고 **백엔드 터미널**을 봅니다.

```
┌─ 백엔드 터미널 ──────────────────────────────────────┐
│                                                      │
│  🖥️  [Backend Tier Server] 실행 완료! (Port: 4000)   │
│  🏠 DB에서 대화방 1개를 불러왔습니다.                  │
│                                                      │
│  ❌ [요약 실패] Unexpected token '<' ...             │  ← ⭐ 이것
│     또는                                             │
│  ❌ [Backend -> DB 에러] 404                         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Chrome Network 탭에서는 **404가 아니라 500** 으로 바뀌어 있습니다.

| | 1단계 | 2단계 |
|---|---|---|
| 상태 코드 | **404** Not Found | **500** Internal Server Error |
| 뜻 | "그런 주소 없다" | "주소는 있는데 처리하다 터졌다" |
| 원인 | 백엔드에 API가 없음 | DB에 `settings` 테이블이 없음 |
| **어디를 봐야 하나** | Chrome Network | ⭐ **백엔드 터미널** |

> **500은 브라우저만 봐서는 원인을 모릅니다. 서버 로그를 봐야만 압니다.**
> 실무에서 가장 중요한 습관이 바로 이것입니다.

## ✔ 2단계 통과 조건

- [ ] Network 탭의 `summary` 가 **404 → 500** 으로 바뀌었다
- [ ] 백엔드 터미널에 `❌ [요약 실패]` 가 찍힌다
- [ ] ⚙️ 설정에서 [저장]을 눌러도 실패한다
- [ ] **왜 500이 나는지 말로 설명할 수 있다**

---
---

# 🥉 3단계 — 저장소 만들기 (database) → ✅ 첫 성공

> **끝나면**: `/요약` 이 **실제로 동작합니다.** (아직 시간 범위는 안 됩니다)

## ① 📋 AI에게 붙여넣기

```
DEVELOPMENT_PLAN.md 의 [3단계] 만 구현해줘.
frontend/ 와 backend/ 폴더는 절대 열지 마.
고칠 파일은 database/init_db.js 와 database/db_server.js 두 개뿐이야.

⚠️ sqlite3 나 better-sqlite3 를 설치하지 마.
   이 프로젝트는 Node 내장 모듈 node:sqlite 를 쓴다.
   db_server.js 맨 위에 이미 그렇게 돼 있으니 그 방식을 그대로 따라 해.

--- (1) init_db.js : 테이블 2개 추가 ---

기존 4개 테이블(users, reports, chat_rooms, chat_messages)은 그대로 두고
db.exec(`...`) 안에 아래 2개만 추가한다.

  CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE summaries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id       TEXT    NOT NULL,
    range_label   TEXT    NOT NULL,
    message_count INTEGER NOT NULL,
    summary_text  TEXT    NOT NULL,
    model         TEXT    NOT NULL,
    created_at    TEXT    NOT NULL
  );

마지막 console.log 에 "테이블 6개 생성"으로 문구도 고쳐라.

--- (2) db_server.js : API 4개 추가 ---

  GET  /db/settings/:key
       → { key, value }, 없으면 404 { error: '없는 설정입니다.' }

  POST /db/settings   { key, value }
       → 있으면 수정, 없으면 삽입 (UPSERT)
       INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
       → { success: true }

  POST /db/summaries  { room_id, range_label, message_count, summary_text, model }
       → INSERT 후 { success: true, id }
       created_at 은 이미 파일 안에 있는 nowString() 함수를 써라

  GET  /db/summaries?room_id=lobby
       → ORDER BY id DESC 로 최근 요약 목록

--- 주의 ---
· chat_messages 테이블은 이번 단계에서 절대 건드리지 마라. 시간 컬럼은 4단계에서 붙인다.
· 기존 API(users, reports, chat_rooms, chat_messages)를 수정하지 마라.
```

## ② 💻 DB 터미널에서 `Ctrl+C` 후

```bash
npm run init-db
npm start
```

> ⚠️ `npm run init-db` 는 **기존 채팅 기록을 전부 지웁니다.** 새 테이블을 만들기 위해 필요합니다.

## ③ 👀 확인 A — 브라우저 주소창에 그냥 치기

```
http://localhost:5000/db/chat_messages?room_id=lobby
```

```json
{
  "order_by": "id",          ← ⭐ 아직 "id" 입니다 (4단계에서 바뀝니다)
  "count": 0,
  "messages": []
}
```

## ④ 👀 확인 B — 진짜로 요약해 보기

```
1. http://localhost:8080  접속 → 채팅방 입장
2. ⚙️ 설정 → API 키 등록 → [저장]
      키 발급: https://openrouter.ai/keys
      모델:   nvidia/nemotron-3-ultra-550b-a55b:free   (무료)
3. 채팅을 6줄 정도 칩니다  ← 아래 예시를 그대로 쳐도 됩니다
4. /요약  입력 → 🤖 요약이 나오면 성공!
```

**채팅 예시 (그대로 쳐도 됩니다)**

```
오늘 회의 안건 공유드립니다
확인했습니다
예산안은 다음 주에 다시 논의합시다
네 그렇게 하시죠
회의실은 3층으로 잡았습니다
알겠습니다 감사합니다
```

## ⑤ 👀 확인 C — SQLite Viewer

`database/database.sqlite` 우클릭 → `Open with SQLite Viewer`

```
▾ users            2행
▾ reports          1행
▾ chat_rooms       1행
▾ chat_messages    6행   ← 방금 친 채팅
▾ settings         2행   ← ⭐ API 키와 모델이 저장됨
▾ summaries        1행   ← ⭐ 방금 만든 요약이 저장됨
```

`chat_messages` 를 열어 보십시오.

```
 id │ room_id │ sender │ message
────┼─────────┼────────┼──────────────────────────────
  1 │ lobby   │ 홍길동 │ 오늘 회의 안건 공유드립니다
  2 │ lobby   │ 김철수 │ 확인했습니다
  3 │ lobby   │ 홍길동 │ 예산안은 다음 주에 다시 논의합시다
  4 │ lobby   │ 김철수 │ 네 그렇게 하시죠
  5 │ lobby   │ 홍길동 │ 회의실은 3층으로 잡았습니다
  6 │ lobby   │ 김철수 │ 알겠습니다 감사합니다
```

> ### 🔑 여기서 잠깐 — 뭔가 없습니다
> **시간 컬럼이 없습니다.**
> 이 표에는 "몇 번째로 저장됐는가(id)"만 있고, **"몇 시에 말했는가"는 어디에도 없습니다.**
>
> 그래서 지금 `/요약 15:00-17:00` 을 쳐도 **전체가 요약됩니다.**
> 걸러낼 근거가 DB에 아예 없기 때문입니다.
>
> **→ 이것을 해결하는 것이 4단계입니다.**

## ✔ 3단계 통과 조건

- [ ] `/요약` 이 실제로 동작해서 AI 요약이 화면에 나온다
- [ ] `settings` 테이블에 2행이 있다
- [ ] `summaries` 테이블에 요약이 저장돼 있다
- [ ] `chat_messages` 에 **시간 컬럼이 없다**는 것을 눈으로 확인했다

---
---

# 🏅 4단계 — ⭐ 시간(timestamp) 붙이기 → 시간별 요약

> **여기가 이 실습의 핵심입니다.**
> "시간대별로 요약하고 싶다" → **그러려면 DB에 시각이 있어야 한다** → **스키마를 바꾼다.**
> 기능이 스키마를 요구하는 과정을 직접 겪는 단계입니다.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [지금]   chat_messages(id, room_id, sender, message)        │
│            → "몇 번째로 저장됐는가"만 안다                    │
│                          ↓                                   │
│  [4단계]  timestamp 컬럼을 추가한다                           │
│            → "몇 시에 말했는가"를 알게 된다                   │
│                          ↓                                   │
│  [결과]   WHERE timestamp >= '15:00' AND timestamp <= '17:00'│
│            → 시간 범위로 골라낼 수 있게 된다                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

> 4단계는 3계층을 모두 건드립니다. 그래서 **4-1 → 4-2 → 4-3 세 번에 나눠서** 시킵니다.
> **반드시 순서대로**, 한 번에 하나씩 붙여넣으십시오.

---

## 4-1. 📋 AI에게 붙여넣기 — DB에 시간 컬럼 만들기

```
DEVELOPMENT_PLAN.md 의 [4-1단계] 만 구현해줘.
frontend/ 와 backend/ 폴더는 절대 열지 마.
고칠 파일은 database/init_db.js 와 database/db_server.js 두 개뿐이야.

--- (1) init_db.js : chat_messages 에 timestamp 컬럼 추가 ---

지금:
  CREATE TABLE chat_messages (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    sender  TEXT NOT NULL,
    message TEXT NOT NULL
  );
  CREATE INDEX idx_chat_messages_room ON chat_messages (room_id, id);

이렇게 바꾼다:
  CREATE TABLE chat_messages (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id   TEXT NOT NULL,
    sender    TEXT NOT NULL,
    message   TEXT NOT NULL,
    timestamp TEXT NOT NULL          -- 'YYYY-MM-DD HH:MM:SS' 형식 문자열
  );
  CREATE INDEX idx_chat_messages_room ON chat_messages (room_id, timestamp);

--- (2) db_server.js : 저장할 때 시각을 기록한다 ---

POST /db/chat_messages 를 이렇게 바꾼다.
nowString() 함수는 이미 파일 안에 있으니 그걸 그대로 쓴다.

  const timestamp = nowString();
  const result = db.prepare(
    'INSERT INTO chat_messages (room_id, sender, message, timestamp) VALUES (?, ?, ?, ?)'
  ).run(room_id, sender, message, timestamp);

  res.json({ success: true, id: Number(result.lastInsertRowid), timestamp });

--- (3) db_server.js : 시간 범위로 골라내기 ⭐ 핵심 ---

GET /db/chat_messages 를 아래 코드로 통째로 교체한다.

  app.get('/db/chat_messages', (req, res) => {
    const { room_id, from, to } = req.query;
    const limit = Number(req.query.limit) || 100;

    if (!room_id) return res.status(400).json({ error: 'room_id 쿼리 파라미터가 필요합니다.' });

    let sql = 'SELECT id, room_id, sender, message, timestamp FROM chat_messages WHERE room_id = ?';
    const params = [room_id];

    // timestamp 는 'YYYY-MM-DD HH:MM:SS' 문자열이라 문자열 비교만으로 시간 범위를 거를 수 있다
    if (from) { sql += ' AND timestamp >= ?'; params.push(from); }
    if (to)   { sql += ' AND timestamp <= ?'; params.push(to);   }

    sql += ' ORDER BY timestamp ASC LIMIT ?';   // ⭐ id 가 아니라 timestamp 기준
    params.push(limit);

    const rows = db.prepare(sql).all(...params);

    res.json({
      order_by: 'timestamp',                        // v1 에서는 'id' 였다
      range: { from: from || null, to: to || null },
      count: rows.length,
      messages: rows
    });
  });

--- 주의 ---
· settings, summaries, users, reports, chat_rooms 는 건드리지 마라.
· summaries 테이블에 range_from, range_to 컬럼을 추가해라 (둘 다 TEXT, NULL 허용).
```

### 💻 DB 터미널에서 `Ctrl+C` 후

```bash
npm run init-db
npm start
```

### 👀 확인 — 주소창에 그냥 치기

```
http://localhost:5000/db/chat_messages?room_id=lobby
```

```json
{
  "order_by": "timestamp",     ← ⭐ "id" 에서 바뀌었습니다!
  "range": { "from": null, "to": null },
  "count": 0,
  "messages": []
}
```

---

## 4-2. 📋 AI에게 붙여넣기 — 백엔드가 시간을 해석하게 하기

```
DEVELOPMENT_PLAN.md 의 [4-2단계] 만 구현해줘.
frontend/ 와 database/ 폴더는 절대 열지 마.
고칠 파일은 backend/server.js 하나뿐이야.

--- (1) 시간 범위 파싱 함수 추가 — 이 코드 그대로 넣어라 ---

/**
 * "/요약 15:00-17:00" 같은 명령어에서 시간 범위를 뽑아낸다.
 * 반환: { from, to, label }   범위가 없으면 from/to 는 null
 */
function parseSummaryCommand(command) {
  const today = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const dateStr = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;

  // 패턴 1: "15:00-17:00" 또는 "15:00 ~ 17:00"
  const m1 = command.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);
  if (m1) {
    const from = `${dateStr} ${p(m1[1])}:${m1[2]}:00`;
    const to   = `${dateStr} ${p(m1[3])}:${m1[4]}:59`;
    return { from, to, label: `${p(m1[1])}:${m1[2]} ~ ${p(m1[3])}:${m1[4]}` };
  }

  // 패턴 2: "오후 3시부터 5시까지"
  const m2 = command.match(/(오전|오후)?\s*(\d{1,2})시\s*(?:부터)?\s*(\d{1,2})시\s*(?:까지)?/);
  if (m2) {
    const add = m2[1] === '오후' ? 12 : 0;
    let h1 = Number(m2[2]) + add;
    let h2 = Number(m2[3]) + add;
    if (h1 > 23) h1 -= 12;
    if (h2 > 23) h2 -= 12;
    const from = `${dateStr} ${p(h1)}:00:00`;
    const to   = `${dateStr} ${p(h2)}:59:59`;
    return { from, to, label: `${p(h1)}:00 ~ ${p(h2)}:59` };
  }

  // 패턴 3: 그냥 "/요약" → 전체
  return { from: null, to: null, label: '전체' };
}

--- (2) POST /api/summary 를 고친다 ---

· 맨 앞에서 명령어를 파싱한다
    const { from, to, label } = parseSummaryCommand(command || '/요약');

· DB에서 메시지를 가져올 때 from/to 를 쿼리에 붙인다
    GET {DB_TIER_URL}/db/chat_messages?room_id=...&limit=100&from=...&to=...
    ⚠️ from/to 가 null 이면 그 파라미터는 아예 빼고 호출한다
    ⚠️ 값에 공백이 있으므로 반드시 encodeURIComponent() 로 감싼다

· 대화를 문자열로 합칠 때 시각을 앞에 붙인다
    "[15:10] 홍길동: 오늘 회의는 3시입니다"
    (timestamp 의 11~16 번째 글자가 'HH:MM' 이다)

· 0건일 때 에러 문구를 이렇게 바꾼다
    `${label} 구간에 요약할 대화가 없습니다.`

· DB에 저장할 때 range_from, range_to 도 함께 보낸다
    POST {DB_TIER_URL}/db/summaries
    { room_id, range_from: from, range_to: to, range_label: label,
      message_count, summary_text, model }

· 응답의 range_label 을 '전체' 고정이 아니라 label 로 바꾼다
    res.json({ success: true, summary: summaryText,
               range_label: label, message_count: messages.length, model });

--- (3) Socket.io 부분도 고친다 (같은 파일 backend/server.js) ---

지금은 채팅을 프론트로 보낼 때 시각을 안 넘긴다. timestamp 도 함께 넘기도록 고친다.

· saveMessageToDb() 가 DB 응답의 timestamp 를 돌려주도록 고친다
    return data.timestamp;

· chat_history 를 보낼 때 timestamp 를 포함한다
    socket.emit('chat_history', history.map(m => ({
      id: m.id, sender: m.sender, message: m.message, timestamp: m.timestamp
    })));

· new_message 를 보낼 때도 timestamp 를 포함한다
    const timestamp = await saveMessageToDb(user.currentRoom, user.username, message);
    io.to(user.currentRoom).emit('new_message', {
      sender: user.username, message, timestamp
    });
```

### 💻 백엔드 터미널에서 `Ctrl+C` 후

```bash
npm start
```

---

## 4-3. 📋 AI에게 붙여넣기 — 화면에 시각 표시하기

```
DEVELOPMENT_PLAN.md 의 [4-3단계] 만 구현해줘.
backend/ 와 database/ 폴더는 절대 열지 마.
고칠 파일은 frontend/src/views/ChatView.vue 하나뿐이야.

(1) 메시지 오른쪽에 표시하던 #1, #2 (msg.id) 를 시각으로 바꾼다.
    · 서버가 보내주는 msg.timestamp 는 '2026-08-07 15:10:00' 형식이다
    · 화면에는 'HH:MM' 만 보여준다 → msg.timestamp.slice(11, 16)
    · ⚠️ msg.timestamp 가 없는 메시지(시스템 안내, 🤖 요약 말풍선)도 있다.
      없으면 아무것도 표시하지 않는다. 절대 에러가 나면 안 된다.
      예: msg.timestamp ? msg.timestamp.slice(11, 16) : ''

(2) 입력창 아래 안내 문구를 아래 3줄로 바꾼다.

    💡 /요약                        → 전체 대화 요약
    💡 /요약 15:00-17:00            → 그 시간대만 요약
    💡 /요약 오후 3시부터 5시까지    → 위와 동일

(3) 요약 말풍선 상단의 rangeLabel 이 '전체' 대신 '15:00 ~ 17:00' 으로도
    표시되는지 확인한다. (이미 되어 있으면 그대로 둔다)
```

---

## ✅ 4단계 확인

### 💻 채팅을 다시 6줄 칩니다 (DB를 초기화했으므로 비어 있습니다)

```
오늘 회의 안건 공유드립니다
확인했습니다
예산안은 다음 주에 다시 논의합시다
네 그렇게 하시죠
회의실은 3층으로 잡았습니다
알겠습니다 감사합니다
```

### 👀 SQLite Viewer 로 `chat_messages` 를 다시 엽니다

```
 id │ sender │ message                    │ timestamp            ← ⭐ 새 컬럼!
────┼────────┼────────────────────────────┼──────────────────────
  1 │ 홍길동 │ 오늘 회의 안건 공유드립니다 │ 2026-08-07 13:49:02
  2 │ 김철수 │ 확인했습니다               │ 2026-08-07 13:49:02
  ...
```

### ✔ 4단계 통과 조건

- [ ] `chat_messages` 에 **`timestamp` 컬럼이 생겼다**
- [ ] 채팅 화면에 **시각(`15:10`)이 표시된다**
- [ ] `http://localhost:5000/db/chat_messages?room_id=lobby` 의 `order_by` 가 **`timestamp`** 다
- [ ] `/요약` 이 여전히 잘 동작한다

> ### ❓ 그런데 `/요약 15:00-17:00` 을 쳐 보면?
> **결과가 `/요약` 과 똑같습니다.**
> 방금 친 채팅이 **전부 같은 시각(지금)** 으로 저장됐기 때문입니다.
> 걸러도 걸러지는 게 없습니다.
>
> **→ 그래서 5단계가 필요합니다.**

---
---

# 🏆 5단계 — 시간을 손으로 고쳐서 검증하기 (코드 수정 없음)

> **AI에게 시킬 것이 없습니다. 여러분이 직접 손으로 합니다.**

## ① SQLite Viewer 에서 `chat_messages` 를 엽니다

## ② `timestamp` 셀을 더블클릭해서 아래처럼 바꿔 씁니다

**날짜 부분은 반드시 오늘 날짜로 맞추십시오.**

```
 id │ timestamp              │ 의도
────┼────────────────────────┼──────────────────
  1 │ 2026-08-07 09:05:00    │  오전
  2 │ 2026-08-07 09:12:00    │  오전
  3 │ 2026-08-07 15:10:00    │  ⭐ 15~17시 구간
  4 │ 2026-08-07 15:30:00    │  ⭐ 15~17시 구간
  5 │ 2026-08-07 16:40:00    │  ⭐ 15~17시 구간
  6 │ 2026-08-07 18:20:00    │  저녁
```

> ⚠️ 형식을 반드시 지키십시오: **`YYYY-MM-DD HH:MM:SS`**
> `2026-8-7 9:5:0` 처럼 자릿수를 줄이면 문자열 비교가 깨져서 안 걸러집니다.

**저장(💾)** 을 누릅니다.

## ③ 👀 주소창으로 먼저 확인합니다

```
http://localhost:5000/db/chat_messages?room_id=lobby
```

> 👀 **id 순서와 화면에 나오는 순서가 달라질 수 있습니다.**
> `ORDER BY timestamp` 이므로 **id=1이 맨 위가 아닐 수도 있습니다.**

```
http://localhost:5000/db/chat_messages?room_id=lobby&from=2026-08-07 15:00:00&to=2026-08-07 17:00:00
```

> 👀 **`count` 가 6 → 3 으로 줄어듭니다.** (id 3, 4, 5번만 남습니다)

## ④ 👀 실제로 요약해 봅니다

채팅창에 이 4개를 차례로 쳐 보십시오.

```
/요약               →  메시지 6건  (전체)
/요약 09:00-10:00   →  메시지 2건  (오전만)
/요약 15:00-17:00   →  메시지 3건  (오후만)
/요약 18:00-19:00   →  메시지 1건  (저녁만)
```

```
┌────────────────────────────────────────────────┐
│ 🤖 AI 요약  (15:00 ~ 17:00 · 메시지 3건)        │  ← ⭐ 6건이 아니라 3건!
│                                                │
│ 예산안 논의는 다음 주로 연기하기로 하였으며,     │
│ 회의 장소는 3층 회의실로 확정되었습니다.        │
└────────────────────────────────────────────────┘
```

## 🎓 여기서 배우는 것

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  1. DB는 마법 상자가 아니라 "내가 고칠 수 있는 표"다.          │
│                                                              │
│  2. id(저장 순서)와 timestamp(실제 시각)는 다른 정보다.        │
│     평소엔 같아 보이지만 근본적으로 다르다.                    │
│                                                              │
│  3. 기능이 스키마를 결정한다.                                 │
│     "시간별로 보고 싶다" → 그래서 timestamp 컬럼이 생겼다.     │
│     기능을 먼저 생각하고, 표를 나중에 고치는 게 실무 순서다.   │
│                                                              │
│  4. 데이터를 조작할 수 있어야 기능을 테스트할 수 있다.          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---
---

# 📋 최종 체크리스트

## 기능

- [ ] ⚙️ 설정 모달에서 API 키를 등록할 수 있다
- [ ] API 키가 `●●●●` 로 가려진다
- [ ] `GET /api/settings` 응답에 **키 원문이 없다** (보안)
- [ ] `/요약` → 전체 요약
- [ ] `/요약 15:00-17:00` → 그 시간대만 요약
- [ ] `/요약 오후 3시부터 5시까지` → 동일하게 동작
- [ ] 요약 말풍선이 일반 채팅과 다르게 보인다
- [ ] 요약 중 로딩 표시가 나온다

## 에러 처리

- [ ] 키 미등록 시 안내가 나온다
- [ ] 잘못된 키(401)일 때 안내가 나온다
- [ ] 429(속도 제한)일 때 안내가 나온다
- [ ] 해당 시간대 0건일 때 안내가 나온다
- [ ] **어떤 에러가 나도 앱이 멈추지 않는다**

## 3계층 확인

- [ ] `http://localhost:5000/db/chat_messages?room_id=lobby` 가 브라우저에서 열린다
- [ ] `http://localhost:4000/api/chat/messages?room_id=lobby` 가 브라우저에서 열린다
- [ ] 두 응답의 `order_by` 가 **`timestamp`** 다
- [ ] SQLite Viewer 에 `settings`, `summaries` 테이블이 보인다
- [ ] `chat_messages` 에 `timestamp` 컬럼이 있다

## 금지사항 위반 없음

- [ ] `sqlite3` / `better-sqlite3` 가 설치되지 않았다 (`package.json` 확인)
- [ ] API 키가 코드에 직접 적혀 있지 않다
- [ ] 기존 기능(로그인·채팅·보고서)이 여전히 동작한다

---

# 🚑 안 될 때

| 증상 | 원인 | 📋 AI에게 붙여넣을 말 / 해결 |
|---|---|---|
| `Cannot find module 'sqlite3'` | AI가 금지 패키지를 씀 | `sqlite3 를 지우고 Node 내장 모듈 node:sqlite 로 다시 짜줘. db_server.js 맨 위 방식을 그대로 따라 해.` |
| `no such table: settings` | `init_db.js` 만 고치고 실행 안 함 | DB 터미널에서 `npm run init-db` 재실행 |
| `no such column: timestamp` | 4-1 후 `init-db` 를 안 함 | DB 터미널에서 `npm run init-db` 재실행 |
| `table settings already exists` | 있는 테이블을 또 만듦 | `npm run init-db` 로 처음부터 다시 |
| 요약이 **빈 문자열** | `message.reasoning` 을 읽음 | `data.choices[0].message.content 를 읽도록 고쳐줘.` |
| `401 Unauthorized` | 키가 틀렸거나 잘림 | OpenRouter 에서 키 재발급 → ⚙️ 재등록 |
| `429 Too Many Requests` | 무료 모델 속도 제한 | 30초~1분 기다렸다 재시도. 여러 명이 동시에 누르지 말 것 |
| 시간 범위를 걸어도 결과가 같다 | 메시지 시각이 전부 동일 | **5단계**대로 `timestamp` 를 손으로 흩뿌릴 것 |
| `count` 가 항상 0 | 날짜가 오늘이 아님 | `timestamp` 의 날짜 부분을 **오늘 날짜**로 맞출 것 |
| 포트가 이미 사용 중 | 이전 서버가 살아 있음 | 해당 터미널에서 `Ctrl+C` 후 재실행 |
| 채팅은 되는데 DB에 안 쌓임 | DB Tier 가 꺼져 있음 | 5000번 서버부터 켤 것 |
| AI가 여러 폴더를 한꺼번에 고침 | 지시가 뭉뚱그려짐 | `방금 수정한 것 전부 되돌려줘. 그리고 OO 폴더의 파일 하나만 다시 고쳐줘.` |

---

## 📚 관련 문서

| 문서 | 내용 |
|---|---|
| [AGENTS.md](./AGENTS.md) | AI가 항상 지켜야 할 규칙 (Rules 에 등록) |
| [../MANUAL_VIBE_CODING.md](../MANUAL_VIBE_CODING.md) | 3-Tier 전체 구조와 1차 실습 절차 |
| [../../docs/교육자료 배포/1-1. 교육준비물.md](../../docs/교육자료%20배포/1-1.%20교육준비물.md) | OpenRouter 가입 및 API 키 발급 |
| [../../docs/교육자료 배포/3-0. CONTEXT_관리.md](../../docs/교육자료%20배포/3-0.%20CONTEXT_관리.md) | 모델 스펙 읽는 법 (Part 2) |
| [../../docs/교육자료 배포/참고3_AGENTS_템플릿.md](../../docs/교육자료%20배포/참고3_AGENTS_템플릿.md) | AI에게 줄 규칙 파일 양식 |
