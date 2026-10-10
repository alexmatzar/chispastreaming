const localVideo = document.getElementById('localVideo');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');

let localStream = null;
let viewersRef = null;
const peers = new Map();

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

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

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

  localVideo.srcObject = localStream;

  viewersRef = db.ref(ROOM_PATH).child('viewers');

  viewersRef.onDisconnect().remove();

  viewersRef.on('child_added', (snapshot) => addViewer(snapshot.key));
  viewersRef.on('child_removed', (snapshot) => removeViewer(snapshot.key));

  setStatus('Transmitiendo a 0 receptor(es). Esperando conexiones...');
  stopBtn.disabled = false;
}

async function stop() {
  stopBtn.disabled = true;

  if (viewersRef) viewersRef.off();
  [...peers.keys()].forEach(removeViewer);

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
  localVideo.srcObject = null;

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
