/**
 * 🖍️ TextAnnotationEngine - CSS 기반 정밀 텍스트 밑줄 및 형광펜 엔진
 * 
 * [설계 철학 & 핵심 원리]
 * 1. 픽셀(Canvas) 대신 DOM 텍스트 자체에 CSS 마킹(<mark>, <span>)을 적용하여,
 *    모바일/PC 화면 크기 차이, 줄바꿈(Word-wrap) 차이에도 100% 정확한 단어/문장에 동기화됩니다.
 * 2. 블록 인덱스(data-block-id)와 텍스트 오프셋(startOffset, endOffset)으로 직렬화하여
 *    네트워크를 통해 모든 수강생에게 완벽히 동일한 어노테이션을 재현합니다.
 */

export class TextAnnotationEngine {
  constructor(contentContainer, onAnnotationAdded, onAnnotationRemoved) {
    this.container = contentContainer; // #markdown-content
    this.onAnnotationAdded = onAnnotationAdded;
    this.onAnnotationRemoved = onAnnotationRemoved;

    this.currentMode = 'cursor'; // 'cursor' | 'highlight' | 'underline' | 'draw' | 'eraser'
    this.currentColor = '#fde047'; // 기본 노랑 형광펜 (#fde047) / 밑줄 (#ef4444)
    this.isPresenter = false;
    this.annotations = []; // 현재 문서의 어노테이션 목록

    this.initSelectionEvents();
  }

  setPresenterMode(isPresenter) {
    this.isPresenter = isPresenter;
  }

  setMode(mode) {
    this.currentMode = mode;
  }

  setColor(color) {
    this.currentColor = color;
  }

  initSelectionEvents() {
    // 텍스트 드래그 선택 완료(MouseUp / Touchend) 감지
    this.container.addEventListener('mouseup', () => this.handleSelectionEnd());
    this.container.addEventListener('touchend', () => {
      // 모바일 롱프레스 선택 감지 약간 지연
      setTimeout(() => this.handleSelectionEnd(), 100);
    });

    // 지우개 모드에서 어노테이션 클릭 시 삭제
    this.container.addEventListener('click', (e) => {
      if (!this.isPresenter || this.currentMode !== 'eraser') return;
      const target = e.target.closest('[data-ann-id]');
      if (target) {
        const annId = target.getAttribute('data-ann-id');
        this.removeAnnotation(annId);
        if (this.onAnnotationRemoved) {
          this.onAnnotationRemoved(annId);
        }
      }
    });
  }

  /**
   * 사용자가 마우스로 텍스트를 드래그하여 선택을 끝냈을 때 처리
   */
  handleSelectionEnd() {
    if (!this.isPresenter) return;
    if (this.currentMode !== 'highlight' && this.currentMode !== 'underline') return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // 선택 영역의 부모 블록 탐색
    const blockEl = this.findParentBlock(range.commonAncestorContainer);
    if (!blockEl || !this.container.contains(blockEl)) return;

    const blockId = blockEl.getAttribute('data-block-id');
    if (!blockId) return;

    // 블록 전체 텍스트 내에서 상대 오프셋 계산
    const offsets = this.calculateBlockOffsets(blockEl, range);
    if (!offsets) return;

    const annotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      blockId,
      type: this.currentMode, // 'highlight' | 'underline'
      color: this.currentColor,
      startOffset: offsets.start,
      endOffset: offsets.end,
      text: selectedText
    };

    // 선택 영역 해제
    selection.removeAllRanges();

    // 로컬 적용
    this.addAnnotation(annotation);

