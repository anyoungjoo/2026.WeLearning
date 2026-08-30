import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMediaEndpoint, resolveSessionUrl } from '../public/js/screenShare.js';

test('MediaMTX endpoint normalizes slashes and encodes path segments', () => {
  assert.equal(
    buildMediaEndpoint('http://localhost:8889/', '/교육/presentation/', 'whip'),
    'http://localhost:8889/%EA%B5%90%EC%9C%A1/presentation/whip'
  );
});

test('MediaMTX endpoint rejects unknown protocol', () => {
  assert.throws(
    () => buildMediaEndpoint('http://localhost:8889', 'presentation', 'rtmp'),
    /지원하지 않는 WebRTC 연결 방식/
  );
});

test('relative MediaMTX session location resolves from negotiation endpoint', () => {
  assert.equal(
    resolveSessionUrl('../session/abc', 'http://localhost:8889/presentation/whip'),
    'http://localhost:8889/session/abc'
  );
});
