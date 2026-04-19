/* ============================================
   LOJA — filters, sort, grid rendering
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  const state = {
    category: 'all',
    fragrances: new Set(),
    priceMin: 0,
    priceMax: 300,
    sort: 'relevance'
  };

  // Parse URL category
  const urlCat = new URLSearchParams(location.search).get('categoria');
  if (urlCat) state.category = urlCat;

  const grid = document.getElementById('product-grid');
  const countEl = document.getElementById('product-count');
  const emptyEl = document.getElementById('empty-state');

  // Render categories
  const catList = document.getElementById('cat-list');
  catList.innerHTML = CATEGORIES.map(c =>
    `<li><button data-cat="${c.id}" class="${state.category === c.id ? 'active' : ''}">${c.label}</button></li>`
  ).join('');
  catList.addEventListener('click', e => {
    const btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    state.category = btn.dataset.cat;
    catList.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.cat === state.category));
    render();
  });

  // Render fragrances
  const fragList = document.getElementById('fragrance-list');
  fragList.innerHTML = FRAGRANCES.map(f =>
    `<li><label><input type="checkbox" value="${f.id}"> ${f.label}</label></li>`
  ).join('');
  fragList.addEventListener('change', e => {
    const val = e.target.value;
    if (e.target.checked) state.fragrances.add(val);
    else state.fragrances.delete(val);
    render();
  });

  // Price range
  const pMin = document.getElementById('price-min');
  const pMax = document.getElementById('price-max');
  const pMinV = document.getElementById('price-min-v');
  const pMaxV = document.getElementById('price-max-v');
  function onRange() {
    let min = parseInt(pMin.value);
    let max = parseInt(pMax.value);
    if (min > max - 10) min = max - 10;
    pMin.value = min;
    state.priceMin = min;
    state.priceMax = max;
    pMinV.textContent = min;
    pMaxV.textContent = max;
    render();
  }
  pMin.addEventListener('input', onRange);
  pMax.addEventListener('input', onRange);

  // Sort (sidebar radios)
  document.getElementById('sort-list').addEventListener('change', e => {
    state.sort = e.target.value;
    document.getElementById('sort-select').value = state.sort;
    render();
  });
  // Sort dropdown (toolbar)
  document.getElementById('sort-select').addEventListener('change', e => {
    state.sort = e.target.value;
    const radio = document.querySelector(`input[name="sort"][value="${state.sort}"]`);
    if (radio) radio.checked = true;
    render();
  });

  // Drawer open/close (mobile)
  const sidebar = document.getElementById('shop-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggle = document.getElementById('filter-toggle');
  const closeBtn = document.getElementById('sidebar-close');
  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  toggle.addEventListener('click', openSidebar);
  closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
  document.getElementById('apply-filters').addEventListener('click', closeSidebar);

  // Clear
  function clearAll() {
    state.category = 'all';
    state.fragrances.clear();
    state.priceMin = 0;
    state.priceMax = 300;
    state.sort = 'relevance';
    pMin.value = 0; pMax.value = 300;
    pMinV.textContent = 0; pMaxV.textContent = 300;
    catList.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.cat === 'all'));
    fragList.querySelectorAll('input').forEach(i => i.checked = false);
    document.querySelector('input[name="sort"][value="relevance"]').checked = true;
    document.getElementById('sort-select').value = 'relevance';
    render();
  }
  document.getElementById('clear-filters').addEventListener('click', clearAll);
  document.getElementById('reset-all').addEventListener('click', clearAll);

  function filter() {
    return PRODUCTS.filter(p => {
      if (state.category !== 'all' && p.category !== state.category) return false;
      if (state.fragrances.size > 0 && !state.fragrances.has(p.fragrance)) return false;
      if (p.price < state.priceMin || p.price > state.priceMax) return false;
      return true;
    });
  }

  function sort(list) {
    const arr = [...list];
    switch (state.sort) {
      case 'price-asc': arr.sort((a, b) => a.price - b.price); break;
      case 'price-desc': arr.sort((a, b) => b.price - a.price); break;
      case 'rating': arr.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews); break;
      case 'new': arr.reverse(); break;
    }
    return arr;
  }

  function render() {
    const list = sort(filter());
    countEl.textContent = list.length + ' produto' + (list.length !== 1 ? 's' : '');
    if (list.length === 0) {
      grid.innerHTML = '';
      emptyEl.style.display = 'block';
    } else {
      emptyEl.style.display = 'none';
      grid.innerHTML = list.map(renderProductCard).join('');
    }
  }

  render();
});
