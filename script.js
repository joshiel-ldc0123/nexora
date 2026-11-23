// Smooth scrolling for nav links
const links = document.querySelectorAll('.menu a');
links.forEach(a => a.addEventListener('click', e => {
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.pushState(null, '', a.getAttribute('href'));
}));

// Highlight the nav link of the section currently in view
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('header[id], section[id]').forEach(s => spy.observe(s));

// Subtle parallax on the light streaks
const streaks = document.getElementById('streaks');
window.addEventListener('mousemove', e => {
  const x = (e.clientX / innerWidth - 0.5) * 18;
  const y = (e.clientY / innerHeight - 0.5) * 18;
  streaks.style.transform = `translate(${x}px, ${y}px)`;
});

// Team members carousel
(() => {
  const root = document.getElementById('carousel');
  if (!root) return;
  const items = [...root.querySelectorAll('.member')];
  const dotsBox = document.getElementById('carDots');
  const n = items.length;
  let cur = 0, timer;

  const dots = items.map((m, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show member ' + (i + 1));
    b.addEventListener('click', () => go(i));
    dotsBox.appendChild(b);
    return b;
  });

  function render() {
    items.forEach((m, i) => {
      let d = ((i - cur) % n + n) % n;
      if (d > n / 2) d -= n;
      m.dataset.pos = d;
      m.setAttribute('aria-hidden', d !== 0);
      m.querySelector('a').tabIndex = d === 0 ? 0 : -1;
    });
    dots.forEach((b, i) => b.setAttribute('aria-current', i === cur));
  }
  function go(i) { cur = ((i % n) + n) % n; render(); restart(); }
  function restart() { clearInterval(timer); timer = setInterval(() => go(cur + 1), 5000); }

  root.querySelector('.prev').addEventListener('click', () => go(cur - 1));
  root.querySelector('.next').addEventListener('click', () => go(cur + 1));
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(cur - 1);
    if (e.key === 'ArrowRight') go(cur + 1);
  });
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);

  // Side card click brings it to the centre; centre card opens its page
  items.forEach((m, i) => m.querySelector('a').addEventListener('click', e => {
    if (m.dataset.pos !== '0') { e.preventDefault(); go(i); }
  }));

  // Swipe / drag
  let sx = null, moved = false;
  root.addEventListener('pointerdown', e => { sx = e.clientX; moved = false; });
  root.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) { moved = true; go(cur + (dx < 0 ? 1 : -1)); }
  });
  root.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  render(); restart();
})();

// Hexadecimal code rain: behind the home section and inside the logo's shape
(() => {
  const HEX = '0123456789ABCDEF';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hexRain(canvas, { size, body, head, fade, interval }) {
    const ctx = canvas.getContext('2d');
    let dpr, cell, cols, rows, pos, spd, last = 0, raf = 0, visible = true;

    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      cell = size * dpr;
      cols = Math.ceil(canvas.width / cell);
      rows = Math.ceil(canvas.height / cell);
      pos = Array.from({ length: cols }, () => -Math.random() * rows);
      spd = Array.from({ length: cols }, () => 0.45 + Math.random() * 0.8);
      ctx.font = cell + 'px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
    }

    function step() {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,' + fade + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < cols; i++) {
        const before = Math.floor(pos[i]);
        pos[i] += spd[i];
        const row = Math.floor(pos[i]);
        if (row !== before && row >= 0 && row <= rows) {
          ctx.fillStyle = Math.random() < 0.12 ? head : body;
          ctx.fillText(HEX[(Math.random() * 16) | 0], i * cell, row * cell);
        }
        if (pos[i] > rows && Math.random() > 0.96) pos[i] = -Math.random() * rows * 0.5;
      }
    }

    function loop(t) {
      raf = requestAnimationFrame(loop);
      if (t - last < interval) return;
      last = t;
      step();
    }
    function start() { if (!raf && visible && !document.hidden && !still) raf = requestAnimationFrame(loop); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    resize();
    if (still) { for (let i = 0; i < rows * 2; i++) step(); return; }

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    start();
  }

  const logo = document.getElementById('hexLogo');
  const bg = document.getElementById('hexBg');
  if (logo) hexRain(logo, { size: 9, body: '#19d3d0', head: '#eafffe', fade: 0.12, interval: 55 });
  if (bg) hexRain(bg, { size: 16, body: '#19d3d0', head: '#bff8ff', fade: 0.06, interval: 70 });
})();

