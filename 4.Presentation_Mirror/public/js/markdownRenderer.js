/**
 * 📝 Markdown Renderer Module
 * 
 * [주요 기능]
 * 1. Marked.js 기반 GFM(GitHub Flavored Markdown) 변환
 * 2. 마크다운 내 상대경로 이미지 -> `/api/materials/raw/...` URL 자동 치환
 * 3. Highlight.js를 통한 소스코드 문법 강조 및 원클릭 복사 버튼
 * 4. Mermaid.js 다이어그램 렌더링 지원
 * 5. 목차(TOC)용 헤딩 앵커 자동 생성
 */

const MERMAID_VIEWBOX_PADDING = 12;
const MERMAID_SOURCE_MAX_LENGTH = 20000;
const MERMAID_PARSE_TIMEOUT_MS = 1200;
const MERMAID_RENDER_TIMEOUT_MS = 3000;

function createAbortError() {
  const error = new Error('문서 렌더링이 취소되었습니다.');
  error.name = 'AbortError';
  return error;
}

function escapeMermaidLabel(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function extractLegacyRadarLegend(contextText, seriesCount) {
  const legendBody = String(contextText || '').match(/범례\s*:\s*([^)]*)/i)?.[1] || '';
  const names = legendBody
    .split(/[,，]/)
    .map(part => part.includes('=') ? part.slice(part.indexOf('=') + 1).trim() : '')
    .filter(Boolean);

  return Array.from(
    { length: seriesCount },
    (_, index) => names[index] || `계열 ${index + 1}`
  );
}

/**
 * 다이어그램 엣지 라벨 중 따옴표가 누락된 텍스트를 안전하게 큰따옴표로 감싸 구문 파싱 오류를 방지합니다.
 * 예: `-->|매번 API 호출 (유료/보안리스크)|` -> `-->|"매번 API 호출 (유료/보안리스크)"|`
 */
export function normalizeEdgeLabels(source) {
  const lines = String(source || '').split(/\r?\n/);
  const processed = lines.map((line) => {
    // 노드 본문의 파이프 문자는 건드리지 않고, 실제 엣지 연산자 바로 뒤의 |label|만 매칭합니다.
    return line.replace(/((?:-->|---|-\.->|==>|--x|--o)\s*)\|([^|\r\n]+)\|/g, (match, edge, label) => {
      const trimmed = label.trim();
      // 이미 큰따옴표로 둘러싸여 있는 경우 건너뜀
      if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
        return match;
      }
      // 큰따옴표로 안전하게 감싸고 내부 이스케이프
      const escaped = trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `${edge}|"${escaped}"|`;
    });
  });
  return processed.join('\n');
}

/**
 * 1. 비표준 radar 문법을 Mermaid 11의 radar-beta 문법으로 변환합니다.
 * 2. flowchart/graph 등의 엣지 라벨에 특수문자/괄호가 있을 때 파싱 오류를 방지하기 위해 큰따옴표로 자동 정규화합니다.
 */
