/* ============================================
   LEJÔ — Cart System (localStorage)
   ============================================ */

const CART_KEY = 'lejo_cart';
const COUPONS = { 'LEJO10': 0.10 };

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return defaultCart();
    const parsed = JSON.parse(raw);
    if (!parsed.items) return defaultCart();
    return parsed;
  } catch {
    return defaultCart();
  }
}

function defaultCart() {
  return { items: [], coupon: null, discount: 0, shipping: null };
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
}

function addToCart(product) {
  const cart = getCart();
  const key = product.id + '::' + (product.variant || '');
  const existing = cart.items.find(i => (i.id + '::' + (i.variant || '')) === key);
  if (existing) {
    existing.quantity += (product.quantity || 1);
  } else {
    cart.items.push({
      id: product.id,
      name: product.name,
      variant: product.variant || '',
      price: Number(product.price),
      quantity: product.quantity || 1,
      image: product.image || ''
    });
  }
  saveCart(cart);
  showToast('✓ ' + product.name + ' adicionado ao carrinho!');
  return cart;
}

function removeFromCart(id, variant) {
  const cart = getCart();
  cart.items = cart.items.filter(i => !(i.id === id && (i.variant || '') === (variant || '')));
  saveCart(cart);
  return cart;
}

function updateQuantity(id, variant, qty) {
  const cart = getCart();
  const item = cart.items.find(i => i.id === id && (i.variant || '') === (variant || ''));
  if (!item) return cart;
  item.quantity = Math.max(1, parseInt(qty) || 1);
  saveCart(cart);
  return cart;
}

function getCartSubtotal() {
  const cart = getCart();
  return cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
}

function getCartCount() {
  const cart = getCart();
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}

function applyCoupon(code) {
  const cart = getCart();
  const upper = (code || '').trim().toUpperCase();
  if (COUPONS[upper]) {
    cart.coupon = upper;
    cart.discount = COUPONS[upper];
    saveCart(cart);
    return { success: true, code: upper, percent: COUPONS[upper] * 100 };
  }
  cart.coupon = null;
  cart.discount = 0;
  saveCart(cart);
  return { success: false, message: 'Cupom inválido' };
}

function setShipping(option) {
  const cart = getCart();
  cart.shipping = option;
  saveCart(cart);
  return cart;
}

function getCartTotal() {
  const cart = getCart();
  const subtotal = getCartSubtotal();
  const discountValue = subtotal * (cart.discount || 0);
  const shippingValue = cart.shipping ? cart.shipping.price : 0;
  return Math.max(0, subtotal - discountValue + shippingValue);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  document.dispatchEvent(new CustomEvent('cart:updated', { detail: defaultCart() }));
}

function formatBRL(value) {
  return 'R$ ' + Number(value).toFixed(2).replace('.', ',');
}

function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('[data-cart-badge]').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<span class="toast-icon">✓</span><span class="toast-msg"></span>';
    document.body.appendChild(toast);
  }
  toast.querySelector('.toast-msg').textContent = message;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