// Loading screen: Java-style "compile and run" animation
(() => {
  const html = document.documentElement;
  const loader = document.getElementById('loader');
  if (!loader || !html.classList.contains('booting')) return;

  const site = document.getElementById('site');
  const codeEl = document.getElementById('code');
  const outEl = document.getElementById('out');
  const bar = document.getElementById('bar');
  const msg = document.getElementById('msg');
  const pct = document.getElementById('pct');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, still ? 0 : ms));

  if (site) site.setAttribute('inert', '');

  // [css class, text] segments per line (k keyword, t type, s string, c comment, f function)
  const CODE = [
    [['k', 'public class '], ['t', 'Nexora'], ['', ' {']],
    [['c', '  // Innovation through technology']],
    [['', '  '], ['t', 'String'], ['', ' motto = '], ['s', '"Shaping Tomorrow, Today."'], ['', ';']],
    [['', '  '], ['t', 'String'], ['', '[] team = { '], ['s', '"Joshiel"'], ['', ', '], ['s', '"Kirsten"'], ['', ', '], ['s', '"Juniell"'], ['', ', '], ['s', '"Louige"'], ['', ' };']],
    [['', '']],
    [['k', '  public static void '], ['f', 'main'], ['', '('], ['t', 'String'], ['', '[] args) {']],
    [['', '    '], ['t', 'Nexora'], ['', ' group = '], ['k', 'new '], ['t', 'Nexora'], ['', '();']],
    [['', '    group.'], ['f', 'explore'], ['', '();']],
    [['', '    group.'], ['f', 'share'], ['', '();']],
    [['', '    group.'], ['f', 'build'], ['', '();']],
    [['', '    group.'], ['f', 'launch'], ['', '();']],
    [['', '  }']],
    [['', '}']]
  ];
  const OUT = [
    ['cmd', '$ javac Nexora.java'],
    ['info', '[info] Compiling 1 source file...'],
    ['ok', '[ok]   Build successful'],
    ['cmd', '$ java Nexora'],
    ['done', '[done] Nexora is ready.']
  ];

  const total = CODE.reduce((n, l) => n + l.reduce((m, s) => m + s[1].length, 0), 0);
  let typed = 0;

  function setProgress(p, text) {
    p = Math.max(0, Math.min(100, Math.round(p)));
    bar.style.width = p + '%';
    pct.textContent = p + '%';
    if (text) msg.textContent = text;
  }

  async function typeCode() {
    const caret = document.createElement('span');
    caret.className = 'caret';
    codeEl.appendChild(caret);
    for (let li = 0; li < CODE.length; li++) {
      for (const [cls, text] of CODE[li]) {
        const span = document.createElement('span');
        if (cls) span.className = cls;
        codeEl.insertBefore(span, caret);
        for (const ch of text) {
          span.textContent += ch;
          typed++;
          if (!still && typed % 3 === 0) { setProgress(typed / total * 55); await sleep(14); }
        }
      }
      if (li < CODE.length - 1) codeEl.insertBefore(document.createTextNode('\n'), caret);
      await sleep(70);
    }
    caret.remove();
    setProgress(55, 'Compiling...');
  }

  async function printOutput() {
    const steps = [
      [70, 'Compiling...'], [80, 'Linking...'], [90, 'Linking...'], [96, 'Running...'], [100, 'Done']
    ];
    for (let i = 0; i < OUT.length; i++) {
      const line = document.createElement('div');
      line.className = OUT[i][0];
      line.textContent = OUT[i][1];
      outEl.appendChild(line);
      setProgress(steps[i][0], steps[i][1]);
      await sleep(450);
    }
  }

  function finish() {
    try { sessionStorage.setItem('nexoraBooted', '1'); } catch (e) {}
    loader.classList.add('done');
    html.classList.remove('booting');
    if (site) site.removeAttribute('inert');
    setTimeout(() => html.classList.add('seen'), 700);
  }

  (async () => {
    setProgress(0, 'Compiling...');
    await sleep(400);
    await typeCode();
    await sleep(250);
    await printOutput();
    await sleep(600);
    finish();
  })();
})();