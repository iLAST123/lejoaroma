/* ============================================
   HOME — featured products + testimonials carousel
   ============================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // Featured products (await Firestore load)
  const grid = document.getElementById('featured-grid');
  if (grid) {
    await productsReady;
    const featured = PRODUCTS.slice(0, 4);
    grid.innerHTML = featured.map(renderProductCard).join('');
  }

  // Testimonials carousel
  const track = document.getElementById('testi-track');
  const dotsWrap = document.getElementById('testi-dots');
  if (!track || !dotsWrap) return;

  const cards = track.querySelectorAll('.testi-card');
  let current = 0;
  let timer;

  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => go(i));
    dotsWrap.appendChild(dot);
  });

  function go(i) {
    current = i;
    track.style.transform = `translateX(-${i * 100}%)`;
    dotsWrap.querySelectorAll('.testi-dot').forEach((d, idx) => {
      d.classList.toggle('active', idx === i);
    });
  }
  function next() { go((current + 1) % cards.length); }

  function start() { timer = setInterval(next, 5000); }
  function stop() { clearInterval(timer); }

  start();
  track.parentElement.addEventListener('mouseenter', stop);
  track.parentElement.addEventListener('mouseleave', start);

  // Touch swipe for mobile
  let startX = 0;
  track.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    stop();
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) go((current + 1) % cards.length);
      else go((current - 1 + cards.length) % cards.length);
    }
    start();
  }, { passive: true });
});
