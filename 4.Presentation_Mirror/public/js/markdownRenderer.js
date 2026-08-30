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

export class MarkdownRenderer {
  constructor() {
    this.initMarked();
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
  postProcess(containerElement) {
    if (!containerElement) return;

    // 0) 모든 마크다운 블록 요소에 고유 data-block-id 부여 (CSS 어노테이션 & 정밀 판서 매핑용)
    const blockSelectors = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, tr, img';
    const blocks = containerElement.querySelectorAll(blockSelectors);
    blocks.forEach((el, idx) => {
      el.setAttribute('data-block-id', `blk-${idx}`);
    });

    // 1) Highlight.js 구문 강조 및 복사 버튼 부착
    if (typeof hljs !== 'undefined') {
      containerElement.querySelectorAll('pre code').forEach((block) => {
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

    // 2) Mermaid.js 다이어그램 렌더링
    if (typeof mermaid !== 'undefined') {
      const mermaidBlocks = containerElement.querySelectorAll('pre code.language-mermaid');
      mermaidBlocks.forEach((codeEl, idx) => {
        const rawMermaid = codeEl.innerText;
        const containerDiv = document.createElement('div');
        containerDiv.className = 'mermaid-chart';
        containerDiv.style.display = 'flex';
        containerDiv.style.justifyContent = 'center';
        containerDiv.style.margin = '20px 0';
        containerDiv.id = `mermaid-svg-${idx}-${Date.now()}`;
        
        const pre = codeEl.parentElement;
        pre.parentNode.replaceChild(containerDiv, pre);

        try {
          mermaid.render(containerDiv.id + '-render', rawMermaid).then(({ svg }) => {
            containerDiv.innerHTML = svg;
          });
        } catch (err) {
          console.warn('Mermaid rendering error:', err);
          containerDiv.innerText = rawMermaid;
        }
      });
    }
  }
}
