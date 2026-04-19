/* ============================================
   LEJÔ — Product catalog
   Shared across loja.html, produto.html, index.html
   Products managed via admin.html (stored in localStorage)
   ============================================ */

const PRODUCTS_KEY = 'lejo_products';

const DEFAULT_PRODUCTS = [
  {
    id: "difusor-cha-branco",
    name: "Difusor Chá Branco e Bambu",
    category: "difusores",
    categoryLabel: "Difusores de Aroma",
    priceFrom: 79.90,
    price: 59.90,
    rating: 5,
    reviews: 47,
    badge: "Mais Vendido",
    fragrance: "cha-branco",
    fragranceLabel: "Chá Branco e Bambu",
    image: "https://placehold.co/600x600/F2E8DC/A87850?text=Difusor&font=playfair",
    gallery: [
      "https://placehold.co/800x800/F2E8DC/A87850?text=Difusor+1&font=playfair",
      "https://placehold.co/800x800/E8DDD4/A87850?text=Difusor+2&font=playfair",
      "https://placehold.co/800x800/F9EEE8/A87850?text=Difusor+3&font=playfair",
      "https://placehold.co/800x800/FAFAF8/A87850?text=Difusor+4&font=playfair"
    ],
    desc: "Transforme sua casa em um refúgio de bem-estar. Notas delicadas de chá branco e bambu criam uma atmosfera serena e sofisticada.",
    details: {
      "Volume": "250ml",
      "Duração estimada": "30–45 dias",
      "Composição": "Água, álcool, fragrância",
      "Embalagem": "Frasco de vidro + palitos de rattan",
      "Feito em": "São Paulo, Brasil 🇧🇷"
    }
  },
  {
    id: "vela-flor-algodao",
    name: "Vela Perfumada Flor de Algodão",
    category: "velas",
    categoryLabel: "Velas Perfumadas",
    priceFrom: 55.90,
    price: 45.90,
    rating: 5,
    reviews: 32,
    badge: "Novo",
    fragrance: "flor-algodao",
    fragranceLabel: "Flor de Algodão",
    image: "https://placehold.co/600x600/E8DDD4/A87850?text=Vela&font=playfair"
  },
  {
    id: "home-spray-lavanda",
    name: "Home Spray Lavanda Francesa",
    category: "home-spray",
    categoryLabel: "Home Spray",
    priceFrom: null,
    price: 38.90,
    rating: 5,
    reviews: 28,
    fragrance: "lavanda",
    fragranceLabel: "Lavanda Francesa",
    image: "https://placehold.co/600x600/F9EEE8/A87850?text=Home+Spray&font=playfair"
  },
  {
    id: "sabonete-rosa",
    name: "Sabonete Artesanal Rosa",
    category: "sabonetes",
    categoryLabel: "Sabonetes",
    priceFrom: null,
    price: 22.90,
    rating: 4,
    reviews: 19,
    fragrance: "rosa",
    fragranceLabel: "Rosa",
    image: "https://placehold.co/600x600/F2E8DC/B8943F?text=Sabonete&font=playfair"
  },
  {
    id: "kit-aromas-especiais",
    name: "Kit Presente Aromas Especiais",
    category: "kits",
    categoryLabel: "Kits Presente",
    priceFrom: 159.90,
    price: 129.90,
    rating: 5,
    reviews: 63,
    badge: "Top",
    fragrance: "orquidea",
    fragranceLabel: "Orquídea",
    image: "https://placehold.co/600x600/F9EEE8/B8943F?text=Kit+Presente&font=playfair"
  },
  {
    id: "agua-lencol-cha-branco",
    name: "Água de Lençol Chá Branco",
    category: "agua-lencol",
    categoryLabel: "Água de Lençol",
    priceFrom: null,
    price: 34.90,
    rating: 5,
    reviews: 14,
    fragrance: "cha-branco",
    fragranceLabel: "Chá Branco",
    image: "https://placehold.co/600x600/FAFAF8/A87850?text=%C3%81gua&font=playfair"
  },
  {
    id: "difusor-lavanda-500",
    name: "Difusor Lavanda 500ml",
    category: "difusores",
    categoryLabel: "Difusores de Aroma",
    priceFrom: 99.90,
    price: 79.90,
    rating: 5,
    reviews: 41,
    fragrance: "lavanda",
    fragranceLabel: "Lavanda Francesa",
    image: "https://placehold.co/600x600/E8DDD4/B8943F?text=Difusor+500&font=playfair"
  },
  {
    id: "kit-dia-namorados",
    name: "Kit Dia dos Namorados",
    category: "kits",
    categoryLabel: "Kits Presente",
    priceFrom: null,
    price: 189.90,
    rating: 5,
    reviews: 22,
    badge: "Edição Limitada",
    fragrance: "vanilla",
    fragranceLabel: "Vanilla",
    image: "https://placehold.co/600x600/F9EEE8/A87850?text=Kit+Namorados&font=playfair"
  }
];

function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return DEFAULT_PRODUCTS.slice();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_PRODUCTS.slice();
  } catch {
    return DEFAULT_PRODUCTS.slice();
  }
}

function saveProducts(list) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}

function resetProducts() {
  localStorage.removeItem(PRODUCTS_KEY);
}

const PRODUCTS = loadProducts();

const CATEGORIES = [
  { id: 'all', label: 'Todos os Produtos' },
  { id: 'difusores', label: 'Difusores de Aroma' },
  { id: 'velas', label: 'Velas Perfumadas' },
  { id: 'home-spray', label: 'Home Spray' },
  { id: 'sabonetes', label: 'Sabonetes Artesanais' },
  { id: 'kits', label: 'Kits Presente' },
  { id: 'agua-lencol', label: 'Água de Lençol' }
];

const FRAGRANCES = [
  { id: 'lavanda', label: 'Lavanda Francesa' },
  { id: 'cha-branco', label: 'Chá Branco e Bambu' },
  { id: 'orquidea', label: 'Orquídea' },
  { id: 'vanilla', label: 'Vanilla' },
  { id: 'flor-algodao', label: 'Flor de Algodão' },
  { id: 'rosa', label: 'Rosa' }
];

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}

function renderStars(n) {
  const full = '★'.repeat(n);
  const empty = '☆'.repeat(5 - n);
  return `<span class="stars">${full}${empty}</span>`;
}

function renderProductCard(p) {
  const price = formatBRL(p.price);
  const from = p.priceFrom ? `<span class="price-from">${formatBRL(p.priceFrom)}</span>` : '';
  const badge = p.badge ? `<span class="badge">${p.badge}</span>` : '';
  return `
    <article class="product-card" data-id="${p.id}">
      <a href="produto.html?id=${p.id}" class="card-media">
        ${badge}
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </a>
      <button class="favorite" aria-label="Favoritar" onclick="this.classList.toggle('active')">♡</button>
      <div class="card-body">
        <span class="card-category">${p.categoryLabel}</span>
        <a href="produto.html?id=${p.id}"><h3 class="card-name">${p.name}</h3></a>
        <div class="card-rating">
          ${renderStars(p.rating)}
          <span>(${p.reviews})</span>
        </div>
        <div class="card-price">
          ${from}
          <span class="price-to">${price}</span>
        </div>
        <button class="card-add" onclick='addToCart({id:"${p.id}",name:"${p.name}",price:${p.price},image:"${p.image}",variant:"${p.fragranceLabel || ''}"})'>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          Adicionar
        </button>
      </div>
    </article>
  `;
}
