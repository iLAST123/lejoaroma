/* ============================================
   ADMIN PANEL — auth, CRUD, image upload, backup
   ============================================ */

const ADMIN_SESSION_KEY = 'lejo_admin_session';
const ADMIN_PW_KEY = 'lejo_admin_pw';
const DEFAULT_PW = 'lejo2025';

const CATEGORY_LABELS = {
  'difusores': 'Difusores de Aroma',
  'velas': 'Velas Perfumadas',
  'home-spray': 'Home Spray',
  'sabonetes': 'Sabonetes Artesanais',
  'kits': 'Kits Presente',
  'agua-lencol': 'Água de Lençol'
};
const FRAGRANCE_LABELS = {
  'lavanda': 'Lavanda Francesa',
  'cha-branco': 'Chá Branco e Bambu',
  'orquidea': 'Orquídea',
  'vanilla': 'Vanilla',
  'flor-algodao': 'Flor de Algodão',
  'rosa': 'Rosa'
};

// ============================================
// AUTH
// ============================================
function getStoredPassword() {
  return localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW;
}
function isAuthenticated() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}
function signIn() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
}
function signOut() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  location.reload();
}

// ============================================
// STATE
// ============================================
let products = loadProducts();
let searchQuery = '';
let editingId = null;

function persist() {
  saveProducts(products);
}

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function uniqueId(base) {
  let id = base;
  let n = 2;
  while (products.some(p => p.id === id)) {
    id = base + '-' + n;
    n++;
  }
  return id;
}

