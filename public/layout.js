const ICONS = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  live: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.5"/><path d="M7.5 7.5a6 6 0 0 0 0 9M16.5 7.5a6 6 0 0 1 0 9M4.5 4.5a10 10 0 0 0 0 15M19.5 4.5a10 10 0 0 1 0 15"/></svg>',
  studio: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10l5-3v10l-5-3"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>',
  video: '<svg viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5z"/><rect x="1" y="5" width="15" height="14" rx="3"/></svg>',
};

const CHANNELS = [
  { id: 'chispa', name: 'Estudio Chispa', game: 'En vivo · Cámara real', cat: 'Charlas', emoji: '⚡', viewers: 128, c1: '#ffb627', c2: '#ff4d8d', href: '/receptor', title: 'Transmisión en vivo de la comunidad' },
  { id: 'neftali', name: 'Neftalí Andrade', game: 'Arte digital', cat: 'Arte', emoji: '🎨', viewers: 842, c1: '#8466ff', c2: '#2de0a5', title: 'Pintando un mural de jaguares' },
  { id: 'gerson', name: 'Gerson Morales', game: 'Música en vivo', cat: 'Música', emoji: '🎧', viewers: 2310, c1: '#ff4d8d', c2: '#8466ff', title: 'Cumbia electrónica sin parar' },
  { id: 'claudia', name: 'Claudia Tax', game: 'Cocina', cat: 'Cocina', emoji: '🌮', viewers: 539, c1: '#ffb627', c2: '#2de0a5', title: 'Tamales de chipilín desde cero' },
  { id: 'elvia', name: 'Elvia.dev', game: 'Programación', cat: 'Tecnología', emoji: '💻', viewers: 1204, c1: '#2de0a5', c2: '#8466ff', title: 'Construyendo un bot en C# AOT' },
  { id: 'astrid', name: 'AstridFC', game: 'Deportes', cat: 'Deportes', emoji: '⚽', viewers: 3977, c1: '#ff4d8d', c2: '#ffb627', title: 'Análisis post partido' },
  { id: 'zulema', name: 'Zulema la Maga', game: 'Juegos de mesa', cat: 'Juegos', emoji: '🎲', viewers: 316, c1: '#8466ff', c2: '#ffb627', title: 'Campaña de rol, sesión 12' },
  { id: 'aldo', name: 'Aldo Pablo', game: 'Charlas', cat: 'Charlas', emoji: '☁️', viewers: 97, c1: '#2de0a5', c2: '#ffb627', title: 'Charla tranquila + lo-fi' },
  { id: 'isidro', name: 'Isidro Speedruns', game: 'Juegos retro', cat: 'Juegos', emoji: '🕹️', viewers: 655, c1: '#ffb627', c2: '#8466ff', title: 'Speedrun de plataformas clásicas' },
];
const CATEGORIES = ['Todo', 'Charlas', 'Música', 'Arte', 'Cocina', 'Tecnología', 'Deportes', 'Juegos'];
const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + ' mil' : String(n));

function avatar(ch, big) {
  return `<span class="avatar${big ? ' lg' : ''}" style="--c1:${ch.c1};--c2:${ch.c2}">${ch.name[0]}</span>`;
}

function channelCard(ch) {
  const href = ch.href || '#';
  return `<a class="stream-card" href="${href}" ${ch.href ? '' : 'data-sim="1"'}>
    <div class="thumb" style="--c1:${ch.c1};--c2:${ch.c2}">${ch.emoji}
      <span class="badge-live">EN VIVO</span>
      <span class="viewers">${ICONS.eye} ${fmt(ch.viewers)}</span>
    </div>
    <div class="card-body">${avatar(ch)}<div><h3>${ch.title}</h3><p>${ch.name} · ${ch.game}</p></div></div>
  </a>`;
}

function buildShell() {
  const page = document.body.dataset.page;
  const link = (href, key, icon, label) =>
    `<a class="nav-link${page === key ? ' active' : ''}" href="${href}">${ICONS[icon]}<span>${label}</span></a>`;

  const top = document.getElementById('topbar');
  if (top) {
    top.innerHTML = `
      <a class="brand" href="/"><span class="brand-mark">${ICONS.spark}</span><span class="brand-name">Chispa</span></a>
      <label class="search">${ICONS.search}<input type="search" id="searchInput" placeholder="Buscar canales y categorías" aria-label="Buscar" /></label>
      <span class="avatar avatar-btn" style="--c1:#2de0a5;--c2:#8466ff" title="Tu perfil">Tú</span>`;
  }
  const side = document.getElementById('sidebar');
  if (side) {
    side.innerHTML = `
      <div class="nav-title">Menú</div>
      ${link('/', 'home', 'home', 'Inicio')}
      ${link('/receptor', 'watch', 'live', 'Ver en vivo')}
      ${link('/emisor', 'studio', 'studio', 'Transmitir')}
      <div class="nav-title">Canales recomendados</div>
      ${CHANNELS.slice(1, 6).map((c) => `<a class="nav-channel" href="#" data-sim="1">${avatar(c)}<div class="meta"><b>${c.name}</b><small>${c.game}</small></div><span class="dot-live"></span></a>`).join('')}`;
  }

  document.addEventListener('click', (e) => {
    const sim = e.target.closest('[data-sim]');
    if (!sim) return;
    e.preventDefault();
  });
}

function watchPlayers() {
  document.querySelectorAll('.player video').forEach((video) => {
    const player = video.closest('.player');
    const sync = () => player.classList.toggle('is-live', !!video.srcObject && video.readyState > 1);
    ['playing', 'loadeddata', 'emptied', 'pause', 'ended'].forEach((ev) => video.addEventListener(ev, sync));
    sync();
  });
}

buildShell();
watchPlayers();
