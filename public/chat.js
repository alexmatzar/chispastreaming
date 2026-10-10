(() => {
  const log = document.getElementById('chatLog');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const count = document.querySelectorAll('.viewer-count');
  const colors = ['#ffb627', '#ff4d8d', '#2de0a5', '#8466ff'];
  const users = ['Neftali', 'Gerson', 'ClaudiaTax', 'Elvia', 'Astrid', 'Zulema', 'AldoPablo', 'Isidro', 'Xela_fan', 'Chapin502'];
  const lines = ['Qué buen stream 🔥', 'Saludos desde Guate 🇬🇹', 'se escucha perfecto', 'F por el que llegó tarde', 'jajaja eso estuvo bueno', 'qué cámara usan?', 'primera vez aquí, me quedo ⚡', 'subtítulos porfa 🙏', 'GG', 'el audio está genial'];

  function add(user, text, me) {
    if (!log) return;
    const row = document.createElement('div');
    row.className = 'msg' + (me ? ' me' : '');
    const b = document.createElement('b');
    b.textContent = user;
    b.style.color = me ? 'var(--jade)' : colors[user.length % colors.length];
    row.append(b, document.createTextNode(text));
    log.appendChild(row);
    while (log.children.length > 80) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  if (log) {
    add('Chispa', 'Bienvenid@ al chat, sé amable ⚡');
    setInterval(() => add(pick(users), pick(lines)), 2800);
  }
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = input.value.trim();
      if (t) add('Tú', t, true);
      input.value = '';
    });
  }

  let viewers = 128;
  setInterval(() => {
    viewers = Math.max(20, viewers + Math.round((Math.random() - 0.45) * 6));
    count.forEach((el) => (el.textContent = viewers));
  }, 3000);
})();
