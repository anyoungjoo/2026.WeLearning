/**
 * 문서 이미지가 로드되거나 실패할 때까지 기다립니다.
 * 화면 아래쪽 이미지나 끊어진 파일 하나가 전체 문서를 영원히 붙잡지 않도록
 * 취소 신호와 제한 시간을 항상 적용합니다.
 */
export function waitForImagesToSettle(images, { signal, timeoutMs = 4000 } = {}) {
  const pendingImages = new Set(Array.from(images || []).filter(image => !image.complete));
  if (pendingImages.size === 0) {
    return Promise.resolve({ status: 'completed', pendingCount: 0 });
  }
  if (signal?.aborted) {
    return Promise.resolve({ status: 'aborted', pendingCount: pendingImages.size });
  }

  return new Promise(resolve => {
    const listeners = new Map();
    let finished = false;
    let timerId = null;

    const cleanupImage = image => {
      const listener = listeners.get(image);
      if (!listener) return;
      image.removeEventListener('load', listener);
      image.removeEventListener('error', listener);
      listeners.delete(image);
    };

    const finish = status => {
      if (finished) return;
      finished = true;
      if (timerId !== null) clearTimeout(timerId);
      signal?.removeEventListener('abort', handleAbort);
      listeners.forEach((listener, image) => cleanupImage(image));
      resolve({ status, pendingCount: pendingImages.size });
    };

    const handleAbort = () => finish('aborted');
    const settleImage = image => {
      cleanupImage(image);
      pendingImages.delete(image);
      if (pendingImages.size === 0) finish('completed');
    };

    const safeTimeout = Number.isFinite(timeoutMs) ? Math.max(0, timeoutMs) : 4000;
    signal?.addEventListener('abort', handleAbort, { once: true });
    timerId = setTimeout(() => finish('timeout'), safeTimeout);
    if (signal?.aborted) {
      finish('aborted');
      return;
    }

    pendingImages.forEach(image => {
      const listener = () => settleImage(image);
      listeners.set(image, listener);
      image.addEventListener('load', listener, { once: true });
      image.addEventListener('error', listener, { once: true });
      // complete 검사 직후 이벤트가 끝난 경합 상황도 놓치지 않습니다.
      if (image.complete) settleImage(image);
    });
  });
}
