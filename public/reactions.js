(() => {
  const player = document.querySelector('.player');
  if (!player || typeof db === 'undefined') return;

  const EMOJIS = ['👍', '❤️', '😂', '😮', '👏', '🔥'];
  const reactionsRef = db.ref(ROOM_PATH).child('reactions');
  const startedAt = Date.now();

  const stage = document.createElement('div');
  stage.className = 'reaction-stage';
  player.appendChild(stage);

  function spawnEmoji(emoji) {
    const el = document.createElement('span');
    el.className = 'reaction-emoji';
    el.textContent = emoji;
    el.style.left = (10 + Math.random() * 75) + '%';
    el.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
    stage.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  reactionsRef.on('child_added', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    const age = Date.now() - (data.ts || startedAt);
    if (age > 6000) {
      snapshot.ref.remove().catch(() => {});
      return;
    }
    spawnEmoji(data.emoji);
  });

  function sendReaction(emoji) {
    const ref = reactionsRef.push();
    ref.set({ emoji, ts: firebase.database.ServerValue.TIMESTAMP }).then(() => {
      setTimeout(() => ref.remove().catch(() => {}), 4000);
    });
  }

  if (document.body.dataset.page === 'watch') {
    const panel = document.createElement('div');
    panel.className = 'reaction-panel';

    const menu = document.createElement('div');
    menu.className = 'reaction-menu';
    EMOJIS.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = emoji;
      btn.setAttribute('aria-label', 'Reaccionar con ' + emoji);
      btn.addEventListener('click', () => {
        sendReaction(emoji);
        menu.classList.remove('open');
      });
      menu.appendChild(btn);
    });

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'reaction-toggle';
    toggle.setAttribute('aria-label', 'Reaccionar');
    toggle.textContent = '😀';
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target)) menu.classList.remove('open');
    });

    panel.append(menu, toggle);
    player.appendChild(panel);
  }
})();
