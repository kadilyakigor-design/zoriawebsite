/* ═══════════════════════════════════════════════════
   ZORIA MARKETS — script.js
   "Market Intelligence. Simplified."
═══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   1. STARFIELD
───────────────────────────────────────────── */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, stars = [];
  const STAR_COUNT = 160;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createStar() {
    return {
      x:        rand(0, W),
      y:        rand(0, H),
      r:        rand(0.3, 1.6),
      opacity:  rand(0.2, 0.9),
      speed:    rand(0.015, 0.06),       // twinkle speed
      phase:    rand(0, Math.PI * 2),    // twinkle phase offset
      drift:    rand(-0.04, 0.04),       // slow horizontal drift
      // A small fraction of stars get a gold tint
      gold:     Math.random() < 0.12,
      blue:     Math.random() < 0.08,
    };
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = Array.from({ length: STAR_COUNT }, createStar);
  }

  let lastTime = 0;
  function draw(ts) {
    const dt = Math.min((ts - lastTime) / 16.67, 3); // delta in frames, capped
    lastTime = ts;

    ctx.clearRect(0, 0, W, H);

    stars.forEach(s => {
      s.phase += s.speed * dt;
      // Twinkle: sine wave on opacity
      const alpha = s.opacity * (0.5 + 0.5 * Math.sin(s.phase));

      // Drift
      s.x += s.drift * dt;
      if (s.x < 0)  s.x = W;
      if (s.x > W)  s.x = 0;

      let color;
      if (s.gold)      color = `rgba(240,180,41,${alpha})`;
      else if (s.blue) color = `rgba(29,161,242,${alpha})`;
      else             color = `rgba(255,255,255,${alpha})`;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Occasional larger glow star
      if (s.r > 1.3) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? `rgba(240,180,41,${alpha * 0.15})`
          : `rgba(255,255,255,${alpha * 0.08})`;
        ctx.fill();
      }
    });

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
  const LAUNCH = new Date('2026-06-01T00:00:00Z').getTime();

  const elDays    = document.getElementById('cd-days');
  const elHours   = document.getElementById('cd-hours');
  const elMinutes = document.getElementById('cd-minutes');
  const elSeconds = document.getElementById('cd-seconds');

  if (!elDays) return;

  function pad(n) {
    return String(Math.floor(n)).padStart(2, '0');
  }

  function setNum(el, val) {
    const next = pad(val);
    if (el.textContent !== next) {
      el.classList.remove('flip');
      // Force reflow
      void el.offsetWidth;
      el.classList.add('flip');
      el.textContent = next;
    }
  }

  function tick() {
    const now  = Date.now();
    const diff = LAUNCH - now;

    if (diff <= 0) {
      elDays.textContent    = '00';
      elHours.textContent   = '00';
      elMinutes.textContent = '00';
      elSeconds.textContent = '00';
      return;
    }

    const totalSecs = Math.floor(diff / 1000);
    const secs      = totalSecs % 60;
    const mins      = Math.floor(totalSecs / 60) % 60;
    const hours     = Math.floor(totalSecs / 3600) % 24;
    const days      = Math.floor(totalSecs / 86400);

    setNum(elDays,    days);
    setNum(elHours,   hours);
    setNum(elMinutes, mins);
    setNum(elSeconds, secs);
  }

  tick();
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

  // If already signed up, hide form and show success
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
      input.classList.add('shake');
      input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });
      input.focus();
      return;
    }

    if (!isValidEmail(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      input.classList.add('shake');
      input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });
      input.focus();
      return;
    }

    // Disable while "submitting"
    btn.disabled       = true;
    btn.querySelector('.btn-text').textContent = 'Joining…';

    // Simulate async submission with slight delay for UX polish
    setTimeout(() => {
      localStorage.setItem('zoria_waitlist_email', email);
      localStorage.setItem('zoria_waitlist_ts', Date.now().toString());

      form.style.display      = 'none';
      successEl.style.display = 'flex';
    }, 600);
  });
})();


/* ─────────────────────────────────────────────
   4. SCROLL FADE-IN (Intersection Observer)
───────────────────────────────────────────── */
(function initScrollReveal() {
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;

  // If user prefers reduced motion, show everything immediately
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
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach(el => observer.observe(el));
})();


/* ─────────────────────────────────────────────
   5. TICKER TAPE
───────────────────────────────────────────── */
(function initTicker() {
  const container = document.getElementById('ticker-inner');
  if (!container) return;

  const tickers = [
    { symbol: '$BTC',  change: +2.4,  price: '67,842.10' },
    { symbol: '$ETH',  change: +1.8,  price: '3,521.44'  },
    { symbol: '$NVDA', change: +3.2,  price: '875.60'    },
    { symbol: '$SPY',  change: -0.4,  price: '521.32'    },
    { symbol: '$AAPL', change: +0.9,  price: '189.45'    },
    { symbol: '$TSLA', change: -1.2,  price: '248.17'    },
    { symbol: '$QQQ',  change: +0.7,  price: '448.90'    },
    { symbol: '$META', change: +2.1,  price: '493.81'    },
    { symbol: '$MSFT', change: +1.4,  price: '412.55'    },
    { symbol: '$AMZN', change: +0.6,  price: '183.70'    },
    { symbol: '$SOL',  change: +4.1,  price: '152.33'    },
    { symbol: '$GOLD', change: +0.3,  price: '2,318.50'  },
    { symbol: '$OIL',  change: -0.8,  price: '79.14'     },
    { symbol: '$VIX',  change: -2.3,  price: '14.80'     },
  ];

  function buildItem(t) {
    const up      = t.change >= 0;
    const arrow   = up ? '▲' : '▼';
    const cls     = up ? 'up' : 'down';
    const sign    = up ? '+' : '';

    const item = document.createElement('span');
    item.className = 'ticker-item';
    item.innerHTML =
      `<span class="ticker-symbol">${t.symbol}</span>` +
      `<span class="ticker-price">${t.price}</span>` +
      `<span class="ticker-arrow ${cls}">${arrow}</span>` +
      `<span class="ticker-change ${cls}">${sign}${t.change.toFixed(1)}%</span>`;
    return item;
  }

  // Build two copies for seamless infinite loop
  const fragment1 = document.createDocumentFragment();
  const fragment2 = document.createDocumentFragment();

  tickers.forEach(t => {
    fragment1.appendChild(buildItem(t));
    fragment2.appendChild(buildItem(t));
  });

  container.appendChild(fragment1);
  container.appendChild(fragment2);
})();


/* ─────────────────────────────────────────────
   6. CARD PARALLAX HOVER (desktop only)
───────────────────────────────────────────── */
(function initCardParallax() {
  if (window.matchMedia('(hover: none)').matches) return;

  const cards = document.querySelectorAll('.feature-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', function (e) {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / (rect.width  / 2);
      const dy    = (e.clientY - cy) / (rect.height / 2);
      const tiltX = dy * -5;  // degrees
      const tiltY = dx *  5;

      card.style.transform =
        `translateY(-6px) perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s, border-color 0.3s';
    });

    card.addEventListener('mouseenter', function () {
      card.style.transition = 'box-shadow 0.3s, border-color 0.3s';
    });
  });
})();


/* ─────────────────────────────────────────────
   7. UTILITY: DEBOUNCE
───────────────────────────────────────────── */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