export function normalizeMermaidSource(source, contextText = '') {
  const originalSource = String(source || '').trim();
  if (originalSource.length > MERMAID_SOURCE_MAX_LENGTH) {
    throw new Error(`Mermaid 소스가 허용 크기(${MERMAID_SOURCE_MAX_LENGTH}자)를 초과했습니다.`);
  }
  const lines = originalSource.trim().split(/\r?\n/);
  
  // radar 문법 변환
  if (lines[0]?.trim().toLowerCase() === 'radar') {
    let title = '';
    const metrics = [];

    for (const line of lines.slice(1)) {
      const titleMatch = line.match(/^\s*title\s+(.+?)\s*$/i);
      if (titleMatch) {
        title = titleMatch[1];
        continue;
      }

      const metricMatch = line.match(/^\s*"([^"]+)"\s*:\s*\[([^\]]+)\]\s*$/);
      if (!metricMatch) continue;

      const values = metricMatch[2].split(',').map(value => Number(value.trim()));
      if (values.length === 0 || !values.every(Number.isFinite)) return originalSource;
      metrics.push({ label: metricMatch[1], values });
    }

    const seriesCount = metrics[0]?.values.length || 0;
    if (metrics.length < 3
      || seriesCount === 0
      || metrics.some(metric => metric.values.length !== seriesCount)) {
      return originalSource;
    }

    const seriesNames = extractLegacyRadarLegend(contextText, seriesCount);
    const highestValue = metrics.reduce(
      (currentMax, metric) => metric.values.reduce((max, value) => Math.max(max, value), currentMax),
      0
    );
    const scaleMax = highestValue <= 10 ? 10 : Math.ceil(highestValue);
    const output = ['radar-beta'];

    if (title) output.push(`  title ${title}`);
    metrics.forEach((metric, index) => {
      output.push(`  axis metric${index + 1}["${escapeMermaidLabel(metric.label)}"]`);
    });
    seriesNames.forEach((seriesName, seriesIndex) => {
      const values = metrics.map(metric => metric.values[seriesIndex]).join(', ');
      output.push(`  curve series${seriesIndex + 1}["${escapeMermaidLabel(seriesName)}"]{${values}}`);
    });
    output.push('  min 0', `  max ${scaleMax}`, '  showLegend true');

    return output.join('\n');
  }

  // 일반 다이어그램: 엣지 라벨 자동 따옴표 보정
  return normalizeEdgeLabels(originalSource);
}

export function expandMermaidViewBox(svgElement, padding = MERMAID_VIEWBOX_PADDING) {
  if (!svgElement || typeof svgElement.getBBox !== 'function') return null;

  const viewBox = String(svgElement.getAttribute('viewBox') || '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0) {
    return null;
  }

  try {
    const bounds = svgElement.getBBox();
    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)
      || bounds.width <= 0
      || bounds.height <= 0) {
      return viewBox;
    }

    const [viewX, viewY, viewWidth, viewHeight] = viewBox;
    const safePadding = Number.isFinite(padding) ? Math.max(0, padding) : MERMAID_VIEWBOX_PADDING;
    const minX = Math.min(viewX, bounds.x - safePadding);
    const minY = Math.min(viewY, bounds.y - safePadding);
    const maxX = Math.max(viewX + viewWidth, bounds.x + bounds.width + safePadding);
    const maxY = Math.max(viewY + viewHeight, bounds.y + bounds.height + safePadding);
    const expandedViewBox = [minX, minY, maxX - minX, maxY - minY];

    svgElement.setAttribute('viewBox', expandedViewBox.join(' '));
    return expandedViewBox;
  } catch (error) {
    console.warn('Mermaid bounds measurement error:', error);
    return viewBox;
  }
}

export function fitMermaidSvg(svgElement) {
  if (!svgElement) return;

  const viewBox = expandMermaidViewBox(svgElement)
    || String(svgElement.getAttribute('viewBox') || '')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
  const naturalWidth = viewBox.length === 4 && Number.isFinite(viewBox[2]) && viewBox[2] > 0
    ? Math.ceil(viewBox[2])
    : null;

  svgElement.removeAttribute('width');
  svgElement.removeAttribute('height');
  svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svgElement.style.width = naturalWidth ? `min(100%, ${naturalWidth}px)` : '100%';
  svgElement.style.maxWidth = '100%';
  svgElement.style.height = 'auto';
  svgElement.style.overflow = 'visible';
}

export class MarkdownRenderer {
  constructor({
    markedLibrary = globalThis.marked,
    highlightLibrary = globalThis.hljs,
    mermaidLibrary = globalThis.mermaid
  } = {}) {
    this.mermaidRenderSequence = 0;
    this.activeMermaidOperation = null;
    this.marked = markedLibrary;
    this.hljs = highlightLibrary;
    this.mermaid = mermaidLibrary;
    this.initMarked();
    this.initHighlightJs();
    this.initMermaid();
  }

