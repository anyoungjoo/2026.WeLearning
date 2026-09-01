/**
 * 📝 NotepadEngine - 실시간 노션형 인터랙티브 라이브 노트패드 엔진
 * 
 * [아키텍처 및 핵심 원리]
 * 1. Rich Text & Block Formatting:
 *    - ContentEditable 기반의 매끄럽고 빠른 텍스트 편집 및 스타일(H1, H2, Bold, Code, Quote, Callout, Checklist 등) 적용
 * 2. Realtime Typing & Content Synchronization:
 *    - 강사의 타이핑 및 서식 변경을 실시간으로 감지하여 Socket.IO로 모든 수강생 화면에 50ms 내외로 동기화
 * 3. Smart Clipboard Image Paste & Drag & Drop:
 *    - 강사가 강의 중 클립보드(Ctrl+V)로 캡처한 이미지나 드래그한 사진을 Express API(/api/notepad/upload)를 통해
 *      고속 업로드하고 정적 URL로 수강생에게 100% 동일하게 공유
 * 4. Export & Utility:
 *    - 작성된 라이브 강의 노트를 원클릭으로 마크다운(.md) 파일로 다운로드하거나 클립보드에 복사 가능
 */

export class NotepadEngine {
  constructor(options = {}) {
    this.container = options.container;
    this.titleEl = options.titleEl;
    this.editorEl = options.editorEl;
    this.toolbarEl = options.toolbarEl;
    this.fileInput = options.fileInput;
    this.onContentChange = options.onContentChange || (() => {});
    this.onScrollChange = options.onScrollChange || (() => {});
    this.showToast = options.showToast || (() => {});

    this.isPresenter = false;
    this.isProgrammaticUpdate = false;
    this.scrollThrottleTimer = null;
    this.lastHtml = '';
    this.lastTitle = '';

    this.init();
  }

