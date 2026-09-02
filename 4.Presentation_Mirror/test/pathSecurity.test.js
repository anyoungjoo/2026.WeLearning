import test from 'node:test';
import assert from 'node:assert/strict';

import { isPathWithinBase } from '../pathSecurity.js';

test('materials paths remain inside the configured base directory', () => {
  const baseDir = '/tmp/presentation-materials';

  assert.equal(isPathWithinBase(baseDir, 'course/lesson.md'), true);
  assert.equal(isPathWithinBase(baseDir, './lesson.md'), true);
  assert.equal(isPathWithinBase(baseDir, '../presentation-materials-private/secret.md'), false);
  assert.equal(isPathWithinBase(baseDir, '../../etc/passwd'), false);
  assert.equal(isPathWithinBase(baseDir, '/etc/passwd'), false);
});
