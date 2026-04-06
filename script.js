/* ═══════════════════════════════════════════════════
   ZORIA MARKETS — script.js
   "Market Intelligence. Simplified."
═══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   0. UTILITIES  (must be defined before IIFEs)
───────────────────────────────────────────── */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ─────────────────────────────────────────────
   1. STARFIELD
───────────────────────────────────────────── */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, stars = [];
  const STAR_COUNT = 180;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createStar() {
    return {
      x:       rand(0, W),
      y:       rand(0, H),
      r:       rand(0.3, 1.8),
      opacity: rand(0.2, 0.95),
      speed:   rand(0.012, 0.055),    // twinkle speed
      phase:   rand(0, Math.PI * 2),  // twinkle phase offset
      drift:   rand(-0.035, 0.035),   // slow horizontal drift
      gold:    Math.random() < 0.13,
      blue:    Math.random() < 0.08,
    };
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = Array.from({ length: STAR_COUNT }, createStar);
  }

  let lastTime = 0;
  function draw(ts) {
    const dt = Math.min((ts - lastTime) / 16.67, 3);
    lastTime = ts;

    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.phase += s.speed * dt;
      const alpha = s.opacity * (0.5 + 0.5 * Math.sin(s.phase));

      s.x += s.drift * dt;
      if (s.x < 0) s.x = W;
      if (s.x > W) s.x = 0;

      const color = s.gold
        ? `rgba(240,180,41,${alpha})`
        : s.blue
          ? `rgba(29,161,242,${alpha})`
          : `rgba(255,255,255,${alpha})`;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Larger glow halo on bigger stars
      if (s.r > 1.2) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? `rgba(240,180,41,${alpha * 0.12})`
          : s.blue
            ? `rgba(29,161,242,${alpha * 0.1})`
            : `rgba(255,255,255,${alpha * 0.06})`;
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', debounce(resize, 200));
  resize();
  requestAnimationFrame(draw);
})();


/* ─────────────────────────────────────────────
   2. COUNTDOWN TIMER
───────────────────────────────────────────── */
(function initCountdown() {
  // June 1 2026 00:00:00 UTC
  const LAUNCH = Date.UTC(2026, 5, 1, 0, 0, 0);

  const elDays    = document.getElementById('cd-days');
  const elHours   = document.getElementById('cd-hours');
  const elMinutes = document.getElementById('cd-minutes');
  const elSeconds = document.getElementById('cd-seconds');

  if (!elDays) return;

  function pad(n) {
    return String(Math.max(0, Math.floor(n))).padStart(2, '0');
  }

  let prevValues = { days: null, hours: null, mins: null, secs: null };

  function animateFlip(el) {
    el.classList.remove('flip');
    void el.offsetWidth; // force reflow
    el.classList.add('flip');
  }

  function setNum(el, val, prevKey) {
    const next = pad(val);
    if (prevValues[prevKey] !== next) {
      prevValues[prevKey] = next;
      animateFlip(el);
      el.textContent = next;
    }
  }

  function tick() {
    const now  = Date.now();
    const diff = LAUNCH - now;

    if (diff <= 0) {
      ['cd-days','cd-hours','cd-minutes','cd-seconds'].forEach(id => {
        document.getElementById(id).textContent = '00';
      });
      return;
    }

    const totalSecs = Math.floor(diff / 1000);
    const secs  = totalSecs % 60;
    const mins  = Math.floor(totalSecs / 60) % 60;
    const hours = Math.floor(totalSecs / 3600) % 24;
    const days  = Math.floor(totalSecs / 86400);

    setNum(elDays,    days,  'days');
    setNum(elHours,   hours, 'hours');
    setNum(elMinutes, mins,  'mins');
    setNum(elSeconds, secs,  'secs');
  }

  tick(); // run immediately on load
  setInterval(tick, 1000);
})();


