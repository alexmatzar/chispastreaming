(() => {
  const log = document.getElementById('chatLog');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const count = document.querySelectorAll('.viewer-count');
  const colors = ['#ffb627', '#ff4d8d', '#2de0a5', '#8466ff'];

  function guestName() {
    let name = sessionStorage.getItem('chispa_guest_name');
    if (!name) {
      name = 'Invitado' + Math.floor(1000 + Math.random() * 9000);
      sessionStorage.setItem('chispa_guest_name', name);
    }
    return name;
  }

  function add(user, text, me) {
    if (!log) return;
    const row = document.createElement('div');
    row.className = 'msg' + (me ? ' me' : '');
    const b = document.createElement('b');
    b.textContent = me ? 'Tú' : user;
    b.style.color = me ? 'var(--jade)' : colors[user.length % colors.length];
    row.append(b, document.createTextNode(text));
    log.appendChild(row);
    while (log.children.length > 80) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  if (log && typeof db !== 'undefined') {
    const myName = guestName();
    const chatRef = db.ref(ROOM_PATH).child('chat');

    chatRef.limitToLast(50).on('child_added', (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.text) return;
      add(data.user, data.text, data.user === myName);
    });

    if (document.body.dataset.page === 'watch' && form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const t = input.value.trim();
        if (!t) return;
        chatRef.push().set({ user: myName, text: t, ts: firebase.database.ServerValue.TIMESTAMP });
        input.value = '';
      });
    } else if (form) {
      form.hidden = true;
    }
  }

  let viewers = 128;
  setInterval(() => {
    viewers = Math.max(20, viewers + Math.round((Math.random() - 0.45) * 6));
    count.forEach((el) => (el.textContent = viewers));
  }, 3000);
})();
