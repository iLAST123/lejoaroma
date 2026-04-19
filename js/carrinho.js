/* ============================================
   CARRINHO — render items, totals, coupon, shipping
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  const wrapEl = document.getElementById('cart-wrap');
  const emptyEl = document.getElementById('cart-empty');
  const itemsEl = document.getElementById('cart-items');
  const countEl = document.getElementById('cart-count');

  function renderItems() {
    const cart = getCart();
    if (cart.items.length === 0) {
      wrapEl.style.display = 'none';
      emptyEl.style.display = 'block';
      return;
    }
    wrapEl.style.display = 'block';
    emptyEl.style.display = 'none';

    const totalQty = cart.items.reduce((s, i) => s + i.quantity, 0);
    countEl.textContent = totalQty + ' ' + (totalQty === 1 ? 'item' : 'itens');

    itemsEl.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-id="${item.id}" data-variant="${item.variant || ''}">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          ${item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : ''}
          <div class="cart-item-price">${formatBRL(item.price * item.quantity)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="cart-item-qty">
            <button data-action="minus" aria-label="Diminuir">−</button>
            <input type="number" value="${item.quantity}" min="1" aria-label="Quantidade">
            <button data-action="plus" aria-label="Aumentar">+</button>
          </div>
          <button class="cart-item-remove" data-action="remove" aria-label="Remover">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    renderSummary();
  }

  // Item actions (delegation)
  itemsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const row = btn.closest('.cart-item');
    const id = row.dataset.id;
    const variant = row.dataset.variant;
    const action = btn.dataset.action;
    const cart = getCart();
    const item = cart.items.find(i => i.id === id && (i.variant || '') === variant);
    if (!item) return;

    if (action === 'remove') {
      row.classList.add('removing');
      setTimeout(() => {
        removeFromCart(id, variant);
        renderItems();
      }, 300);
    } else if (action === 'minus') {
      if (item.quantity > 1) updateQuantity(id, variant, item.quantity - 1);
      else {
        row.classList.add('removing');
        setTimeout(() => {
          removeFromCart(id, variant);
          renderItems();
        }, 300);
        return;
      }
      renderItems();
    } else if (action === 'plus') {
      updateQuantity(id, variant, item.quantity + 1);
      renderItems();
    }
  });

  itemsEl.addEventListener('change', e => {
    if (e.target.tagName !== 'INPUT') return;
    const row = e.target.closest('.cart-item');
    const qty = Math.max(1, parseInt(e.target.value) || 1);
    updateQuantity(row.dataset.id, row.dataset.variant, qty);
    renderItems();
  });

  // Coupon
  document.getElementById('apply-coupon-btn').addEventListener('click', () => {
    const input = document.getElementById('coupon-input');
    const msg = document.getElementById('coupon-msg');
    const result = applyCoupon(input.value);
    if (result.success) {
      msg.className = 'coupon-msg success';
      msg.textContent = `✓ Cupom ${result.code} aplicado! ${result.percent}% de desconto.`;
    } else {
      msg.className = 'coupon-msg error';
      msg.textContent = result.message;
    }
    renderSummary();
  });

  // Shipping
  const cepInput = document.getElementById('cep-input');
  cepInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    e.target.value = v;
  });

  document.getElementById('calc-shipping-btn').addEventListener('click', () => {
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) {
      document.getElementById('shipping-options').innerHTML = '<p class="coupon-msg error">CEP inválido</p>';
      return;
    }
    const opts = [
      { id: 'pac', label: 'PAC', days: '5–8 dias úteis', price: 18.90 },
      { id: 'sedex', label: 'SEDEX', days: '1–3 dias úteis', price: 29.90 }
    ];
    const container = document.getElementById('shipping-options');
    container.innerHTML = opts.map((o, i) => `
      <label class="ship-opt ${i === 0 ? 'active' : ''}">
        <input type="radio" name="ship" value="${o.id}" ${i === 0 ? 'checked' : ''}>
        <div class="ship-opt-info">
          <strong>${o.label}</strong>
          <span>${o.days}</span>
        </div>
        <span class="ship-opt-price">${formatBRL(o.price)}</span>
      </label>
    `).join('');
    setShipping(opts[0]);
    renderSummary();
    container.querySelectorAll('.ship-opt').forEach(el => {
      el.addEventListener('click', () => {
        container.querySelectorAll('.ship-opt').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        const radio = el.querySelector('input');
        radio.checked = true;
        const opt = opts.find(o => o.id === radio.value);
        setShipping(opt);
        renderSummary();
      });
    });
  });

  function renderSummary() {
    const cart = getCart();
    const subtotal = getCartSubtotal();
    const discountValue = subtotal * (cart.discount || 0);
    const shipping = cart.shipping ? cart.shipping.price : 0;
    const total = Math.max(0, subtotal - discountValue + shipping);

    document.getElementById('sum-subtotal').textContent = formatBRL(subtotal);
    document.getElementById('sum-shipping').textContent = cart.shipping
      ? formatBRL(cart.shipping.price) + ' (' + cart.shipping.label + ')'
      : (subtotal >= 150 ? 'Grátis' : 'Calcular');

    const discountRow = document.getElementById('sum-discount-row');
    if (discountValue > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('sum-discount').textContent = '− ' + formatBRL(discountValue);
    } else {
      discountRow.style.display = 'none';
    }

    document.getElementById('sum-total').textContent = formatBRL(total);
    const inst = (total / 3).toFixed(2).replace('.', ',');
    document.getElementById('sum-installments').textContent = total > 0 ? `ou 3x de R$ ${inst} sem juros` : '';
  }

  renderItems();
});
