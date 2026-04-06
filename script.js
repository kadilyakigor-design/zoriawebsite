/* ═══════════════════════════════════════════════════
   ZORIA MARKETS — script.js  (shared, all pages)
   "Market Intelligence. Simplified."
═══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   0. UTILITIES  ← must be first, IIFEs use it
───────────────────────────────────────────── */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

/* ─────────────────────────────────────────────
   1. NAVIGATION
───────────────────────────────────────────── */
(function initNav() {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  if (!nav) return;

  /* Scroll-triggered glass background */
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Hamburger toggle */
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    /* Close on nav-link click (mobile) */
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    /* Close on outside click */
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Active page highlight */
  const page = document.body.dataset.page;
  if (page) {
    const link = nav.querySelector(`[data-nav="${page}"]`);
    if (link) link.classList.add('active');
  }
})();


/* ─────────────────────────────────────────────
   2. STARFIELD CANVAS
───────────────────────────────────────────── */
(function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COUNT = 180;
  let W, H, stars = [];

  function rand(a, b) { return Math.random() * (b - a) + a; }

  function makeStar() {
    return {
      x:     rand(0, W),
      y:     rand(0, H),
      r:     rand(0.3, 1.8),
      base:  rand(0.2, 0.9),
      speed: rand(0.012, 0.055),
      phase: rand(0, Math.PI * 2),
      drift: rand(-0.03, 0.03),
      gold:  Math.random() < 0.13,
      blue:  Math.random() < 0.08,
    };
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = Array.from({ length: COUNT }, makeStar);
  }

  let last = 0;
  function draw(ts) {
    const dt = Math.min((ts - last) / 16.67, 3);
    last = ts;
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      s.phase += s.speed * dt;
      const a = s.base * (0.5 + 0.5 * Math.sin(s.phase));
      s.x = (s.x + s.drift * dt + W) % W;

      const color = s.gold
        ? `rgba(240,180,41,${a})`
        : s.blue
          ? `rgba(29,161,242,${a})`
          : `rgba(255,255,255,${a})`;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.fillStyle = color;
      ctx.fill();

      if (s.r > 1.2) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, 6.2832);
        ctx.fillStyle = s.gold
          ? `rgba(240,180,41,${a * 0.1})`
          : `rgba(255,255,255,${a * 0.06})`;
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
   3. COUNTDOWN TIMER  (index.html only)
───────────────────────────────────────────── */
(function initCountdown() {
  const LAUNCH = Date.UTC(2026, 5, 1, 0, 0, 0); // June 1 2026

  const els = {
    days:    document.getElementById('cd-days'),
    hours:   document.getElementById('cd-hours'),
    minutes: document.getElementById('cd-minutes'),
    seconds: document.getElementById('cd-seconds'),
  };
  if (!els.days) return;

  const prev = { days: null, hours: null, minutes: null, seconds: null };

  function pad(n) { return String(Math.max(0, n | 0)).padStart(2, '0'); }

  function flip(el, val, key) {
    const s = pad(val);
    if (prev[key] === s) return;
    prev[key] = s;
    el.classList.remove('flip');
    void el.offsetWidth;
    el.classList.add('flip');
    el.textContent = s;
  }

  function tick() {
    const diff = LAUNCH - Date.now();
    if (diff <= 0) {
      Object.values(els).forEach(el => { el.textContent = '00'; });
      return;
    }
    const t  = diff / 1000 | 0;
    flip(els.days,    t / 86400 | 0,     'days');
    flip(els.hours,   (t / 3600 | 0) % 24, 'hours');
    flip(els.minutes, (t / 60   | 0) % 60, 'minutes');
    flip(els.seconds, t % 60,            'seconds');
  }

  tick();
  setInterval(tick, 1000);
})();


/* ─────────────────────────────────────────────
   4. WAITLIST FORM  (index.html + other pages)
───────────────────────────────────────────── */
(function initWaitlist() {
  document.querySelectorAll('.waitlist-form').forEach(form => {
    const input     = form.querySelector('.email-input');
    const btn       = form.querySelector('.join-btn, .subscribe-btn, .cta-btn');
    const errorEl   = form.querySelector('.form-error');
    const successEl = form.nextElementSibling?.classList.contains('success-msg')
      ? form.nextElementSibling : null;

    if (!input || !btn) return;

    const stored = localStorage.getItem('zoria_waitlist_email');
    if (stored && successEl) {
      form.style.display      = 'none';
      successEl.style.display = 'flex';
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function shake(el) {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
      el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (errorEl) errorEl.textContent = '';
      const email = input.value.trim();

      if (!email || !emailRe.test(email)) {
        if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
        shake(input);
        input.focus();
        return;
      }

      btn.disabled = true;
      const textEl = btn.querySelector('.btn-text') || btn;
      const orig   = textEl.textContent;
      textEl.textContent = 'Joining…';

      setTimeout(() => {
        localStorage.setItem('zoria_waitlist_email', email);
        if (successEl) {
          form.style.display      = 'none';
          successEl.style.display = 'flex';
        } else {
          textEl.textContent = '⭐ You\'re on the list!';
          btn.style.background = 'rgba(240,180,41,0.2)';
          btn.style.color = '#F0B429';
          btn.style.border = '1px solid rgba(240,180,41,0.4)';
          btn.disabled = false;
        }
      }, 700);
    });
  });
})();


/* ─────────────────────────────────────────────
   5. ANIMATED INPUT BORDER (focus ring)
───────────────────────────────────────────── */
(function initInputGlow() {
  document.querySelectorAll('.email-input').forEach(input => {
    const wrap = input.closest('.input-wrap');
    if (!wrap) return;
    input.addEventListener('focus', () => wrap.classList.add('input-focused'));
    input.addEventListener('blur',  () => wrap.classList.remove('input-focused'));
  });
})();


/* ─────────────────────────────────────────────
   6. SCROLL REVEAL  (Intersection Observer)
───────────────────────────────────────────── */
(function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
})();


