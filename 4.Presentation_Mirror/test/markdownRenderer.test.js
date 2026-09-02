import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { fitMermaidSvg } from '../public/js/markdownRenderer.js';

function createFakeSvg(attributes) {
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
    }
  };
}

test('Mermaid SVG keeps its aspect ratio and fits inside the document width', () => {
  const svg = createFakeSvg({
    viewBox: '0 0 1240 620',
    width: '1240',
    height: '620'
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

test('materials table of contents shows the Markdown filename extension', () => {
  const appSource = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');

  assert.match(appSource, /fileName\.textContent = node\.name/);
  assert.doesNotMatch(appSource, /node\.name\.replace\(\/\\\.md\$\/i/);
});
