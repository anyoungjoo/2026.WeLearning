import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  buildMaterialsArchiveName,
  createMaterialsZipArchive
} from '../materialsArchive.js';

test('materials table of contents exposes the ZIP download action', () => {
  const indexHtml = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

  assert.match(indexHtml, /href="\/api\/materials\/download"/);
  assert.match(indexHtml, /교육자료 전체 ZIP 다운로드/);
});

test('materials archive filename includes the download date', () => {
  assert.equal(
    buildMaterialsArchiveName(new Date('2026-09-02T12:00:00.000Z')),
    'presentation-mirror-materials-2026-09-02.zip'
  );
});

test('materials archive keeps documents and attachments in a ZIP stream', async (t) => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'presentation-materials-'));
  const imageDir = path.join(sourceDir, 'images');
  fs.mkdirSync(imageDir);
  fs.writeFileSync(path.join(sourceDir, 'lesson.md'), '# 교육자료');
  fs.writeFileSync(path.join(imageDir, 'diagram.txt'), 'diagram');
  fs.writeFileSync(path.join(sourceDir, '.private.md'), 'hidden');

  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));

  const archive = createMaterialsZipArchive(sourceDir);
  const chunks = [];
  archive.on('data', chunk => chunks.push(chunk));

  const completed = new Promise((resolve, reject) => {
    archive.once('end', resolve);
    archive.once('error', reject);
  });

  await archive.finalize();
  await completed;

  const zip = Buffer.concat(chunks);
  assert.ok(zip.length > 100);
  assert.deepEqual(Array.from(zip.subarray(0, 4)), [0x50, 0x4b, 0x03, 0x04]);
  assert.equal(zip.includes(Buffer.from('lesson.md')), true);
  assert.equal(zip.includes(Buffer.from('images/diagram.txt')), true);
  assert.equal(zip.includes(Buffer.from('.private.md')), false);
});