/* ─────────────────────────────────────────────
   7. TICKER TAPE  (all pages)
───────────────────────────────────────────── */
(function initTicker() {
  const container = document.getElementById('ticker-inner');
  if (!container) return;

  const data = [
    { s:'$BTC',  c:+2.4, p:'67,842' },
    { s:'$ETH',  c:+1.8, p:'3,521'  },
    { s:'$NVDA', c:+3.2, p:'875.60' },
    { s:'$SPY',  c:-0.4, p:'521.32' },
    { s:'$AAPL', c:+0.9, p:'189.45' },
    { s:'$TSLA', c:-1.2, p:'248.17' },
    { s:'$QQQ',  c:+0.7, p:'448.90' },
    { s:'$META', c:+2.1, p:'493.81' },
    { s:'$MSFT', c:+1.4, p:'412.55' },
    { s:'$AMZN', c:+0.6, p:'183.70' },
    { s:'$SOL',  c:+4.1, p:'152.33' },
    { s:'$GOLD', c:+0.3, p:'2,318'  },
  ];

  function item(d) {
    const up = d.c >= 0;
    const el = document.createElement('span');
    el.className = 'ticker-item';
    el.innerHTML =
      `<span class="t-sym">${d.s}</span>` +
      `<span class="t-px">${d.p}</span>` +
      `<span class="t-arr ${up?'up':'dn'}">${up?'▲':'▼'}</span>` +
      `<span class="t-chg ${up?'up':'dn'}">${up?'+':''}${d.c.toFixed(1)}%</span>`;
    return el;
  }

  const f1 = document.createDocumentFragment();
  const f2 = document.createDocumentFragment();
  data.forEach(d => { f1.appendChild(item(d)); f2.appendChild(item(d)); });
  container.appendChild(f1);
  container.appendChild(f2);
})();


/* ─────────────────────────────────────────────
   8. CARD PARALLAX TILT  (desktop)
───────────────────────────────────────────── */
(function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
      card.style.transform =
        `translateY(-8px) perspective(900px) rotateX(${dy * -6}deg) rotateY(${dx * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1),box-shadow .3s,border-color .3s';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'box-shadow .3s,border-color .3s';
    });
  });
})();


/* ─────────────────────────────────────────────
   9. COMMUNITY COUNTER  (community.html only)
───────────────────────────────────────────── */
(function initCommunityCounter() {
  const el = document.getElementById('founder-count');
  if (!el) return;

  const target = 2847;
  const duration = 2200;
  let start = null;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    el.textContent = Math.round(easeOut(p) * target).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  }

  /* Start when element enters viewport */
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      requestAnimationFrame(step);
      io.disconnect();
    }
  }, { threshold: 0.5 });
  io.observe(el);
})();


/* ─────────────────────────────────────────────
   10. PROGRESS BAR ANIMATE  (community.html)
───────────────────────────────────────────── */
(function initProgressBar() {
  const bar = document.querySelector('.progress-fill');
  if (!bar) return;
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      bar.style.width = bar.dataset.fill || '28.5%';
      io.disconnect();
    }
  }, { threshold: 0.5 });
  io.observe(bar);
})();


/* ─────────────────────────────────────────────
   11. TERMINAL LIVE DOT  (signal.html)
───────────────────────────────────────────── */
(function initTerminal() {
  const ts = document.getElementById('terminal-ts');
  if (!ts) return;
  const msgs = ['just now','1 second ago','2 seconds ago','just now','just now'];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % msgs.length;
    ts.textContent = msgs[i];
  }, 3000);
})();
