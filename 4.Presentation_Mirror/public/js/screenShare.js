/**
 * Desktop screen sharing over MediaMTX WHIP/WHEP.
 *
 * The module owns capture permission, WebRTC negotiation, MediaMTX session
 * cleanup, and the presenter/viewer peer lifecycles. Socket.IO remains the
 * control plane and never carries video frames.
 */

const ICE_GATHERING_TIMEOUT_MS = 8000;

export function buildMediaEndpoint(baseUrl, mediaPath, protocol) {
  const normalizedBase = String(baseUrl || '').replace(/\/+$/, '');
  const normalizedPath = String(mediaPath || 'presentation')
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');

  if (!normalizedBase) {
    throw new Error('MediaMTX 접속 주소가 설정되지 않았습니다.');
  }
  if (!['whip', 'whep'].includes(protocol)) {
    throw new Error(`지원하지 않는 WebRTC 연결 방식입니다: ${protocol}`);
  }

  return `${normalizedBase}/${normalizedPath}/${protocol}`;
}

export function resolveSessionUrl(location, endpoint) {
  if (!location) return null;
  return new URL(location, endpoint).toString();
}

function waitForIceGatheringComplete(peer, timeoutMs = ICE_GATHERING_TIMEOUT_MS) {
  if (peer.iceGatheringState === 'complete') return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('WebRTC 네트워크 후보 수집 시간이 초과되었습니다.'));
    }, timeoutMs);

    const handleStateChange = () => {
      if (peer.iceGatheringState === 'complete') {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      peer.removeEventListener('icegatheringstatechange', handleStateChange);
    };

    peer.addEventListener('icegatheringstatechange', handleStateChange);
  });
}

async function negotiateSession(peer, endpoint) {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  await waitForIceGatheringComplete(peer);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sdp'
    },
    body: peer.localDescription.sdp
  });

  if (!response.ok) {
    const detail = (await response.text()).trim();
    const error = new Error(detail || `MediaMTX 연결에 실패했습니다. (HTTP ${response.status})`);
    error.status = response.status;
    throw error;
  }

  const answerSdp = await response.text();
  await peer.setRemoteDescription({ type: 'answer', sdp: answerSdp });

  return resolveSessionUrl(response.headers.get('Location'), endpoint);
}

async function deleteSession(sessionUrl) {
  if (!sessionUrl) return;

  try {
    await fetch(sessionUrl, { method: 'DELETE', keepalive: true });
  } catch (error) {
    console.warn('MediaMTX 세션 정리 실패:', error);
  }
}

export class ScreenShareManager {
  constructor({ videoElement, onCaptureEnded, onStateChange } = {}) {
    this.videoElement = videoElement || null;
    this.onCaptureEnded = onCaptureEnded || (() => {});
    this.onStateChange = onStateChange || (() => {});

    this.config = null;
    this.publisher = null;
    this.viewer = null;
    this.isStoppingPublisher = false;
  }

  setConfig(config) {
    this.config = config;
  }

  getEndpoint(protocol) {
    if (!this.config) {
      throw new Error('화면 공유 설정을 아직 불러오지 못했습니다.');
    }
    return buildMediaEndpoint(this.config.baseUrl, this.config.path, protocol);
  }

  async startPublishing() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('이 브라우저는 전체 화면 공유를 지원하지 않습니다. 최신 Chrome 또는 Edge를 사용해 주세요.');
    }

    await this.stopPublishing();
    this.onStateChange({ role: 'presenter', state: 'requesting' });

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor',
        width: { ideal: 1920 },
        frameRate: { ideal: 15, max: 30 }
      },
      audio: false,
      monitorTypeSurfaces: 'include',
      selfBrowserSurface: 'exclude',
      surfaceSwitching: 'include'
    });

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      stream.getTracks().forEach(track => track.stop());
      throw new Error('공유할 화면 영상 트랙을 가져오지 못했습니다.');
    }

    try {
      videoTrack.contentHint = 'detail';
    } catch {
      // contentHint is an optional browser optimization.
    }

    this.isStoppingPublisher = false;
    videoTrack.addEventListener('ended', () => {
      if (!this.isStoppingPublisher) this.onCaptureEnded();
    }, { once: true });

    const peer = new RTCPeerConnection(this.config?.peerConnection || {});
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.addEventListener('connectionstatechange', () => {
      const state = peer.connectionState;
      if (state === 'failed') {
        this.onStateChange({ role: 'presenter', state: 'error', message: '화면 송출 연결이 끊겼습니다.' });
      }
    });

    this.publisher = { peer, stream, sessionUrl: null };
    this.onStateChange({ role: 'presenter', state: 'connecting' });

    try {
      this.publisher.sessionUrl = await negotiateSession(peer, this.getEndpoint('whip'));
      this.onStateChange({ role: 'presenter', state: 'live' });
      return stream;
    } catch (error) {
      await this.stopPublishing();
      throw error;
    }
  }

  async stopPublishing() {
    const publisher = this.publisher;
    if (!publisher) return;

    this.isStoppingPublisher = true;
    this.publisher = null;

    publisher.stream.getTracks().forEach(track => track.stop());
    publisher.peer.close();
    await deleteSession(publisher.sessionUrl);

    this.isStoppingPublisher = false;
    this.onStateChange({ role: 'presenter', state: 'idle' });
  }

  async startViewing() {
    await this.stopViewing();

    const peer = new RTCPeerConnection(this.config?.peerConnection || {});
    const remoteStream = new MediaStream();
    peer.addTransceiver('video', { direction: 'recvonly' });

    peer.addEventListener('track', (event) => {
      const incomingTracks = event.streams[0]?.getTracks() || [event.track];
      incomingTracks.forEach(track => {
        if (!remoteStream.getTracks().some(existing => existing.id === track.id)) {
          remoteStream.addTrack(track);
        }
      });

      if (this.videoElement) {
        this.videoElement.srcObject = remoteStream;
        this.videoElement.play().catch(() => {
          // Autoplay can be blocked until the user interacts; the video remains ready.
        });
      }
    });

    peer.addEventListener('connectionstatechange', () => {
      const state = peer.connectionState;
      if (state === 'failed') {
        this.onStateChange({ role: 'viewer', state: 'error', message: '강사 화면 연결이 끊겼습니다.' });
      }
    });

    this.viewer = { peer, stream: remoteStream, sessionUrl: null };
    this.onStateChange({ role: 'viewer', state: 'connecting' });

    try {
      this.viewer.sessionUrl = await negotiateSession(peer, this.getEndpoint('whep'));
      this.onStateChange({ role: 'viewer', state: 'live' });
      return remoteStream;
    } catch (error) {
      await this.stopViewing();
      throw error;
    }
  }

  async stopViewing() {
    const viewer = this.viewer;
    if (!viewer) return;

    this.viewer = null;
    viewer.peer.close();
    viewer.stream.getTracks().forEach(track => track.stop());
    await deleteSession(viewer.sessionUrl);

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
    }
    this.onStateChange({ role: 'viewer', state: 'idle' });
  }

  async stopAll() {
    await Promise.all([this.stopPublishing(), this.stopViewing()]);
  }
}
