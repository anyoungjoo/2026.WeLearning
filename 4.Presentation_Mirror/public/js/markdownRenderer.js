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
    // 엣지 라벨 |label| 매칭
    return line.replace(/\|([^|\r\n]+)\|/g, (match, label) => {
      const trimmed = label.trim();
      // 이미 큰따옴표로 둘러싸여 있는 경우 건너뜀
      if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
        return match;
      }
      // 큰따옴표로 안전하게 감싸고 내부 이스케이프
      const escaped = trimmed.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `|"${escaped}"|`;
    });
  });
  return processed.join('\n');
}

/**
 * 1. 비표준 radar 문법을 Mermaid 11의 radar-beta 문법으로 변환합니다.
 * 2. flowchart/graph 등의 엣지 라벨에 특수문자/괄호가 있을 때 파싱 오류를 방지하기 위해 큰따옴표로 자동 정규화합니다.
 */
export function normalizeMermaidSource(source, contextText = '') {
  const originalSource = String(source || '');
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
    const allValues = metrics.flatMap(metric => metric.values);
    const highestValue = Math.max(...allValues);
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
  constructor() {
    this.mermaidRenderSequence = 0;
    this.initMarked();
    this.initHighlightJs();
  }

  initHighlightJs() {
    if (typeof hljs !== 'undefined' && typeof hljs.registerAliases === 'function') {
      hljs.registerAliases('jsonc', { languageName: 'json' });
      hljs.registerAliases(['powershell', 'ps1', 'pwsh', 'ps'], { languageName: 'powershell' });
    }
  }

  initMarked() {
    if (typeof marked === 'undefined') {
      console.warn('Marked library not yet loaded.');
      return;
    }

    // Marked 옵션 설정
    marked.setOptions({
      gfm: true,
      breaks: true,
      pedantic: false,
      smartLists: true,
      smartypants: true
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

    // 1단계: 마크다운 텍스트 내 이미지 상대 경로를 API 서빙 URL로 사전 치환
    const processedMarkdown = this.resolveImagePaths(markdownText, currentDocPath);

    // 2단계: Marked.js 파싱
    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
      try {
        return marked.parse(processedMarkdown);
      } catch (err) {
        console.warn('Marked parsing error, falling back:', err);
      }
    }

    // 3단계: Marked CDN 로드 지연 시 안전 Fallback 파서 (본문이 항상 보이도록 보장)
    return this.fallbackRender(processedMarkdown);
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
  async postProcess(containerElement) {
    if (!containerElement) return;

    // 0) 모든 마크다운 블록 요소에 고유 data-block-id 부여 (CSS 어노테이션 & 정밀 판서 매핑용)
    const blockSelectors = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, tr, img';
    const blocks = containerElement.querySelectorAll(blockSelectors);
    blocks.forEach((el, idx) => {
      el.setAttribute('data-block-id', `blk-${idx}`);
    });

    // 1) Highlight.js 구문 강조 및 복사 버튼 부착
    if (typeof hljs !== 'undefined') {
      containerElement.querySelectorAll('pre code:not(.language-mermaid)').forEach((block) => {
        // 이미 하이라이트된 블록인지 확인
        if (!block.classList.contains('hljs')) {
          hljs.highlightElement(block);
        }

        // 코드 복사 버튼 래퍼 생성
        const pre = block.parentElement;
        if (!pre.querySelector('.code-copy-btn')) {
          pre.style.position = 'relative';
          const copyBtn = document.createElement('button');
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

    // 2) Mermaid.js 다이어그램 렌더링 (순차 처리로 Mermaid 큐 충돌 방지)
    if (typeof mermaid !== 'undefined') {
      const mermaidBlocks = Array.from(
        containerElement.querySelectorAll('pre code.language-mermaid')
      );
      for (const codeEl of mermaidBlocks) {
        const originalMermaid = codeEl.innerText;
        const legendContext = codeEl.parentElement?.nextElementSibling?.textContent || '';
        const mermaidSource = normalizeMermaidSource(originalMermaid, legendContext);
        const containerDiv = document.createElement('div');
        containerDiv.className = 'mermaid-chart';
        containerDiv.id = `mermaid-chart-${++this.mermaidRenderSequence}`;

        const pre = codeEl.parentElement;
        const blockId = pre?.getAttribute('data-block-id');
        if (blockId) containerDiv.setAttribute('data-block-id', blockId);
        if (pre?.parentNode) {
          pre.parentNode.replaceChild(containerDiv, pre);
        }

        try {
          const { svg } = await mermaid.render(`${containerDiv.id}-render`, mermaidSource);
          if (!containerDiv.isConnected) continue;

          containerDiv.innerHTML = svg;
          fitMermaidSvg(containerDiv.querySelector('svg'));
        } catch (err) {
          console.warn('Mermaid rendering error:', err);
          containerDiv.classList.add('mermaid-error');
          const fallbackPre = document.createElement('pre');
          const fallbackCode = document.createElement('code');
          fallbackCode.textContent = originalMermaid;
          fallbackPre.appendChild(fallbackCode);
          containerDiv.replaceChildren(fallbackPre);
        }
      }
    }
  }
}
