// Member pages: Java-style initialization screen + section tabs

// Loading screen (plays every time a member page opens)
(() => {
  const html = document.documentElement;
  const loader = document.getElementById('loader');
  const page = document.querySelector('.member-page');
  if (!loader || !page || !html.classList.contains('booting')) return;

  const site = document.getElementById('site');
  const codeEl = document.getElementById('code');
  const outEl = document.getElementById('out');
  const bar = document.getElementById('bar');
  const msg = document.getElementById('msg');
  const pct = document.getElementById('pct');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, still ? 0 : ms));

  const first = page.dataset.first || 'Member';
  const full = page.dataset.name || first;

  if (site) site.setAttribute('inert', '');

  // [css class, text] segments per line (k keyword, t type, s string, c comment, f function)
  const CODE = [
    [['k', 'public class '], ['t', first], ['', ' {']],
    [['c', '  // Nexora member profile']],
    [['', '  '], ['t', 'String'], ['', ' name = '], ['s', '"' + full + '"'], ['', ';']],
    [['', '  '], ['t', 'String'], ['', ' group = '], ['s', '"Nexora"'], ['', ';']],
    [['', '']],
    [['k', '  public static void '], ['f', 'main'], ['', '('], ['t', 'String'], ['', '[] args) {']],
    [['', '    '], ['t', first], ['', ' me = '], ['k', 'new '], ['t', first], ['', '();']],
    [['', '    me.'], ['f', 'loadIntro'], ['', '();']],
    [['', '    me.'], ['f', 'loadProjects'], ['', '();']],
    [['', '    me.'], ['f', 'loadContacts'], ['', '();']],
    [['', '  }']],
    [['', '}']]
  ];
  const OUT = [
    ['cmd', '$ javac ' + first + '.java'],
    ['info', '[info] Compiling 1 source file...'],
    ['ok', '[ok]   Build successful'],
    ['cmd', '$ java ' + first],
    ['done', '[done] Profile loaded.']
  ];

  document.querySelector('.term-bar span').textContent = first + '.java';

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
          if (!still && typed % 3 === 0) { setProgress(typed / total * 55); await sleep(12); }
        }
      }
      if (li < CODE.length - 1) codeEl.insertBefore(document.createTextNode('\n'), caret);
      await sleep(60);
    }
    caret.remove();
    setProgress(55, 'Compiling...');
  }

  async function printOutput() {
    const steps = [[70, 'Compiling...'], [80, 'Linking...'], [90, 'Linking...'], [96, 'Running...'], [100, 'Done']];
    for (let i = 0; i < OUT.length; i++) {
      const line = document.createElement('div');
      line.className = OUT[i][0];
      line.textContent = OUT[i][1];
      outEl.appendChild(line);
      setProgress(steps[i][0], steps[i][1]);
      await sleep(350);
    }
  }

  function finish() {
    loader.classList.add('done');
    html.classList.remove('booting');
    if (site) site.removeAttribute('inert');
    setTimeout(() => html.classList.add('seen'), 700);
  }

  (async () => {
    setProgress(0, 'Compiling...');
    await sleep(300);
    await typeCode();
    await sleep(200);
    await printOutput();
    await sleep(500);
    finish();
  })();
})();

// Section tabs: smooth scroll inside the content panel + highlight the section in view
(() => {
  const scroller = document.getElementById('content');
  const tabs = [...document.querySelectorAll('.tabs a')];
  const bar = document.querySelector('.tabs');
  if (!scroller || !tabs.length) return;
  const panels = tabs.map(a => document.querySelector(a.getAttribute('href')));

  tabs.forEach((a, i) => a.addEventListener('click', e => {
    e.preventDefault();
    panels[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  // The content column scrolls on desktop; on narrow screens the whole page does
  const scrollEl = () => (scroller.scrollHeight > scroller.clientHeight + 1 && getComputedStyle(scroller).overflowY !== 'visible')
    ? scroller : document.scrollingElement;

  function update() {
    const line = bar.getBoundingClientRect().bottom + 30;
    let idx = 0;
    panels.forEach((p, i) => { if (p.getBoundingClientRect().top <= line) idx = i; });
    const el = scrollEl();
    if (el.scrollHeight > el.clientHeight + 1 && el.scrollTop + el.clientHeight >= el.scrollHeight - 2) idx = panels.length - 1;
    tabs.forEach((a, i) => {
      a.classList.toggle('active', i === idx);
      if (i === idx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  scroller.addEventListener('scroll', update, { passive: true });
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();