// ============================================
// IMAGE RESIZE (prevent huge localStorage)
// ============================================
function resizeImage(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
          } else {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================
// RENDER LIST
// ============================================
function renderList() {
  const list = document.getElementById('products-list');
  const empty = document.getElementById('products-empty');
  const countEl = document.getElementById('admin-count');

  const filtered = products.filter(p =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery) ||
    (p.categoryLabel || '').toLowerCase().includes(searchQuery)
  );

  countEl.textContent = products.length + ' produto' + (products.length !== 1 ? 's' : '');

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    if (searchQuery) {
      empty.innerHTML = `
        <div class="empty-icon">🔍</div>
        <h3>Nenhum resultado</h3>
        <p>Tente buscar com outras palavras.</p>
      `;
    } else {
      empty.innerHTML = `
        <div class="empty-icon">🌸</div>
        <h3>Nenhum produto ainda</h3>
        <p>Adicione seu primeiro produto clicando em "Novo produto".</p>
      `;
    }
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = filtered.map(p => `
    <div class="product-row" data-id="${p.id}">
      <div class="pr-img"><img src="${p.image}" alt=""></div>
      <div class="pr-info">
        <div class="pr-name">${escapeHTML(p.name)}</div>
        <div class="pr-meta">
          <span class="pr-tag">${escapeHTML(p.categoryLabel || '')}</span>
          ${p.badge ? `<span class="pr-tag">${escapeHTML(p.badge)}</span>` : ''}
          <span>★ ${p.rating || 0} (${p.reviews || 0})</span>
        </div>
      </div>
      <div class="pr-price">${formatBRL(p.price)}</div>
      <div class="pr-actions">
        <button class="pr-action-btn" data-action="edit" aria-label="Editar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="pr-action-btn delete" data-action="delete" aria-label="Excluir">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function escapeHTML(s) {
  return String(s || '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ============================================
// MODAL — product form
// ============================================
const modal = document.getElementById('product-modal');

function openModal(product) {
  editingId = product ? product.id : null;
  document.getElementById('modal-title').textContent = product ? 'Editar produto' : 'Novo produto';

  document.getElementById('p-id').value = product?.id || '';
  document.getElementById('p-name').value = product?.name || '';
  document.getElementById('p-category').value = product?.category || 'difusores';
  document.getElementById('p-fragrance').value = product?.fragrance || 'cha-branco';
  document.getElementById('p-price-from').value = product?.priceFrom || '';
  document.getElementById('p-price').value = product?.price || '';
  document.getElementById('p-rating').value = product?.rating ?? 5;
  document.getElementById('p-reviews').value = product?.reviews || 0;
  document.getElementById('p-badge').value = product?.badge || '';
  document.getElementById('p-desc').value = product?.desc || '';
  document.getElementById('p-image').value = product?.image || '';
  document.getElementById('p-image-url').value = product?.image && !product.image.startsWith('data:') ? product.image : '';

  const details = product?.details || {};
  document.getElementById('p-volume').value = details['Volume'] || '';
  document.getElementById('p-duration').value = details['Duração estimada'] || '';
  document.getElementById('p-composition').value = details['Composição'] || '';

  // Preview
  updatePreview(product?.image);

  // Clear file input
  document.getElementById('p-image-file').value = '';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  editingId = null;
}

function updatePreview(src) {
  const preview = document.getElementById('image-preview');
  if (src) {
    preview.innerHTML = `<img src="${src}" alt="Preview">`;
  } else {
    preview.innerHTML = '<span class="image-placeholder">🖼️</span>';
  }
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

// Image file upload
document.getElementById('p-image-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await resizeImage(file, 800);
    document.getElementById('p-image').value = dataUrl;
    document.getElementById('p-image-url').value = '';
    updatePreview(dataUrl);
  } catch (err) {
    showToast('Erro ao processar imagem');
  }
});

// Image URL input
document.getElementById('p-image-url').addEventListener('input', e => {
  const url = e.target.value.trim();
  if (url) {
    document.getElementById('p-image').value = url;
    updatePreview(url);
  }
});

// Save
document.getElementById('modal-save').addEventListener('click', () => {
  const name = document.getElementById('p-name').value.trim();
  const price = parseFloat(document.getElementById('p-price').value);
  const image = document.getElementById('p-image').value.trim();

  if (!name) { showToast('Informe o nome do produto'); return; }
  if (!price || price <= 0) { showToast('Informe um preço válido'); return; }
  if (!image) {
    document.getElementById('p-image').value =
      'https://placehold.co/600x600/F2E8DC/A87850?text=' + encodeURIComponent(name.slice(0, 12)) + '&font=playfair';
  }

  const category = document.getElementById('p-category').value;
  const fragrance = document.getElementById('p-fragrance').value;

  const details = {};
  const volume = document.getElementById('p-volume').value.trim();
  const duration = document.getElementById('p-duration').value.trim();
  const composition = document.getElementById('p-composition').value.trim();
  if (volume) details['Volume'] = volume;
  if (duration) details['Duração estimada'] = duration;
  if (composition) details['Composição'] = composition;
  details['Feito em'] = 'São Paulo, Brasil 🇧🇷';

  const product = {
    id: editingId || uniqueId(slugify(name)),
    name,
    category,
    categoryLabel: CATEGORY_LABELS[category] || category,
    fragrance,
    fragranceLabel: FRAGRANCE_LABELS[fragrance] || fragrance,
    price,
    priceFrom: parseFloat(document.getElementById('p-price-from').value) || null,
    rating: Math.max(0, Math.min(5, parseInt(document.getElementById('p-rating').value) || 0)),
    reviews: parseInt(document.getElementById('p-reviews').value) || 0,
    badge: document.getElementById('p-badge').value.trim() || null,
    desc: document.getElementById('p-desc').value.trim(),
    image: document.getElementById('p-image').value,
    details: Object.keys(details).length > 1 ? details : undefined
  };

  if (editingId) {
    const idx = products.findIndex(p => p.id === editingId);
    if (idx >= 0) products[idx] = product;
  } else {
    products.unshift(product);
  }

  try {
    persist();
    renderList();
    closeModal();
    showToast(editingId ? '✓ Produto atualizado!' : '✓ Produto adicionado!');
  } catch (err) {
    showToast('Erro ao salvar — armazenamento cheio?');
  }
});

// New product
document.getElementById('new-product-btn').addEventListener('click', () => openModal(null));

// Edit / Delete (delegation)
document.getElementById('products-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const row = btn.closest('.product-row');
  const id = row.dataset.id;
  const product = products.find(p => p.id === id);
  if (!product) return;

  if (btn.dataset.action === 'edit') {
    openModal(product);
  } else if (btn.dataset.action === 'delete') {
    confirmDialog(
      'Excluir produto',
      `Tem certeza que deseja excluir "${product.name}"? Esta ação não pode ser desfeita.`,
      () => {
        products = products.filter(p => p.id !== id);
        persist();
        renderList();
        showToast('Produto excluído');
      }
    );
  }
});

// ============================================
// CONFIRM DIALOG
// ============================================
const confirmModal = document.getElementById('confirm-modal');
let confirmCallback = null;

function confirmDialog(title, msg, onOk) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  confirmCallback = onOk;
  confirmModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeConfirm() {
  confirmModal.classList.remove('open');
  document.body.style.overflow = '';
  confirmCallback = null;
}
document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
confirmModal.querySelector('.modal-backdrop').addEventListener('click', closeConfirm);
document.getElementById('confirm-ok').addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  closeConfirm();
});

// ============================================
// SEARCH
// ============================================
document.getElementById('search-input').addEventListener('input', e => {
  searchQuery = e.target.value.trim().toLowerCase();
  renderList();
});

// ============================================
// NAVIGATION (sidebar)
// ============================================
const navItems = document.querySelectorAll('.admin-nav-item');
const views = document.querySelectorAll('.admin-view');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(i => i.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));
    item.classList.add('active');
    document.querySelector(`[data-view-panel="${item.dataset.view}"]`).classList.add('active');
    closeAdminNav();
  });
});

const adminNav = document.getElementById('admin-nav');
const adminNavOverlay = document.getElementById('admin-nav-overlay');
function openAdminNav() {
  adminNav.classList.add('open');
  adminNavOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeAdminNav() {
  adminNav.classList.remove('open');
  adminNavOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('admin-menu-btn').addEventListener('click', openAdminNav);
adminNavOverlay.addEventListener('click', closeAdminNav);

// ============================================
// BACKUP / RESTORE
// ============================================
document.getElementById('export-btn').addEventListener('click', () => {
  const json = JSON.stringify(products, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `lejo-produtos-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Backup baixado!');
});

