const firebaseConfig = {
  apiKey: "AIzaSyDxlRv_5wkaRxdpMxqUvoji0LTUwG0xAnk",
  authDomain: "webrtctest-2920a.firebaseapp.com",
  databaseURL: "https://webrtctest-2920a-default-rtdb.firebaseio.com",
  projectId: "webrtctest-2920a",
  storageBucket: "webrtctest-2920a.firebasestorage.app",
  messagingSenderId: "409304841056",
  appId: "1:409304841056:web:f8def3911badcda08d3c05",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const ROOM_PATH = "rooms/main";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};
