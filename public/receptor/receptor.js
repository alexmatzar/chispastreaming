const remoteVideo = document.getElementById('remoteVideo');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const statusEl = document.getElementById('status');

let pc = null;
let base = null;
let wantConnected = false;
let session = 0;
let pendingCandidates = [];

function setStatus(text) {
  statusEl.textContent = text;
}

async function join() {
  const mySession = ++session;
  const myPc = new RTCPeerConnection(RTC_CONFIG);
  const myBase = db.ref(ROOM_PATH).child('viewers').child(db.ref().push().key);
  pc = myPc;
  base = myBase;
  pendingCandidates = [];
  let answered = false;

  setStatus('Buscando emisor activo...');

  myPc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
    setStatus('Recibiendo transmisión.');
  };

  myPc.onconnectionstatechange = () => {
    if (mySession !== session) return;
    setStatus('Estado de conexión: ' + myPc.connectionState);
    if (myPc.connectionState === 'failed') rejoin();
  };

  myPc.onicecandidate = (event) => {
    if (event.candidate) {
      myBase.child('calleeCandidates').push(event.candidate.toJSON());
    }
  };

  myBase.child('offer').on('value', async (snapshot) => {
    const offer = snapshot.val();
    if (!offer || answered || mySession !== session) return;
    answered = true;

    await myPc.setRemoteDescription(new RTCSessionDescription(offer));
    pendingCandidates.splice(0).forEach((c) => myPc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}));

    const answer = await myPc.createAnswer();
    await myPc.setLocalDescription(answer);
    await myBase.child('answer').set({ type: answer.type, sdp: answer.sdp });

    setStatus('Respuesta enviada. Conectando con el emisor...');
  });

  myBase.child('callerCandidates').on('child_added', (snapshot) => {
    const candidate = snapshot.val();
    if (!candidate || mySession !== session) return;
    if (myPc.remoteDescription) {
      myPc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    } else {
      pendingCandidates.push(candidate);
    }
  });

  await myBase.onDisconnect().remove();
  if (mySession !== session) return;
  await myBase.child('joinedAt').set(firebase.database.ServerValue.TIMESTAMP);
  if (mySession !== session) {
    myBase.remove();
    return;
  }

  myBase.child('joinedAt').on('value', (snapshot) => {
    if (!snapshot.exists() && mySession === session && wantConnected) rejoin();
  });
}

function teardown() {
  session++;

  if (base) {
    base.child('offer').off();
    base.child('callerCandidates').off();
    base.child('joinedAt').off();
    base.onDisconnect().cancel();
    base.remove();
    base = null;
  }

  if (pc) {
    pc.close();
    pc = null;
  }

  remoteVideo.srcObject = null;
}

function rejoin() {
  teardown();
  if (!wantConnected) return;
  setStatus('Emisor no disponible. Esperando que transmita...');
  const mySession = session;
  setTimeout(() => {
    if (wantConnected && mySession === session) join();
  }, 1000);
}

function connect() {
  connectBtn.disabled = true;
  wantConnected = true;
  join();
  disconnectBtn.disabled = false;
}

function disconnect() {
  disconnectBtn.disabled = true;
  wantConnected = false;
  teardown();
  setStatus('Desconectado.');
  connectBtn.disabled = false;
}

connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);
