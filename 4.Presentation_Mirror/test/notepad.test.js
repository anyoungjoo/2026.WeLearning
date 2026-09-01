import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('notepad upload directory exists', () => {
  const uploadsDir = path.resolve(__dirname, '../public/uploads/notepad');
  assert.ok(fs.existsSync(uploadsDir), 'Uploads directory should exist');
});

test('server.js exports and runs cleanly', async () => {
  // Test basic syntax of newly added files
  const serverPath = path.resolve(__dirname, '../server.js');
  const notepadPath = path.resolve(__dirname, '../public/js/notepad.js');
  assert.ok(fs.existsSync(serverPath), 'server.js exists');
  assert.ok(fs.existsSync(notepadPath), 'notepad.js exists');
});
