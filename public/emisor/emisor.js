const localVideo = document.getElementById('localVideo');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const shareBtn = document.getElementById('shareBtn');
const statusEl = document.getElementById('status');
const canvas = document.getElementById('composeCanvas');
const canvasCtx = canvas.getContext('2d');

let localStream = null;
let screenStream = null;
let screenVideoEl = null;
let canvasStream = null;
let composeRaf = null;
let activeVideoTrack = null;
let viewersRef = null;
const peers = new Map();

const PIP_W = 240;
const PIP_H = 135;
const PIP_MARGIN = 24;
let pipX = PIP_MARGIN;
let pipY = PIP_MARGIN;
let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

function setStatus(text) {
  statusEl.textContent = text;
}

function updateStatus() {
  const connected = [...peers.values()].filter((p) => p.pc.connectionState === 'connected').length;
  setStatus(`Transmitiendo a ${connected} receptor(es). Esperando más conexiones...`);
}

function addCandidate(peer, candidate) {
  if (!peer.pc.remoteDescription) {
    peer.pending.push(candidate);
    return;
  }
  peer.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
}

async function addViewer(id) {
  if (!localStream || peers.has(id)) return;

  const base = viewersRef.child(id);
  const pc = new RTCPeerConnection(RTC_CONFIG);
  const peer = { pc, base, pending: [] };
  peers.set(id, peer);

  pc.addTrack(activeVideoTrack, localStream);
  localStream.getAudioTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      base.child('callerCandidates').push(event.candidate.toJSON());
    }
  };

  pc.onconnectionstatechange = () => {

    if (pc.connectionState === 'failed') base.remove();
    updateStatus();
  };

  await Promise.all(
    ['offer', 'answer', 'callerCandidates', 'calleeCandidates'].map((key) => base.child(key).remove())
  );
  if (peers.get(id) !== peer) return;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await base.child('offer').set({ type: offer.type, sdp: offer.sdp });

  base.child('answer').on('value', async (snapshot) => {
    const answer = snapshot.val();
    if (answer && !pc.remoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      peer.pending.splice(0).forEach((c) => addCandidate(peer, c));
    }
  });

  base.child('calleeCandidates').on('child_added', (snapshot) => {
    const candidate = snapshot.val();
    if (candidate) addCandidate(peer, candidate);
  });
}

function removeViewer(id) {
  const peer = peers.get(id);
  if (!peer) return;
  peers.delete(id);
  peer.base.child('answer').off();
  peer.base.child('calleeCandidates').off();
  peer.pc.close();
  updateStatus();
}

async function start() {
  startBtn.disabled = true;
  setStatus('Solicitando acceso a cámara y micrófono...');

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (err) {
    setStatus('Error al acceder a cámara/micrófono: ' + err.message);
    startBtn.disabled = false;
    return;
  }

  activeVideoTrack = localStream.getVideoTracks()[0];
  localVideo.srcObject = localStream;

  viewersRef = db.ref(ROOM_PATH).child('viewers');

  viewersRef.onDisconnect().remove();

  viewersRef.on('child_added', (snapshot) => addViewer(snapshot.key));
  viewersRef.on('child_removed', (snapshot) => removeViewer(snapshot.key));

  setStatus('Transmitiendo a 0 receptor(es). Esperando conexiones...');
  stopBtn.disabled = false;
  shareBtn.disabled = false;
}

function replaceVideoTrack(newTrack) {
  activeVideoTrack = newTrack;
  peers.forEach((peer) => {
    const sender = peer.pc.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (sender) sender.replaceTrack(newTrack);
  });
}

function drawCover(video, x, y, w, h) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;
  const scale = Math.max(w / vw, h / vh);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  canvasCtx.drawImage(video, sx, sy, sw, sh, x, y, w, h);
}

function drawFrame() {
  if (!screenStream) return;

  drawCover(screenVideoEl, 0, 0, canvas.width, canvas.height);

  canvasCtx.save();
  canvasCtx.beginPath();
  canvasCtx.rect(pipX, pipY, PIP_W, PIP_H);
  canvasCtx.clip();
  drawCover(localVideo, pipX, pipY, PIP_W, PIP_H);
  canvasCtx.restore();

  canvasCtx.lineWidth = 4;
  canvasCtx.strokeStyle = '#ffb627';
  canvasCtx.strokeRect(pipX, pipY, PIP_W, PIP_H);

  composeRaf = requestAnimationFrame(drawFrame);
}

function getCanvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const point = evt.touches ? evt.touches[0] : evt;
  return {
    x: (point.clientX - rect.left) * (canvas.width / rect.width),
    y: (point.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function withinPip(x, y) {
  return x >= pipX && x <= pipX + PIP_W && y >= pipY && y <= pipY + PIP_H;
}

function dragStart(evt) {
  if (!screenStream) return;
  const { x, y } = getCanvasPos(evt);
  if (!withinPip(x, y)) return;
  dragging = true;
  dragOffsetX = x - pipX;
  dragOffsetY = y - pipY;
  canvas.style.cursor = 'grabbing';
  evt.preventDefault();
}

function dragMove(evt) {
  if (!dragging) return;
  const { x, y } = getCanvasPos(evt);
  pipX = Math.min(Math.max(0, x - dragOffsetX), canvas.width - PIP_W);
  pipY = Math.min(Math.max(0, y - dragOffsetY), canvas.height - PIP_H);
  evt.preventDefault();
}

function dragEnd() {
  dragging = false;
  if (screenStream) canvas.style.cursor = 'grab';
}

canvas.addEventListener('mousedown', dragStart);
canvas.addEventListener('mousemove', (evt) => {
  if (dragging || !screenStream) return;
  const { x, y } = getCanvasPos(evt);
  canvas.style.cursor = withinPip(x, y) ? 'grab' : 'default';
});
window.addEventListener('mousemove', dragMove);
window.addEventListener('mouseup', dragEnd);
canvas.addEventListener('touchstart', dragStart, { passive: false });
window.addEventListener('touchmove', dragMove, { passive: false });
window.addEventListener('touchend', dragEnd);

async function startShare() {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  } catch (err) {
    return;
  }

  const screenTrack = screenStream.getVideoTracks()[0];
  screenTrack.onended = stopShare;

  screenVideoEl = document.createElement('video');
  screenVideoEl.muted = true;
  screenVideoEl.playsInline = true;
  screenVideoEl.srcObject = screenStream;
  await screenVideoEl.play();

  pipX = PIP_MARGIN;
  pipY = PIP_MARGIN;
  localVideo.style.opacity = '0';
  canvas.style.display = 'block';
  canvas.style.cursor = 'default';

  canvasStream = canvas.captureStream(30);
  replaceVideoTrack(canvasStream.getVideoTracks()[0]);

  drawFrame();
  shareBtn.textContent = 'Dejar de compartir';
}

function stopShare() {
  if (!screenStream) return;

  cancelAnimationFrame(composeRaf);
  screenStream.getTracks().forEach((track) => track.stop());
  screenStream = null;

  if (screenVideoEl) {
    screenVideoEl.srcObject = null;
    screenVideoEl = null;
  }
  if (canvasStream) {
    canvasStream.getTracks().forEach((track) => track.stop());
    canvasStream = null;
  }

  canvas.style.display = 'none';
  canvas.style.cursor = '';
  localVideo.style.opacity = '';
  replaceVideoTrack(localStream.getVideoTracks()[0]);
  shareBtn.textContent = 'Compartir pantalla';
}

async function stop() {
  stopBtn.disabled = true;
  shareBtn.disabled = true;

  if (screenStream) stopShare();

  if (viewersRef) viewersRef.off();
  [...peers.keys()].forEach(removeViewer);

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
  activeVideoTrack = null;
  localVideo.srcObject = null;
  shareBtn.textContent = 'Compartir pantalla';

  if (viewersRef) {
    await viewersRef.onDisconnect().cancel();
    await viewersRef.remove();
    viewersRef = null;
  }

  setStatus('Transmisión detenida.');
  startBtn.disabled = false;
}

startBtn.addEventListener('click', start);
stopBtn.addEventListener('click', stop);
shareBtn.addEventListener('click', () => {
  if (screenStream) stopShare();
  else startShare();
});