    // 서버로 브로드캐스트
    if (this.onAnnotationAdded) {
      this.onAnnotationAdded(annotation);
    }
  }

  /**
   * 블록 요소 내에서 Range의 텍스트 시작/끝 오프셋 계산
   */
  calculateBlockOffsets(blockEl, range) {
    let start = -1;
    let end = -1;
    let currentPos = 0;

    const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, null, false);
    let node;

    while ((node = walker.nextNode())) {
      const nodeLen = node.textContent.length;

      if (node === range.startContainer) {
        start = currentPos + range.startOffset;
      }
      if (node === range.endContainer) {
        end = currentPos + range.endOffset;
        break;
      }

      currentPos += nodeLen;
    }

    if (start !== -1 && end !== -1 && end > start) {
      return { start, end };
    }
    return null;
  }

  findParentBlock(node) {
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (el && el !== this.container) {
      if (el.hasAttribute('data-block-id')) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  /**
   * 어노테이션 목록 전체 렌더링 (문서 로드 시)
   */
  renderAll(annotations) {
    this.clearDOM();
    this.annotations = annotations || [];

    for (const ann of this.annotations) {
      this.applyAnnotationToDOM(ann);
    }
  }

  addAnnotation(ann) {
    this.annotations.push(ann);
    this.applyAnnotationToDOM(ann);
  }

  removeAnnotation(annId) {
    this.annotations = this.annotations.filter(a => a.id !== annId);
    this.removeAnnotationFromDOM(annId);
  }

  clear() {
    this.annotations = [];
    this.clearDOM();
  }

  /**
   * 단일 어노테이션을 DOM에 실제 <mark> 또는 <span>으로 감싸 적용
   */
  applyAnnotationToDOM(ann) {
    const blockEl = this.container.querySelector(`[data-block-id="${ann.blockId}"]`);
    if (!blockEl) return;

    // 블록 내의 텍스트 노드를 순회하며 해당 오프셋 범위 래핑
    const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      // 이미 어노테이션된 태그 내부는 건너뛰지 않고 텍스트 노드로 수집
      textNodes.push(node);
    }

    let currentPos = 0;
    for (const tNode of textNodes) {
      const len = tNode.textContent.length;
      const nodeStart = currentPos;
      const nodeEnd = currentPos + len;

      if (nodeEnd > ann.startOffset && nodeStart < ann.endOffset) {
        // 이 텍스트 노드와 겹침 -> 분할 후 래핑
        const wrapStart = Math.max(0, ann.startOffset - nodeStart);
        const wrapEnd = Math.min(len, ann.endOffset - nodeStart);

        if (wrapStart < wrapEnd) {
          this.wrapTextNodeRange(tNode, wrapStart, wrapEnd, ann);
        }
      }

      currentPos += len;
    }
  }

  wrapTextNodeRange(textNode, start, end, ann) {
    const parent = textNode.parentNode;
    if (!parent) return;

    const fullText = textNode.textContent;
    const beforeText = fullText.substring(0, start);
    const targetText = fullText.substring(start, end);
    const afterText = fullText.substring(end);

    const frag = document.createDocumentFragment();

    if (beforeText) {
      frag.appendChild(document.createTextNode(beforeText));
    }

    const wrapper = document.createElement(ann.type === 'highlight' ? 'mark' : 'span');
    wrapper.setAttribute('data-ann-id', ann.id);
    wrapper.className = ann.type === 'highlight' ? 'pm-text-highlight' : 'pm-text-underline';
    
    if (ann.type === 'highlight') {
      wrapper.style.backgroundColor = ann.color;
      wrapper.style.color = 'inherit';
      wrapper.style.padding = '1px 2px';
      wrapper.style.borderRadius = '3px';
    } else {
      wrapper.style.borderBottom = `2.5px solid ${ann.color}`;
      wrapper.style.paddingBottom = '1px';
    }

    wrapper.textContent = targetText;
    frag.appendChild(wrapper);

    if (afterText) {
      frag.appendChild(document.createTextNode(afterText));
    }

    parent.replaceChild(frag, textNode);
  }

  removeAnnotationFromDOM(annId) {
    const elements = this.container.querySelectorAll(`[data-ann-id="${annId}"]`);
    elements.forEach(el => {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
      parent.normalize(); // 인접한 텍스트 노드 병합
    });
  }

  clearDOM() {
    const elements = this.container.querySelectorAll('[data-ann-id]');
    elements.forEach(el => {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
      if (parent) parent.normalize();
    });
  }
}
