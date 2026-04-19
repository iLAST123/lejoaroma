/* ============================================
   ADMIN PANEL — Firebase Auth + Firestore + Storage
   ============================================ */

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
// STATE
// ============================================
let products = [];
let searchQuery = '';
let editingId = null;
let pendingImageDataUrl = null; // Base64 data URL to embed on save

// ============================================
// FIRESTORE CRUD
// ============================================
async function loadProductsFromFirestore() {
  const snap = await fbDb.collection(PRODUCTS_COLLECTION).get();
  const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  list.sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    if (ta !== tb) return tb - ta;
    return (a.name || '').localeCompare(b.name || '');
  });
  return list;
}

async function saveProductDoc(id, data) {
  await fbDb.collection(PRODUCTS_COLLECTION).doc(id).set(data, { merge: true });
}

async function deleteProductDoc(id) {
  await fbDb.collection(PRODUCTS_COLLECTION).doc(id).delete();
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
// IMAGE RESIZE → base64 (embed directly in Firestore doc)
// Keeps each product under ~300KB so the 1 MiB doc limit is safe.
// ============================================
function resizeImageToDataUrl(file, maxSize = 800) {
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
        resolve(canvas.toDataURL('image/jpeg', 0.75));
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

async function refreshProducts() {
  try {
    products = await loadProductsFromFirestore();
    renderList();
  } catch (err) {
    console.error(err);
    showToast('Erro ao carregar produtos');
  }
}

// ============================================
// MODAL — product form
// ============================================
const modal = document.getElementById('product-modal');

function openModal(product) {
  editingId = product ? product.id : null;
  pendingImageDataUrl = null;

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

  updatePreview(product?.image);
  document.getElementById('p-image-file').value = '';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  editingId = null;
  pendingImageDataUrl = null;
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

// Image file upload → resize and keep as base64 until save
document.getElementById('p-image-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await resizeImageToDataUrl(file, 800);
    pendingImageDataUrl = dataUrl;
    document.getElementById('p-image-url').value = '';
    updatePreview(dataUrl);
  } catch (err) {
    console.error(err);
    showToast('Erro ao processar imagem');
  }
});

// Image URL input
document.getElementById('p-image-url').addEventListener('input', e => {
  const url = e.target.value.trim();
  if (url) {
    pendingImageDataUrl = null;
    document.getElementById('p-image').value = url;
    updatePreview(url);
  }
});

// Save
document.getElementById('modal-save').addEventListener('click', async () => {
  const saveBtn = document.getElementById('modal-save');
  const name = document.getElementById('p-name').value.trim();
  const price = parseFloat(document.getElementById('p-price').value);
  let image = document.getElementById('p-image').value.trim();

  if (!name) { showToast('Informe o nome do produto'); return; }
  if (!price || price <= 0) { showToast('Informe um preço válido'); return; }

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

  const id = editingId || uniqueId(slugify(name));

  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando…';

  try {
    // Use the uploaded-and-resized image (base64) if present
    if (pendingImageDataUrl) {
      image = pendingImageDataUrl;
    }
    if (!image) {
      image = 'https://placehold.co/600x600/F2E8DC/A87850?text=' +
        encodeURIComponent(name.slice(0, 12)) + '&font=playfair';
    }

    const data = {
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
      image,
      details: Object.keys(details).length > 1 ? details : null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!editingId) {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    await saveProductDoc(id, data);
    await refreshProducts();
    closeModal();
    showToast(editingId ? '✓ Produto atualizado!' : '✓ Produto adicionado!');
  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar: ' + (err.message || 'tente novamente'));
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar produto';
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
      async () => {
        try {
          await deleteProductDoc(id);
          await refreshProducts();
          showToast('Produto excluído');
        } catch (err) {
          console.error(err);
          showToast('Erro ao excluir');
        }
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
  const cb = confirmCallback;
  closeConfirm();
  if (cb) cb();
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
        `Isso irá adicionar/atualizar ${parsed.length} produto(s) no Firestore. Continuar?`,
        async () => {
          try {
            const batch = fbDb.batch();
            parsed.forEach(p => {
              const id = p.id || uniqueId(slugify(p.name || 'produto'));
              const { id: _, ...rest } = p;
              batch.set(fbDb.collection(PRODUCTS_COLLECTION).doc(id), {
                ...rest,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
            });
            await batch.commit();
            await refreshProducts();
            showToast('✓ Produtos importados!');
          } catch (err) {
            console.error(err);
            showToast('Erro ao importar');
          }
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
    'Isso irá apagar todos os produtos e recriar os 8 exemplos padrão. Continuar?',
    async () => {
      try {
        // Delete all existing
        const snap = await fbDb.collection(PRODUCTS_COLLECTION).get();
        const delBatch = fbDb.batch();
        snap.docs.forEach(d => delBatch.delete(d.ref));
        await delBatch.commit();
        // Insert defaults
        const addBatch = fbDb.batch();
        DEFAULT_PRODUCTS.forEach(p => {
          const { id, ...rest } = p;
          addBatch.set(fbDb.collection(PRODUCTS_COLLECTION).doc(id), {
            ...rest,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        await addBatch.commit();
        await refreshProducts();
        showToast('✓ Padrão restaurado');
      } catch (err) {
        console.error(err);
        showToast('Erro ao restaurar');
      }
    }
  );
});

// ============================================
// LOGIN / AUTH (Firebase — senha única, e-mail fixo)
// ============================================
// Firebase Auth exige e-mail, mas escondemos do usuário.
// O admin digita apenas a senha; usamos este e-mail por baixo.
const ADMIN_EMAIL = 'guilherme.almeida5522@gmail.com';

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const pw = document.getElementById('pw').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  try {
    await fbAuth.signInWithEmailAndPassword(ADMIN_EMAIL, pw);
    // onAuthStateChanged will call showApp()
  } catch (err) {
    console.error(err);
    errEl.textContent = 'Senha incorreta';
    document.getElementById('pw').classList.add('error');
    setTimeout(() => document.getElementById('pw').classList.remove('error'), 600);
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  fbAuth.signOut();
});

async function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display = 'block';
  await refreshProducts();
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').style.display = 'none';
  document.getElementById('pw').value = '';
}

// Single source of truth: Firebase auth state
fbAuth.onAuthStateChanged(user => {
  if (user) showApp();
  else showLogin();
});
