import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyVideoCodecPreference,
  buildDisplayMediaOptions,
  buildMediaEndpoint,
  resolveSessionUrl,
  SCREEN_SHARE_FRAME_RATE,
  sortVideoCodecsByPreference
} from '../public/js/screenShare.js';

test('screen capture preserves source resolution and limits video to 15fps', () => {
  const options = buildDisplayMediaOptions();

  assert.equal(SCREEN_SHARE_FRAME_RATE, 15);
  assert.deepEqual(options.video.frameRate, { ideal: 15, max: 15 });
  assert.equal('width' in options.video, false);
  assert.equal('height' in options.video, false);
});

test('screen share prefers VP9 with VP8 and H264 fallbacks', () => {
  const codecs = [
    { mimeType: 'video/VP8' },
    { mimeType: 'video/rtx' },
    { mimeType: 'video/H264', sdpFmtpLine: 'profile-level-id=42e01f' },
    { mimeType: 'video/AV1' },
    { mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=0' },
    { mimeType: 'video/red' }
  ];

  const sorted = sortVideoCodecsByPreference(codecs);

  assert.deepEqual(
    sorted.map(codec => codec.mimeType),
    ['video/VP9', 'video/VP8', 'video/H264', 'video/AV1', 'video/rtx', 'video/red']
  );
  assert.equal(sorted.find(codec => codec.mimeType === 'video/rtx'), codecs[1]);
});

test('codec preference keeps browser recovery codecs and degrades gracefully', () => {
  let appliedCodecs = null;
  const transceiver = {
    setCodecPreferences(codecs) {
      appliedCodecs = codecs;
    }
  };
  const capabilities = {
    codecs: [
      { mimeType: 'video/VP8' },
      { mimeType: 'video/rtx' },
      { mimeType: 'video/VP9' }
    ]
  };

  assert.equal(applyVideoCodecPreference(transceiver, capabilities), true);
  assert.deepEqual(
    appliedCodecs.map(codec => codec.mimeType),
    ['video/VP9', 'video/VP8', 'video/rtx']
  );
  assert.equal(applyVideoCodecPreference({}, capabilities), false);
  assert.equal(applyVideoCodecPreference(transceiver, null), false);
});

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
