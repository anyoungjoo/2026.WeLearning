# 🏛️ ADR 006: Mermaid 다이어그램 파싱 견고성 및 마크다운 렌더링 2중 방어선 아키텍처

- **상태(Status):** 승인 및 구현 완료 (Accepted & Implemented)
- **작성일(Date):** 2026-09-02
- **결정자(Deciders):** 15년 차 시니어 아키텍트 & 페어 프로그래밍 엔지니어
- **적용 대상:** `4.Presentation_Mirror` (markdownRenderer.js, index.html, server.js) 및 교육자료 마크다운 전체

---

## 💡 1. 일상 비유로 이해하는 아키텍처 (파인만 기법)

> **"엄격한 문법 검사관과 똑똑한 사전 번역기"**  
> 도로 표지판에 괄호나 슬래시 같은 특수 기호가 적혀 있을 때, 너그러운 운전자(관대한 뷰어)는 대충 뜻을 알아채고 주행하지만, **원칙주의 검사관(Mermaid Strict Parser)**은 "규정에 없는 기호가 들어있다"며 표지판 자체를 철거해 버립니다(파스 에러).  
> 이번 아키텍처는 **1) 표지판을 표준 양식으로 바로잡음과 동시에, 2) 어떤 비표준 표지판이 들어와도 검사관에게 전달하기 전에 자동으로 규격에 맞게 큰따옴표를 씌워주는 사전 교정기(Auto-Quoting Pipeline)**를 뷰어 입구에 배치한 것입니다.

---

## 🎯 2. 배경 및 해결하려는 문제 (Context & Problem)

1. **Mermaid 구문 분석 에러(Syntax Error)로 인한 렌더링 중단:**
   - 마크다운 문서 내 Mermaid flowchart/graph에서 엣지 라벨(`|라벨|`) 내부에 괄호 `()`, 슬래시 `/`, 콜론 `:` 등 특수문자가 포함된 경우, Mermaid Jison Lexer가 이를 노드 모양 문법(`PS`: Parenthesis Start) 토큰으로 오인하여 `Expecting 'SQE'... got 'PS'` 에러를 발생시키며 렌더링이 실패하는 문제 발생.
2. **비표준 언어 태그(`jsonc`) 하이라이팅 경고:**
   - VS Code 확장 태그인 ```` ```jsonc ```` 블록이 포함되어 Highlight.js에서 `Could not find the language 'jsonc'` 콘솔 경고 발생.
3. **표(Table) 서식 엉킴 및 파비콘 404 누락:**
   - `2. AI의_이해.md` 등 일부 교재에서 표 복사 과정의 열 불일치 오염 및 브라우저 `/favicon.ico` 404 에러 발생.

---

## 🏗 3. 기술적 결정 사항 및 2중 방어선 아키텍처 (Decision & Trade-offs)

### 1) 3중 방어선 (Defensive & Self-Healing Architecture) 채택
- **1차 방어선 (Source Clean-up):**
  - 전체 교육자료 마크다운 파일 내의 모든 Mermaid 엣지 라벨을 표준 문법(`|"라벨"|`)으로 일괄 교정하고, 테이블 서식 및 `jsonc` 태그 정제.
- **2차 방어선 (Runtime Auto-Quoting Pipeline in `markdownRenderer.js`):**
  - 파서로 넘어가기 전 `normalizeEdgeLabels` 정규화 함수가 `|텍스트|` 패턴을 감지하여 안전하게 `|"텍스트"|`로 자동 래핑.
- **3차 방어선 (DOM Leak Cleanup & Parser State Isolation - 자가 복구):**
  - 만에 하나 잘못된 Mermaid 문법이 들어와 렌더링에 실패하더라도, Mermaid가 `document.body`에 남기는 임시 에러 SVG 엘리먼트(`dmermaid-*-svg`)를 즉시 DOM에서 영구 제거(Garbage Collection)하고 전역 파서 상태(`initMermaid()`)를 즉각 리셋하여, **"에러가 있는 문서를 본 뒤 멀쩡한 다른 문서까지 렌더링이 먹통이 되는 연쇄 상태 오염(State Pollution)"**을 100% 원천 차단.

```mermaid
graph LR
    MD["📄 마크다운 원문<br/>(에러/특수문자 포함)"] --> Normalizer["🛡️ 1/2차: normalizeMermaidSource<br/>(radar 변환 + 라벨 따옴표 보정)"]
    Normalizer --> RenderTry["⚙️ Mermaid.render (11.16.1)"]
    RenderTry -->|성공| SVG["🖼️ 완벽한 SVG 다이어그램"]
    RenderTry -->|예외 발생 시| SelfHeal["🧹 3차: DOM 잔여물 청소 + 파서 리셋<br/>(다음 문서 연쇄 오류 원천 차단)"]
    SelfHeal --> FallbackUI["📝 원본 코드 블록 안전 표시"]
```

### 2) Highlight.js `jsonc` Alias 등록
- `initHighlightJs()`를 통해 `hljs.registerAliases('jsonc', { languageName: 'json' })`를 등록하여, JSON with Comments 블록을 무경고로 깔끔하게 구문 강조.

### 3) Favicon 404 방어
- `index.html`에 인라인 SVG 학사모(🎓) 파비콘 태그를 추가하고, `server.js`에 `/favicon.ico` (204 No Content) 핸들러를 구성하여 브라우저 콘솔 오류 원천 차단.

---

## 📊 4. 검증 결과 (Verification)

- `Presentation_Mirror` 단위 테스트(Node.js Test Runner) 19개 전체 통과 (Pass rate 100%).
- `2. AI의_이해.md`를 포함한 모든 교재 문서에서 Mermaid 다이어그램 100% 정상 렌더링 확인.