const importInput = document.getElementById('import-file');
document.getElementById('import-btn').addEventListener('click', () => importInput.click());
importInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error('Formato inválido');
      confirmDialog(
        'Importar produtos',
        `Isso irá substituir ${products.length} produto(s) por ${parsed.length} do arquivo. Continuar?`,
        () => {
          products = parsed;
          persist();
          renderList();
          showToast('✓ Produtos importados!');
        }
      );
    } catch {
      showToast('Arquivo inválido');
    }
    importInput.value = '';
  };
  reader.readAsText(file);
});

document.getElementById('reset-btn').addEventListener('click', () => {
  confirmDialog(
    'Restaurar padrão',
    'Isso irá substituir todos os produtos pelos 8 exemplos padrão. Continuar?',
    () => {
      resetProducts();
      products = DEFAULT_PRODUCTS.slice();
      persist();
      renderList();
      showToast('✓ Padrão restaurado');
    }
  );
});

// ============================================
// CHANGE PASSWORD
// ============================================
document.getElementById('change-pw-btn').addEventListener('click', () => {
  const input = document.getElementById('new-password');
  const val = input.value.trim();
  if (val.length < 4) {
    showToast('Senha precisa ter ao menos 4 caracteres');
    return;
  }
  localStorage.setItem(ADMIN_PW_KEY, val);
  input.value = '';
  showToast('✓ Senha atualizada');
});

// ============================================
// LOGIN FLOW
// ============================================
document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const pw = document.getElementById('pw').value;
  if (pw === getStoredPassword()) {
    signIn();
    showApp();
  } else {
    const input = document.getElementById('pw');
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 600);
    showToast('Senha incorreta');
  }
});

document.getElementById('logout-btn').addEventListener('click', signOut);

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display = 'block';
  renderList();
}

// Init
if (isAuthenticated()) {
  showApp();
}