/* ─────────────────────────────────────────────
   3. EMAIL WAITLIST
───────────────────────────────────────────── */
(function initWaitlist() {
  const form      = document.getElementById('waitlist-form');
  const input     = document.getElementById('email-input');
  const btn       = document.getElementById('join-btn');
  const errorEl   = document.getElementById('form-error');
  const successEl = document.getElementById('success-msg');

  if (!form) return;

  // Persist across page loads
  if (localStorage.getItem('zoria_waitlist_email')) {
    form.style.display      = 'none';
    successEl.style.display = 'flex';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.textContent = '';

    const email = input.value.trim();

    if (!email) {
      errorEl.textContent = 'Please enter your email address.';
      triggerShake(input);
      input.focus();
      return;
    }

    if (!isValidEmail(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      triggerShake(input);
      input.focus();
      return;
    }

    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Joining…';

    setTimeout(() => {
      localStorage.setItem('zoria_waitlist_email', email);
      localStorage.setItem('zoria_waitlist_ts', Date.now().toString());
      form.style.display      = 'none';
      successEl.style.display = 'flex';
    }, 700);
  });

  function triggerShake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }
})();


/* ─────────────────────────────────────────────
   4. ANIMATED GRADIENT BORDER — EMAIL INPUT
───────────────────────────────────────────── */
(function initInputGlow() {
  const input = document.getElementById('email-input');
  const wrap  = input && input.closest('.input-wrap');
  if (!wrap) return;

  input.addEventListener('focus', () => wrap.classList.add('input-focused'));
  input.addEventListener('blur',  () => wrap.classList.remove('input-focused'));
})();


/* ─────────────────────────────────────────────
   5. SCROLL FADE-IN  (Intersection Observer)
───────────────────────────────────────────── */
(function initScrollReveal() {
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  els.forEach(el => observer.observe(el));
})();


/* ─────────────────────────────────────────────
   6. TICKER TAPE
───────────────────────────────────────────── */
(function initTicker() {
  const container = document.getElementById('ticker-inner');
  if (!container) return;

  const tickers = [
    { symbol: '$BTC',  change: +2.4,  price: '67,842' },
    { symbol: '$ETH',  change: +1.8,  price: '3,521'  },
    { symbol: '$NVDA', change: +3.2,  price: '875.60' },
    { symbol: '$SPY',  change: -0.4,  price: '521.32' },
    { symbol: '$AAPL', change: +0.9,  price: '189.45' },
    { symbol: '$TSLA', change: -1.2,  price: '248.17' },
    { symbol: '$QQQ',  change: +0.7,  price: '448.90' },
    { symbol: '$META', change: +2.1,  price: '493.81' },
    { symbol: '$MSFT', change: +1.4,  price: '412.55' },
    { symbol: '$AMZN', change: +0.6,  price: '183.70' },
    { symbol: '$SOL',  change: +4.1,  price: '152.33' },
    { symbol: '$GOLD', change: +0.3,  price: '2,318'  },
    { symbol: '$OIL',  change: -0.8,  price: '79.14'  },
    { symbol: '$VIX',  change: -2.3,  price: '14.80'  },
  ];

  function buildItem(t) {
    const up   = t.change >= 0;
    const item = document.createElement('span');
    item.className = 'ticker-item';
    item.innerHTML =
      `<span class="ticker-symbol">${t.symbol}</span>` +
      `<span class="ticker-price">${t.price}</span>` +
      `<span class="ticker-arrow ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}</span>` +
      `<span class="ticker-change ${up ? 'up' : 'down'}">${up ? '+' : ''}${t.change.toFixed(1)}%</span>`;
    return item;
  }

  // Two identical copies = seamless infinite scroll
  const frag1 = document.createDocumentFragment();
  const frag2 = document.createDocumentFragment();
  tickers.forEach(t => {
    frag1.appendChild(buildItem(t));
    frag2.appendChild(buildItem(t));
  });
  container.appendChild(frag1);
  container.appendChild(frag2);
})();


/* ─────────────────────────────────────────────
   7. CARD PARALLAX TILT  (desktop only)
───────────────────────────────────────────── */
(function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      card.style.transform = `translateY(-8px) perspective(900px) rotateX(${dy * -6}deg) rotateY(${dx * 6}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform 0.55s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s, border-color 0.3s';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'box-shadow 0.3s, border-color 0.3s';
    });
  });
})();
