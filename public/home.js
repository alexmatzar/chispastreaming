const grid = document.getElementById('grid');
const catBox = document.getElementById('categories');
const searchInput = document.getElementById('searchInput');
let activeCat = 'Todo';

function render() {
  const q = (searchInput.value || '').trim().toLowerCase();
  const list = CHANNELS.filter((c) =>
    (activeCat === 'Todo' || c.cat === activeCat) &&
    (!q || [c.name, c.title, c.game, c.cat].some((t) => t.toLowerCase().includes(q))));
  grid.innerHTML = list.length ? list.map(channelCard).join('') : '<div class="empty">No hay canales que coincidan. Prueba con otra categoría ✨</div>';
  catBox.querySelectorAll('.category').forEach((b) => {
    const on = b.dataset.cat === activeCat;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
}

catBox.innerHTML = CATEGORIES.map((c) => `<button class="category" role="tab" data-cat="${c}" style="font:inherit;color:inherit">${c}</button>`).join('');
catBox.addEventListener('click', (e) => {
  const b = e.target.closest('.category');
  if (!b) return;
  activeCat = b.dataset.cat;
  render();
});
searchInput.addEventListener('input', render);
render();
