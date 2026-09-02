import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  expandMermaidViewBox,
  fitMermaidSvg,
  normalizeMermaidSource
} from '../public/js/markdownRenderer.js';

function createFakeSvg(attributes, bounds = null) {
  const values = new Map(Object.entries(attributes));

  return {
    style: {},
    getAttribute(name) {
      return values.get(name) ?? null;
    },
    setAttribute(name, value) {
      values.set(name, value);
    },
    removeAttribute(name) {
      values.delete(name);
    },
    getBBox() {
      if (!bounds) throw new Error('Bounds are not available');
      return bounds;
    }
  };
}

test('Mermaid SVG keeps its aspect ratio and fits inside the document width', () => {
  const svg = createFakeSvg({
    viewBox: '0 0 1240 620',
    width: '1240',
    height: '620'
  }, {
    x: 12,
    y: 12,
    width: 1216,
    height: 596
  });

  fitMermaidSvg(svg);

  assert.equal(svg.getAttribute('width'), null);
  assert.equal(svg.getAttribute('height'), null);
  assert.equal(svg.getAttribute('preserveAspectRatio'), 'xMidYMid meet');
  assert.equal(svg.style.width, 'min(100%, 1240px)');
  assert.equal(svg.style.maxWidth, '100%');
  assert.equal(svg.style.height, 'auto');
  assert.equal(svg.style.overflow, 'visible');
});

test('Mermaid viewBox expands to include diagram content rendered outside its viewport', () => {
  const svg = createFakeSvg(
    { viewBox: '-71.84375 -27.5 379.9375 237.5' },
    { x: 0.5, y: 0, width: 300.09375, height: 468.5 }
  );

  const expanded = expandMermaidViewBox(svg);

  assert.deepEqual(expanded, [-71.84375, -27.5, 384.4375, 508]);
  assert.equal(svg.getAttribute('viewBox'), '-71.84375 -27.5 384.4375 508');

  fitMermaidSvg(svg);
  assert.equal(svg.style.width, 'min(100%, 385px)');
});

test('legacy radar material is converted to Mermaid radar-beta syntax', () => {
  const source = `radar
    title 주요 코딩 LLM 기능 비교
    "추론 능력": [9.5, 9.0, 8.8]
    "생성 속도": [7.0, 9.5, 8.5]
    "가성비": [6.0, 8.0, 9.0]`;
  const legend = '(범례: 파랑 = Claude, 초록 = GPT, 주황 = Gemini)';

  const normalized = normalizeMermaidSource(source, legend);

  assert.match(normalized, /^radar-beta/);
  assert.match(normalized, /axis metric1\["추론 능력"\]/);
  assert.match(normalized, /curve series1\["Claude"\]\{9\.5, 7, 6\}/);
  assert.match(normalized, /curve series3\["Gemini"\]\{8\.8, 8\.5, 9\}/);
  assert.match(normalized, /max 10/);
});

test('normalizeMermaidSource automatically quotes unquoted edge labels containing parentheses and special chars', () => {
  const source = `graph LR
    User["👤 사용자 입력"] --> App["💻 사내 프로그램"]
    App -->|매번 API 호출 (유료/보안리스크)| CloudAI["🌐 클라우드 AI 모델"]
    CloudAI -->|"이미 따옴표가 있는 라벨"| App
    Step1 -->|1차: 기계 번역<br/>(한국어-KSL 병렬 코퍼스 극도 부족)| Step2`;

  const normalized = normalizeMermaidSource(source);

  assert.match(normalized, /App -->\|"매번 API 호출 \(유료\/보안리스크\)"\| CloudAI/);
  assert.match(normalized, /CloudAI -->\|"이미 따옴표가 있는 라벨"\| App/);
  assert.match(normalized, /Step1 -->\|"1차: 기계 번역<br\/>\(한국어-KSL 병렬 코퍼스 극도 부족\)"\| Step2/);
});

test('Highlight.js processing skips Mermaid code blocks and supports jsonc alias', () => {
  const rendererSource = fs.readFileSync(
    new URL('../public/js/markdownRenderer.js', import.meta.url),
    'utf8'
  );

  assert.match(rendererSource, /pre code:not\(\.language-mermaid\)/);
  assert.match(rendererSource, /hljs\.registerAliases\('jsonc',\s*\{\s*languageName:\s*'json'\s*\}\)/);
});

test('the viewer loads a Mermaid version that supports radar-beta', () => {
  const indexHtml = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

  assert.match(indexHtml, /mermaid@11\.16\.1\/dist\/mermaid\.min\.js/);
  assert.match(indexHtml, /<link rel="icon"/);
});

test('materials table of contents shows the Markdown filename extension', () => {
  const appSource = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');

  assert.match(appSource, /fileName\.textContent = node\.name/);
  assert.doesNotMatch(appSource, /node\.name\.replace\(\/\\\.md\$\/i/);
});