  initMermaid() {
    if (this.mermaid) {
      try {
        this.mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'dark',
          flowchart: { htmlLabels: true, curve: 'linear' },
          sequence: { showSequenceNumbers: true },
          suppressErrorRendering: true
        });
      } catch (err) {
        console.warn('Mermaid initialization warning:', err);
      }
    }
  }

  initHighlightJs() {
    if (this.hljs && typeof this.hljs.registerAliases === 'function') {
      this.hljs.registerAliases('jsonc', { languageName: 'json' });
      this.hljs.registerAliases(['powershell', 'ps1', 'pwsh', 'ps'], { languageName: 'powershell' });
    }
  }

  initMarked() {
    if (!this.marked) {
      console.warn('Marked library not yet loaded.');
      return;
    }

    // Marked 옵션 설정
    this.marked.setOptions({
      gfm: true,
      breaks: true,
      pedantic: false,
      smartLists: true,
      smartypants: true
    });
  }

  /**
   * Mermaid는 내부적으로 렌더링 작업을 한 줄로 처리합니다. 한 작업이 멈춘 동안
   * 다음 작업을 계속 줄 세우지 않도록, 현재 작업 하나만 추적하고 호출 쪽에는
   * 취소 신호와 제한 시간을 적용합니다.
   */
  runMermaidOperation(operationFactory, { signal, timeoutMs, label }) {
    if (signal?.aborted) return Promise.reject(createAbortError());
    if (this.activeMermaidOperation) {
      return Promise.reject(new Error(
        `이전 Mermaid ${this.activeMermaidOperation.label} 작업이 아직 끝나지 않았습니다.`
      ));
    }

    const operationPromise = Promise.resolve().then(operationFactory);
    const trackedOperation = { label, promise: operationPromise };
    this.activeMermaidOperation = trackedOperation;

    // 호출 쪽이 제한 시간으로 먼저 끝나더라도 실제 Mermaid 작업이 끝날 때까지
    // active 상태를 유지하여 후속 문서가 같은 전역 큐에 쌓이지 않게 합니다.
    operationPromise.then(
      () => {
        if (this.activeMermaidOperation === trackedOperation) this.activeMermaidOperation = null;
      },
      () => {
        if (this.activeMermaidOperation === trackedOperation) this.activeMermaidOperation = null;
      }
    );

    return new Promise((resolve, reject) => {
      let settled = false;
      let timerId = null;

      const cleanup = () => {
        if (timerId !== null) clearTimeout(timerId);
        signal?.removeEventListener('abort', handleAbort);
      };
      const finish = (handler, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        handler(value);
      };
      const handleAbort = () => finish(reject, createAbortError());

      signal?.addEventListener('abort', handleAbort, { once: true });
      timerId = setTimeout(
        () => finish(reject, new Error(`Mermaid ${label} 제한 시간 초과 (${timeoutMs}ms)`)),
        timeoutMs
      );
      operationPromise.then(
        result => finish(resolve, result),
        error => finish(reject, error)
      );
    });
  }

  /**
   * GitHub 스타일 Admonition / Callout 박스(> [!NOTE] 등) 사전 변환
   */
  processCallouts(markdown) {
    const calloutMap = {
      'NOTE': { class: 'note', icon: 'fa-info-circle', title: '참고 (Note)' },
      'TIP': { class: 'tip', icon: 'fa-lightbulb', title: '팁 (Tip)' },
      'IMPORTANT': { class: 'important', icon: 'fa-exclamation-circle', title: '중요 (Important)' },
      'WARNING': { class: 'warning', icon: 'fa-triangle-exclamation', title: '주의 (Warning)' },
      'CAUTION': { class: 'caution', icon: 'fa-fire', title: '경고 (Caution)' }
    };

    return markdown.replace(/^>[ ]?\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ ]*([^\n]*)\n((?:>[ ].*\n?)*)/gim, (match, type, title, body) => {
      const config = calloutMap[type.toUpperCase()] || calloutMap.NOTE;
      const displayTitle = title.trim() || config.title;
      const cleanBody = body.replace(/^>[ ]?/gm, '');
      return `<div class="admonition admonition-${config.class}"><div class="admonition-title"><i class="fas ${config.icon}"></i> ${displayTitle}</div><div class="admonition-content">\n\n${cleanBody}\n\n</div></div>\n\n`;
    });
  }

  /**
   * 마크다운 텍스트를 파싱하고 HTML로 렌더링합니다.
   * @param {string} markdownText 마크다운 원문
   * @param {string} currentDocPath 현재 문서 상대경로 (이미지 상대경로 계산용)
   * @returns {string} 완성된 HTML 문자열
   */
  render(markdownText, currentDocPath = '') {
    if (!markdownText) return '<div class="empty-state">문서 내용이 비어있습니다.</div>';

    this.currentDocPath = currentDocPath;

    // 1단계: 마크다운 텍스트 내 이미지 상대 경로를 API 서빙 URL로 사전 치환
    let processed = this.resolveImagePaths(markdownText, currentDocPath);

    // 2단계: GitHub Callouts (> [!NOTE] 등) 사전 처리
    processed = this.processCallouts(processed);

    // 3단계: Marked.js 파싱
    if (this.marked && typeof this.marked.parse === 'function') {
      try {
        return this.marked.parse(processed);
      } catch (err) {
        console.warn('Marked parsing error, falling back:', err);
      }
    }

    // 4단계: Marked CDN 로드 지연 시 안전 Fallback 파서 (본문이 항상 보이도록 보장)
    return this.fallbackRender(processed);
  }

  fallbackRender(md) {
    let escaped = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 코드 블록
    escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // 헤딩
    escaped = escaped.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    escaped = escaped.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    escaped = escaped.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // 볼드/이탤릭
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // 이미지
    escaped = escaped.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:8px;" />');
    // 일반 링크
    escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    // 인용구
    escaped = escaped.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    // 줄바꿈
    escaped = escaped.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');

    return `<div class="fallback-rendered-markdown"><p>${escaped}</p></div>`;
  }

  /**
   * 문서 위치를 기반으로 상대경로 이미지를 API 주소로 보정합니다.
   */
  resolveImagePaths(markdown, docPath) {
    const docDir = docPath.includes('/') ? docPath.substring(0, docPath.lastIndexOf('/')) : '';

    // Markdown 이미지 문법: ![alt](url)
    const mdImageRegex = /!\[(.*?)\]\((.*?)\)/g;
    let result = markdown.replace(mdImageRegex, (match, alt, src) => {
      const cleanSrc = src.trim().split(' ')[0]; // 타이틀 제거
      if (cleanSrc.startsWith('http://') || cleanSrc.startsWith('https://') || cleanSrc.startsWith('data:')) {
        return match;
      }
      
      const resolvedPath = this.combinePaths(docDir, cleanSrc);
      return `![${alt}](/api/materials/raw/${encodeURIComponent(resolvedPath)})`;
    });

    // HTML img 태그 문법: <img src="url" ...>
    const htmlImgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    result = result.replace(htmlImgRegex, (match, src) => {
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
        return match;
      }
      const resolvedPath = this.combinePaths(docDir, src);
      return match.replace(src, `/api/materials/raw/${encodeURIComponent(resolvedPath)}`);
    });

    // Markdown 일반 링크 중 상대경로 .html 링크: [text](url.html) -> /api/materials/raw/... 로 보정
    const mdHtmlLinkRegex = /\[(.*?)\]\((.*?\.html(?:[?#][^\s)]*)?)\)/gi;
    result = result.replace(mdHtmlLinkRegex, (match, text, href) => {
      const cleanHref = href.trim().split(' ')[0];
      if (cleanHref.startsWith('http://') || cleanHref.startsWith('https://') || cleanHref.startsWith('/')) {
        return match;
      }
      const resolvedPath = this.combinePaths(docDir, cleanHref);
      return `[${text}](/api/materials/raw/${encodeURIComponent(resolvedPath)})`;
    });

    return result;
  }

  combinePaths(base, relative) {
    if (!base) return relative;
    const parts = base.split('/').concat(relative.split('/'));
    const resolved = [];
    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return resolved.join('/');
  }

  /**
   * 렌더링된 DOM 요소 후처리 (코드 하이라이팅, 복사 버튼, Mermaid 렌더링, 블록 ID 주입)
   * @param {HTMLElement} containerElement 마크다운이 삽입된 DOM 컨테이너
   */
  async postProcess(containerElement, { signal, isCurrent = () => true } = {}) {
    if (!containerElement) return;

    const ownerDocument = containerElement.ownerDocument || document;
    const shouldContinue = () => !signal?.aborted && isCurrent();

    // 0) 모든 마크다운 블록 요소에 고유 data-block-id 부여 (CSS 어노테이션 & 정밀 판서 매핑용)
    const blockSelectors = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, tr, img, table';
    const blocks = containerElement.querySelectorAll(blockSelectors);
    blocks.forEach((el, idx) => {
      el.setAttribute('data-block-id', `blk-${idx}`);
    });

    // 0-1) 모든 마크다운 Table을 반응형 스크롤 컨테이너로 안전하게 래핑
    containerElement.querySelectorAll('table:not(.wrapped)').forEach((table) => {
      table.classList.add('wrapped');
      const wrapper = ownerDocument.createElement('div');
      wrapper.className = 'table-responsive';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    // 0-2) 이미지 요소에 자동 반응형 센터링 및 고화질 렌더링 클래스 부여
    containerElement.querySelectorAll('img:not(.rendered-diagram-img)').forEach((img) => {
      img.classList.add('rendered-diagram-img');
      // 문서 전체 높이와 판서 좌표를 안정적으로 계산하려면 화면 밖 이미지도 즉시 요청해야 합니다.
      img.loading = 'eager';
      img.decoding = 'async';
    });

    // 0-3) 링크 요소 후처리 (외부 링크, HTML 인터랙티브 뷰어, 내부 마크다운 문서 링크 분기)
    const docDir = this.currentDocPath && this.currentDocPath.includes('/')
      ? this.currentDocPath.substring(0, this.currentDocPath.lastIndexOf('/'))
      : '';

    containerElement.querySelectorAll('a[href]').forEach((a) => {
      const rawHref = a.getAttribute('href') || '';
      if (!rawHref) return;

      // 1. 외부 링크 또는 인터랙티브 HTML 뷰어 링크 -> 새 탭에서 열기
      if (rawHref.startsWith('http://') || rawHref.startsWith('https://') || rawHref.includes('/api/materials/raw/') || rawHref.endsWith('.html')) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        return;
      }

      // 2. 내부 마크다운 문서 링크 (.md, .markdown) -> 프레젠테이션 미러 내비게이션으로 연결
      const mdMatch = rawHref.match(/^(.*?\.md|.*?\.markdown)(?:([?#].*))?$/i);
      if (mdMatch) {
        let cleanPath = mdMatch[1].trim();
        try {
          cleanPath = decodeURIComponent(cleanPath);
        } catch (error) {
          console.warn('잘못 인코딩된 문서 링크를 원문 그대로 사용합니다:', cleanPath);
        }
        const resolvedDocPath = this.combinePaths(docDir, cleanPath);
        a.setAttribute('data-target-doc', resolvedDocPath);
        a.classList.add('doc-nav-link');
        a.setAttribute('href', '#'); // 브라우저 페이지 전체 이동 방지
        a.title = `클릭하여 '${cleanPath}' 교재 문서로 이동`;
      }
    });

    // 1) Highlight.js 구문 강조 및 복사 버튼 부착
    if (this.hljs) {
      containerElement.querySelectorAll('pre code:not(.language-mermaid)').forEach((block) => {
        try {
          // 이미 하이라이트된 블록인지 확인
          if (!block.classList.contains('hljs')) {
            this.hljs.highlightElement(block);
          }
        } catch (error) {
          console.warn('코드 문법 강조를 건너뜁니다:', error);
        }

        // 코드 복사 버튼 래퍼 생성
        const pre = block.parentElement;
        if (!pre.querySelector('.code-copy-btn')) {
          pre.style.position = 'relative';
          const copyBtn = ownerDocument.createElement('button');
          copyBtn.className = 'btn-icon code-copy-btn';
          copyBtn.innerHTML = '<i class="fas fa-copy"></i> 복사';
          copyBtn.style.position = 'absolute';
          copyBtn.style.top = '8px';
          copyBtn.style.right = '8px';
          copyBtn.style.padding = '4px 8px';
          copyBtn.style.fontSize = '0.75rem';
          copyBtn.style.opacity = '0.7';

          copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(block.innerText).then(() => {
              copyBtn.innerHTML = '<i class="fas fa-check"></i> 완료!';
              setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> 복사';
              }, 2000);
            });
          });

          pre.appendChild(copyBtn);
        }
      });
    }

    // 2) Mermaid.js 다이어그램 렌더링 (사전 검증 + 타임아웃 보호 + 전역 상태 오염 원천 차단)
    if (this.mermaid) {
      const mermaidBlocks = Array.from(
        containerElement.querySelectorAll('pre code.language-mermaid')
      );
      for (const codeEl of mermaidBlocks) {
        if (!shouldContinue()) break;

        const originalMermaid = codeEl.innerText;
        const legendContext = codeEl.parentElement?.nextElementSibling?.textContent || '';

        // 고유 타임스탬프 + 시퀀스 번호로 ID 충돌 원천 차단
        const uniqueRenderId = `mermaid-${Date.now()}-${++this.mermaidRenderSequence}`;
        const containerDiv = ownerDocument.createElement('div');
        containerDiv.className = 'mermaid-chart';
        containerDiv.id = uniqueRenderId;

        const pre = codeEl.parentElement;
        const blockId = pre?.getAttribute('data-block-id');
        if (blockId) containerDiv.setAttribute('data-block-id', blockId);
        if (pre?.parentNode) {
          pre.parentNode.replaceChild(containerDiv, pre);
        }

        let rendered = false;
        try {
          // 1단계: 정규화 자체가 실패해도 이 다이어그램만 원문으로 되돌립니다.
          const mermaidSource = normalizeMermaidSource(originalMermaid, legendContext);

          // 2단계: 사전 구문 검증이 false를 반환하면 render를 호출하지 않습니다.
          if (typeof this.mermaid.parse === 'function') {
            const isValid = await this.runMermaidOperation(
              () => this.mermaid.parse(mermaidSource, { suppressErrors: true }),
              {
                signal,
                timeoutMs: MERMAID_PARSE_TIMEOUT_MS,
                label: '구문 검사'
              }
            );
            if (isValid === false) throw new Error('Mermaid 구문이 올바르지 않습니다.');
          }
          if (!shouldContinue()) throw createAbortError();

          // 3단계: 렌더링도 제한 시간 안에서 한 건씩만 실행합니다.
          const { svg } = await this.runMermaidOperation(
            () => this.mermaid.render(`${uniqueRenderId}-svg`, mermaidSource),
            {
              signal,
              timeoutMs: MERMAID_RENDER_TIMEOUT_MS,
              label: '렌더링'
            }
          );
          if (shouldContinue() && containerDiv.isConnected) {
            containerDiv.innerHTML = svg;
            fitMermaidSvg(containerDiv.querySelector('svg'));
            rendered = true;
          }
        } catch (err) {
          console.warn(`[Presentation Mirror] Mermaid 렌더링 보호 조치 발동 (${uniqueRenderId}):`, err?.message || err);
          
          // Mermaid가 만든 임시 노드만 치웁니다. 진행 중인 전역 파서를 재초기화하지 않습니다.
          try {
            ownerDocument.querySelectorAll(`[id*="${uniqueRenderId}"]`).forEach(el => {
              if (el !== containerDiv && !containerDiv.contains(el)) el.remove();
            });
          } catch (cleanErr) {
            // safe cleanup pass
          }
        }

        if (!rendered && containerDiv.isConnected) {
          containerDiv.classList.add('mermaid-error');
          const fallbackPre = ownerDocument.createElement('pre');
          const fallbackCode = ownerDocument.createElement('code');
          fallbackCode.textContent = originalMermaid;
          fallbackPre.appendChild(fallbackCode);
          containerDiv.replaceChildren(fallbackPre);
        }

        if (!shouldContinue()) break;
      }
    }
  }
}
