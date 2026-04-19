/* ============================================
   PRODUTO (PDP) — render details, variants, cart
   ============================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await productsReady;
  const id = new URLSearchParams(location.search).get('id') || 'difusor-cha-branco';
  const product = getProductById(id) || PRODUCTS[0];

  // Enrich defaults for generic products
  const gallery = product.gallery || [
    product.image,
    product.image,
    product.image,
    product.image
  ];
  const details = product.details || {
    "Volume": "250ml",
    "Duração estimada": "30–45 dias",
    "Composição": "Natural e artesanal",
    "Embalagem": "Caixa presente inclusa",
    "Feito em": "São Paulo, Brasil 🇧🇷"
  };

  // Breadcrumb
  document.getElementById('bc-cat').textContent = product.categoryLabel;
  document.getElementById('bc-name').textContent = product.name;

  // Gallery
  const mainImg = document.getElementById('gallery-img');
  mainImg.src = gallery[0];
  mainImg.alt = product.name;

  const thumbsWrap = document.getElementById('gallery-thumbs');
  thumbsWrap.innerHTML = gallery.map((src, i) => `
    <button class="gallery-thumb ${i === 0 ? 'active' : ''}" data-src="${src}" aria-label="Imagem ${i + 1}">
      <img src="${src}" alt="">
    </button>
  `).join('');
  thumbsWrap.addEventListener('click', e => {
    const btn = e.target.closest('.gallery-thumb');
    if (!btn) return;
    thumbsWrap.querySelectorAll('.gallery-thumb').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mainImg.classList.add('fade');
    setTimeout(() => {
      mainImg.src = btn.dataset.src;
      mainImg.classList.remove('fade');
    }, 200);
  });

  // Badge
  const badgeEl = document.getElementById('pdp-badge');
  if (product.badge) badgeEl.textContent = product.badge;
  else badgeEl.style.display = 'none';

  // Details
  document.getElementById('pdp-category').textContent = product.categoryLabel.toUpperCase();
  document.getElementById('pdp-name').textContent = product.name;
  document.getElementById('pdp-stars').innerHTML = '★'.repeat(product.rating) + '☆'.repeat(5 - product.rating);
  document.getElementById('pdp-reviews-link').textContent = '(' + product.reviews + ' avaliações)';

  if (product.priceFrom) {
    document.getElementById('pdp-price-from').textContent = formatBRL(product.priceFrom);
  } else {
    document.getElementById('pdp-price-from').style.display = 'none';
  }
  document.getElementById('pdp-price-to').textContent = formatBRL(product.price);
  const inst = (product.price / 3).toFixed(2).replace('.', ',');
  document.getElementById('pdp-installments').textContent = 'ou 3x de R$ ' + inst + ' sem juros';

  document.getElementById('pdp-short').textContent =
    product.desc || 'Feito à mão com ingredientes selecionados para trazer mais aconchego ao seu lar.';

  // Sticky price
  document.getElementById('sticky-price').textContent = formatBRL(product.price);

  // Fragrance chips
  const fragWrap = document.getElementById('fragrance-chips');
  const fragOpts = [
    { id: 'cha-branco', label: 'Chá Branco e Bambu' },
    { id: 'lavanda', label: 'Lavanda Francesa' },
    { id: 'orquidea', label: 'Orquídea' },
    { id: 'vanilla', label: 'Vanilla' }
  ];
  let selectedFragrance = product.fragranceLabel || fragOpts[0].label;
  fragWrap.innerHTML = fragOpts.map(f =>
    `<button class="chip ${f.label === selectedFragrance ? 'active' : ''}" data-frag="${f.label}">${f.label}</button>`
  ).join('');
  fragWrap.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    fragWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedFragrance = chip.dataset.frag;
  });

  // Volume chips
  const volWrap = document.getElementById('volume-chips');
  let selectedVolume = '250ml';
  volWrap.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    volWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedVolume = chip.dataset.volume;
  });

  // Quantity
  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus').addEventListener('click', () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    qtyInput.value = parseInt(qtyInput.value) + 1;
  });
  qtyInput.addEventListener('change', () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value) || 1);
  });

  function addCurrent() {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      variant: selectedVolume + ' · ' + selectedFragrance,
      quantity: parseInt(qtyInput.value)
    });
  }
  document.getElementById('add-to-cart-btn').addEventListener('click', addCurrent);
  document.getElementById('sticky-add').addEventListener('click', addCurrent);

  // WhatsApp
  const waText = encodeURIComponent(`Olá! Tenho interesse no ${product.name}`);
  document.getElementById('whatsapp-btn').href = `https://wa.me/5511930605430?text=${waText}`;

  // Tabs
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    t.classList.add('active');
    document.querySelector(`[data-panel="${t.dataset.tab}"]`).classList.add('active');
  }));

  // Description text
  document.getElementById('tab-desc-text').textContent = product.desc ||
    'Produto artesanal elaborado com ingredientes selecionados para transformar qualquer ambiente em um refúgio de bem-estar. Feito à mão com carinho.';

  // Info table
  const table = document.getElementById('info-table');
  table.innerHTML = Object.entries(details).map(([k, v]) =>
    `<tr><td>${k}</td><td>${v}</td></tr>`
  ).join('');

  // Related
  const related = PRODUCTS.filter(p => p.id !== product.id).slice(0, 4);
  document.getElementById('related-grid').innerHTML = related.map(renderProductCard).join('');

  // Page title
  document.title = product.name + ' — Lejô Aromas e Sensações';
});