  // ----------------------------------------------------
  // 1. 이벤트 리스너 및 초기화
  // ----------------------------------------------------
  init() {
    if (!this.editorEl || !this.titleEl) return;

    // 1단계: 강사 타이핑 및 입력 이벤트 감지
    const handleInput = () => {
      if (!this.isPresenter || this.isProgrammaticUpdate) return;

      const title = this.titleEl.innerText.trim();
      const content = this.editorEl.innerHTML;

      if (title !== this.lastTitle || content !== this.lastHtml) {
        this.lastTitle = title;
        this.lastHtml = content;
        this.onContentChange(title, content);
      }
    };

    this.titleEl.addEventListener('input', handleInput);
    this.editorEl.addEventListener('input', handleInput);

    // 2단계: 클립보드 이미지 붙여넣기 (Ctrl + V)
    this.editorEl.addEventListener('paste', (e) => {
      if (!this.isPresenter) return;

      const items = (e.clipboardData || e.originalEvent.clipboardData)?.items;
      if (!items) return;

      let hasImage = false;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          hasImage = true;
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            this.handleImageUpload(file);
          }
          break;
        }
      }
    });

    // 3단계: 이미지 파일 드래그 앤 드롭 지원
    this.editorEl.addEventListener('dragover', (e) => {
      if (!this.isPresenter) return;
      e.preventDefault();
      this.editorEl.classList.add('drag-over');
    });

    this.editorEl.addEventListener('dragleave', () => {
      if (!this.isPresenter) return;
      this.editorEl.classList.remove('drag-over');
    });

    this.editorEl.addEventListener('drop', (e) => {
      if (!this.isPresenter) return;
      e.preventDefault();
      this.editorEl.classList.remove('drag-over');

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            this.handleImageUpload(file);
            break;
          }
        }
      }
    });

    // 4단계: 파일 선택창을 통한 이미지 업로드
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          this.handleImageUpload(file);
          this.fileInput.value = '';
        }
      });
    }

    // 5단계: 스크롤 동기화 감지 (강사 전용)
    if (this.container) {
      this.container.addEventListener('scroll', () => {
        if (!this.isPresenter || this.isProgrammaticUpdate) return;

        const maxScroll = this.container.scrollHeight - this.container.clientHeight;
        if (maxScroll <= 0) return;

        const ratio = Math.min(1.0, Math.max(0.0, this.container.scrollTop / maxScroll));

        if (this.scrollThrottleTimer) return;
        this.scrollThrottleTimer = setTimeout(() => {
          this.onScrollChange(ratio);
          this.scrollThrottleTimer = null;
        }, 30);
      }, { passive: true });
    }

    // 6단계: 서식 툴바 버튼 이벤트 바인딩
    this.initToolbarEvents();
  }

  // ----------------------------------------------------
  // 2. 서식 툴바 제어 및 노션 스타일 블록 서식
  // ----------------------------------------------------
  initToolbarEvents() {
    if (!this.toolbarEl) return;

    const actionBtns = this.toolbarEl.querySelectorAll('[data-notepad-cmd]');
    actionBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!this.isPresenter) return;

        const cmd = btn.getAttribute('data-notepad-cmd');
        const val = btn.getAttribute('data-notepad-val') || null;
        this.executeCommand(cmd, val);
      });
    });
  }

  executeCommand(cmd, val = null) {
    this.editorEl.focus();

    if (cmd === 'heading') {
      document.execCommand('formatBlock', false, val || '<h2>');
    } else if (cmd === 'paragraph') {
      document.execCommand('formatBlock', false, '<p>');
    } else if (cmd === 'blockquote') {
      document.execCommand('formatBlock', false, '<blockquote>');
    } else if (cmd === 'callout') {
      this.insertCustomBlock('callout');
    } else if (cmd === 'codeblock') {
      this.insertCustomBlock('codeblock');
    } else if (cmd === 'checklist') {
      this.insertCustomBlock('checklist');
    } else if (cmd === 'divider') {
      document.execCommand('insertHorizontalRule', false, null);
    } else if (cmd === 'insertImage') {
      if (this.fileInput) this.fileInput.click();
    } else {
      document.execCommand(cmd, false, val);
    }

    // 입력 내용 브로드캐스트
    const title = this.titleEl.innerText.trim();
    const content = this.editorEl.innerHTML;
    this.lastTitle = title;
    this.lastHtml = content;
    this.onContentChange(title, content);
  }

  insertCustomBlock(type) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim() || '내용을 입력하세요';

    let htmlToInsert = '';
    if (type === 'callout') {
      htmlToInsert = `
        <div class="notepad-callout" contenteditable="true">
          <span class="callout-icon">💡</span>
          <div class="callout-body">${selectedText}</div>
        </div>
        <p><br></p>
      `;
    } else if (type === 'codeblock') {
      htmlToInsert = `
        <pre class="notepad-codeblock" contenteditable="true"><code>${selectedText}</code></pre>
        <p><br></p>
      `;
    } else if (type === 'checklist') {
      htmlToInsert = `
        <div class="notepad-checklist-item" contenteditable="true">
          <input type="checkbox" class="notepad-checkbox" />
          <span class="checklist-text">${selectedText}</span>
        </div>
        <p><br></p>
      `;
    }

    if (htmlToInsert) {
      document.execCommand('insertHTML', false, htmlToInsert);
    }
  }

  // ----------------------------------------------------
  // 3. 이미지 업로드 & 붙여넣기 파이프라인
  // ----------------------------------------------------
  async handleImageUpload(file) {
    try {
      this.showToast('<i class="fas fa-spinner fa-spin"></i> 이미지를 업로드하고 있습니다...');

      // 1단계: Base64 Data URL로 인코딩
      const base64Data = await this.readFileAsDataURL(file);

      // 2단계: 서버 REST API로 업로드 요청
      const res = await fetch('/api/notepad/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          filename: file.name
        })
      });

      const data = await res.json();
      if (!data.success || !data.url) {
        throw new Error(data.message || '이미지 업로드에 실패했습니다.');
      }

      // 3단계: 에디터 본문 커서 위치에 이미지 태그 삽입
      this.insertImageToEditor(data.url, file.name);

      this.showToast('<i class="fas fa-check-circle"></i> 사진이 본문에 공유되었습니다!');
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      this.showToast(`<i class="fas fa-circle-exclamation"></i> ${err.message || '이미지 업로드 오류'}`);
    }
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  insertImageToEditor(imageUrl, filename = 'image') {
    this.editorEl.focus();

    const figureHtml = `
      <figure class="notepad-image-card" contenteditable="false">
        <div class="image-wrapper">
          <img src="${imageUrl}" alt="${filename}" loading="lazy" />
        </div>
        <figcaption contenteditable="true">📷 ${filename || '캡처 이미지'}</figcaption>
      </figure>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, figureHtml);

    // 변경사항 실시간 브로드캐스트
    const title = this.titleEl.innerText.trim();
    const content = this.editorEl.innerHTML;
    this.lastTitle = title;
    this.lastHtml = content;
    this.onContentChange(title, content);
  }

  // ----------------------------------------------------
  // 4. 강사/수강생 역할 전환 & 문서 동기화 적용
  // ----------------------------------------------------
  setPresenterMode(isPresenter) {
    this.isPresenter = isPresenter;

    if (isPresenter) {
      this.titleEl.setAttribute('contenteditable', 'true');
      this.editorEl.setAttribute('contenteditable', 'true');
      this.titleEl.setAttribute('placeholder', '제목을 입력하세요 (예: 💡 1주차 핵심 요약)');
      if (this.toolbarEl) this.toolbarEl.classList.remove('readonly');
    } else {
      this.titleEl.setAttribute('contenteditable', 'false');
      this.editorEl.setAttribute('contenteditable', 'false');
      if (this.toolbarEl) this.toolbarEl.classList.add('readonly');
    }
  }

  setDocument(title, content) {
    this.isProgrammaticUpdate = true;

    if (title !== undefined && this.titleEl) {
      this.titleEl.innerText = title || '💡 라이브 강의 요약 노트';
      this.lastTitle = title;
    }

    if (content !== undefined && this.editorEl) {
      this.editorEl.innerHTML = content || '<p></p>';
      this.lastHtml = content;
    }

    setTimeout(() => {
      this.isProgrammaticUpdate = false;
    }, 50);
  }

  setScrollRatio(ratio) {
    if (!this.container || ratio === undefined || ratio === null) return;
    const maxScroll = this.container.scrollHeight - this.container.clientHeight;
    if (maxScroll <= 0) return;

    this.isProgrammaticUpdate = true;
    this.container.scrollTo({
      top: ratio * maxScroll,
      behavior: 'smooth'
    });

    setTimeout(() => {
      this.isProgrammaticUpdate = false;
    }, 300);
  }

  clear() {
    this.setDocument('💡 라이브 강의 요약 노트', '<p></p>');
  }

  // ----------------------------------------------------
  // 5. 마크다운 내보내기 & 클립보드 복사
  // ----------------------------------------------------

  /**
   * HTML을 깔끔한 마크다운 형식으로 변환합니다.
   */
  getMarkdownContent() {
    const title = this.titleEl?.innerText.trim() || '라이브 강의 노트';
    const rawHtml = this.editorEl?.innerHTML || '';

    // HTML -> 간단한 Markdown 변환 파이프라인
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rawHtml;

    let md = `# ${title}\n\n`;

    const traverse = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const tag = node.tagName.toLowerCase();
      let inner = Array.from(node.childNodes).map(traverse).join('');

      switch (tag) {
        case 'h1': return `\n# ${inner}\n\n`;
        case 'h2': return `\n## ${inner}\n\n`;
        case 'h3': return `\n### ${inner}\n\n`;
        case 'p': return `${inner}\n\n`;
        case 'strong':
        case 'b': return `**${inner}**`;
        case 'em':
        case 'i': return `*${inner}*`;
        case 'u': return `<u>${inner}</u>`;
        case 's':
        case 'strike': return `~~${inner}~~`;
        case 'blockquote': return `\n> ${inner.trim()}\n\n`;
        case 'pre':
        case 'code':
          if (node.parentElement?.tagName.toLowerCase() === 'pre') return inner;
          if (tag === 'pre') return `\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
          return `\`${inner}\``;
        case 'ul': return `\n${inner}\n`;
        case 'ol': return `\n${inner}\n`;
        case 'li': return `- ${inner}\n`;
        case 'hr': return `\n---\n\n`;
        case 'figure': {
          const img = node.querySelector('img');
          const caption = node.querySelector('figcaption')?.textContent || '이미지';
          const src = img?.getAttribute('src') || '';
          return `\n![${caption}](${src})\n\n`;
        }
        case 'img': {
          const src = node.getAttribute('src') || '';
          const alt = node.getAttribute('alt') || '이미지';
          return `\n![${alt}](${src})\n\n`;
        }
        case 'div': {
          if (node.classList.contains('notepad-callout')) {
            const body = node.querySelector('.callout-body')?.textContent || inner;
            return `\n> 💡 **Tip:** ${body.trim()}\n\n`;
          }
          if (node.classList.contains('notepad-checklist-item')) {
            const checked = node.querySelector('input[type="checkbox"]')?.checked;
            const text = node.querySelector('.checklist-text')?.textContent || inner;
            return `- [${checked ? 'x' : ' '}] ${text.trim()}\n`;
          }
          return `${inner}\n`;
        }
        default:
          return inner;
      }
    };

    md += Array.from(tempDiv.childNodes).map(traverse).join('').replace(/\n{3,}/g, '\n\n');
    return md;
  }

  exportMarkdownFile() {
    const md = this.getMarkdownContent();
    const title = (this.titleEl?.innerText.trim() || 'live-lecture-note').replace(/[/\\?%*:|"<>]/g, '-');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('📥 마크다운(.md) 파일이 다운로드되었습니다!');
  }

  async copyMarkdownToClipboard() {
    const md = this.getMarkdownContent();
    try {
      await navigator.clipboard.writeText(md);
      this.showToast('📋 노트 내용이 마크다운 형식으로 클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      this.showToast('클립보드 복사에 실패했습니다.');
    }
  }
}
