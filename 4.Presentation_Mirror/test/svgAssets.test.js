import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const materialDirs = [
  path.resolve(projectDir, '../1.교육자료/images'),
  path.resolve(projectDir, '../1.교육자료/기본_AI 이해/images')
];

function listSvgFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.svg'))
    .map(entry => path.join(directory, entry.name));
}

test('all directly served SVG materials have an XML namespace and no bare ampersands', () => {
  const failures = [];

  for (const filePath of materialDirs.flatMap(listSvgFiles)) {
    const source = fs.readFileSync(filePath, 'utf8');
    const rootTag = source.match(/<svg\b[^>]*>/i)?.[0] || '';
    if (!/\bxmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(rootTag)) {
      failures.push(`${path.basename(filePath)}: xmlns 누락`);
    }

    const xmlOutsideCommentsAndCdata = source
      .replace(/<!--[^]*?-->/g, '')
      .replace(/<!\[CDATA\[[^]*?\]\]>/g, '');
    if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-f]+;)/i.test(xmlOutsideCommentsAndCdata)) {
      failures.push(`${path.basename(filePath)}: 이스케이프되지 않은 & 문자`);
    }
  }

  assert.deepEqual(failures, []);
});
