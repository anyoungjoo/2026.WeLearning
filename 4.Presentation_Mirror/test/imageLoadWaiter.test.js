import test from 'node:test';
import assert from 'node:assert/strict';

import { waitForImagesToSettle } from '../public/js/imageLoadWaiter.js';

class FakeImage extends EventTarget {
  constructor(complete = false) {
    super();
    this.complete = complete;
  }

  settle(type) {
    this.complete = true;
    this.dispatchEvent(new Event(type));
  }
}

test('image waiting finishes after both successful and failed image requests settle', async () => {
  const loadedImage = new FakeImage();
  const failedImage = new FakeImage();
  const waiting = waitForImagesToSettle([loadedImage, failedImage], { timeoutMs: 100 });

  loadedImage.settle('load');
  failedImage.settle('error');

  assert.deepEqual(await waiting, { status: 'completed', pendingCount: 0 });
});

test('image waiting ignores images that were already complete', async () => {
  const result = await waitForImagesToSettle([new FakeImage(true)], { timeoutMs: 10 });

  assert.deepEqual(result, { status: 'completed', pendingCount: 0 });
});

test('image waiting catches an image that completes while listeners are being attached', async () => {
  const racingImage = new FakeImage();
  const originalAddEventListener = racingImage.addEventListener.bind(racingImage);
  racingImage.addEventListener = (...args) => {
    originalAddEventListener(...args);
    racingImage.complete = true;
  };

  const result = await waitForImagesToSettle([racingImage], { timeoutMs: 100 });

  assert.deepEqual(result, { status: 'completed', pendingCount: 0 });
});

test('image waiting has bounded timeout and document-change cancellation', async () => {
  const timeoutResult = await waitForImagesToSettle([new FakeImage()], { timeoutMs: 5 });
  assert.deepEqual(timeoutResult, { status: 'timeout', pendingCount: 1 });

  const controller = new AbortController();
  const waiting = waitForImagesToSettle([new FakeImage()], {
    signal: controller.signal,
    timeoutMs: 100
  });
  controller.abort();

  assert.deepEqual(await waiting, { status: 'aborted', pendingCount: 1 });
});
