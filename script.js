/* =========================================================
   Sinan Polat – portfolio · interaktivitet
   ========================================================= */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ---------- Tema (lys/mørk) ---------- */
  const root = document.documentElement;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  $('#themeToggle').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('tema', next); } catch (e) {}
    $('meta[name="theme-color"]').content = next === 'dark' ? '#101114' : '#F5F2EC';
  });

  /* ---------- Mobilmenu ---------- */
  const menuBtn = $('#menuBtn'), nav = $('#nav');
  // mørk baggrund bag menuen på mobil; tryk udenfor eller Escape lukker den
  const scrim = document.createElement('div'); scrim.className = 'menu-scrim'; document.body.appendChild(scrim);
  const setMenu = open => { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); root.classList.toggle('menu-open', open); };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  scrim.addEventListener('click', () => setMenu(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Interne links: scroll blødt uden at ændre adressen (#top osv.) ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (id === 'top') scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }));

  /* ---------- Scroll: progress-bar, header og aktiv menu ---------- */
  const bar = $('.progress'), header = $('.site-header');
  const sections = $$('main section[id], footer[id]');
  const navLinks = $$('.nav a');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    header.classList.toggle('scrolled', scrollY > 10);
    let current = '';
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id; });
    navLinks.forEach(a => { if (a.getAttribute('href').startsWith('#')) a.classList.toggle('active', a.getAttribute('href') === '#' + current); });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal ved scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('seen');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  // lille forskydning, så elementer i samme gruppe kommer ind efter hinanden
  $$('.reveal').forEach(el => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
    io.observe(el);
  });

  /* ---------- Roterende ord i overskriften ---------- */
  const words = ['offentlige data', 'valgresultater', 'velfærdssystemer', 'regler og politikker', 'datablade'];
  const word = $('.rotator-word');
  let wi = 0;
  if (word && !reduceMotion) setInterval(() => {
    word.classList.add('out');
    setTimeout(() => {
      wi = (wi + 1) % words.length;
      word.textContent = words[wi];
      word.classList.remove('out'); word.classList.add('in');
      requestAnimationFrame(() => requestAnimationFrame(() => word.classList.remove('in')));
    }, 350);
  }, 2600);

  /* ---------- Hero: interaktivt "datafelt" af prikker ---------- */
  const canvas = $('.hero-field');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const hero = $('.hero');
    let w, h, dpr, dots = [], mouse = { x: -999, y: -999 }, raf = null, t0 = performance.now();
    const GAP = 30;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push({ x, y });
      draw(performance.now());
    };
    const color = () => getComputedStyle(root).getPropertyValue('--ink').trim();
    const accent = () => getComputedStyle(root).getPropertyValue('--accent').trim();
    function draw(now) {
      const ink = color(), acc = accent();
      ctx.clearRect(0, 0, w, h);
      const t = (now - t0) / 1000;
      for (const d of dots) {
        const dx = d.x - mouse.x, dy = d.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const near = Math.max(0, 1 - dist / 150);
        // en langsom bølge, så feltet føles levende
        const wave = reduceMotion ? 0 : (Math.sin(d.x * 0.012 + t * 0.8) + Math.cos(d.y * 0.015 + t * 0.6)) * 0.25 + 0.5;
        const r = 1 + near * 3.2 + wave * 0.5;
        const push = near * 10;
        const px = d.x + (dist ? dx / dist : 0) * push, py = d.y + (dist ? dy / dist : 0) * push;
        ctx.globalAlpha = 0.08 + wave * 0.07 + near * 0.6;
        ctx.fillStyle = near > 0.05 ? acc : ink;
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    let visible = true;
    const loop = now => { draw(now); raf = visible && !reduceMotion ? requestAnimationFrame(loop) : null; };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !reduceMotion) raf = requestAnimationFrame(loop); }).observe(hero);
    hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; if (reduceMotion) draw(performance.now()); });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    addEventListener('resize', resize);
    resize();
  }

  /* ---------- Parallax på chips ved portrættet ---------- */
  const pv = $('[data-parallax]');
  if (pv && finePointer && !reduceMotion) {
    $('.hero').addEventListener('pointermove', e => {
      const cx = e.clientX / innerWidth - 0.5, cy = e.clientY / innerHeight - 0.5;
      $$('.chip', pv).forEach(c => { const d = +c.dataset.depth; c.style.transform = `translate(${cx * d}px, ${cy * d}px)`; });
    });
  }

  /* ---------- Magnetiske knapper ---------- */
  if (finePointer && !reduceMotion) $$('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* ---------- Tællere ---------- */
  const countIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, dur = reduceMotion ? 1 : 1400, start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countIO.unobserve(el);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Galleri: filtre ---------- */
  const cards = $$('.card');
  // Når man skifter filter, vises de projekter, der er NYE i forhold til forrige filter, først.
  // Så kan man tydeligt se, at der er kommet andre ting frem.
  const workCards = $$('#work .card');
  let visibleBefore = new Set(workCards);
  $$('.filters button').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    $$('.filters button').forEach(b => { b.classList.toggle('on', b === btn); b.setAttribute('aria-pressed', b === btn); });
    const nowVisible = new Set();
    workCards.forEach((c, i) => {
      const show = f === 'alle' || c.dataset.cat.split(' ').includes(f);
      c.classList.toggle('hide', !show);
      if (!show) return;
      nowVisible.add(c);
      const isNew = !visibleBefore.has(c);
      // "Alle" bruger den oprindelige rækkefølge; andre filtre sætter nye projekter øverst
      c.style.order = f === 'alle' ? '' : (isNew ? i - (c.classList.contains('wide') ? 2000 : 1000) : i);
      c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
      c.style.animationDelay = (isNew && f !== 'alle') ? '0s' : '.08s';
    });
    visibleBefore = nowVisible;
  }));

  /* ---------- Galleri: lys der følger musen + 3D-tilt ---------- */
  if (finePointer && !reduceMotion) cards.forEach(c => {
    const m = $('.card-media', c);
    if (!m) return;
    m.addEventListener('pointermove', e => {
      const r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      m.style.setProperty('--mx', x * 100 + '%'); m.style.setProperty('--my', y * 100 + '%');
      c.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg)`;
    });
    m.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
  // sæt "stak af papir"-effekten til samme form som forsiden
  $$('.card-media.stack img').forEach(img => {
    const set = () => { const m = img.parentElement; m.style.setProperty('--sw', img.offsetWidth + 'px'); m.style.setProperty('--sh', img.offsetHeight + 'px'); };
    img.complete ? set() : img.addEventListener('load', set);
    addEventListener('resize', set);
  });

  /* ---------- Viewer: blad i sider (JPG) + åbn/download PDF ---------- */
  const viewer = $('#viewer'), vImg = $('.viewer-img'), vThumbs = $('.viewer-thumbs');
  const vOpen = $('#viewerOpen'), vDown = $('#viewerDownload');
  let vPages = [], vIdx = 0, lastFocus = null;
  const showPage = i => {
    vIdx = (i + vPages.length) % vPages.length;
    vImg.classList.add('loading');
    const src = vPages[vIdx];
    const pre = new Image();
    pre.onload = () => { vImg.src = src; vImg.classList.remove('loading'); };
    pre.src = src;
    if (vPages[vIdx + 1]) new Image().src = vPages[vIdx + 1]; // forudindlæs næste side
    $('.viewer-count').textContent = vPages.length > 1 ? `Side ${vIdx + 1} af ${vPages.length}` : '';
    $$('button', vThumbs).forEach((b, j) => b.classList.toggle('on', j === vIdx));
    const active = $$('button', vThumbs)[vIdx];
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  const openViewer = card => {
    const slug = card.dataset.slug, n = +card.dataset.pages, pdf = card.dataset.pdf, svg = card.dataset.svg;
    vPages = svg ? [svg] : Array.from({ length: n }, (_, i) => `${document.body.dataset.base || ''}work/${slug}/${i + 1}.jpg`);
    const title = card.dataset.title || $('h3', card).textContent;
    $('.viewer-title').textContent = title;
    // beskrivelse og "Min rolle" fra kortet (i det kompakte galleri står de ikke på selve kortet)
    const body = $('.card-body', card), vDesc = $('.viewer-desc');
    if (vDesc) {
      const intro = body && $$(':scope > p', body).find(p => !p.matches('.kicker, .role, .card-actions, .more'));
      const role = body && $('.role', body);
      vDesc.innerHTML = (intro ? intro.textContent : '') + (role ? `<span>${role.innerHTML}</span>` : '');
    }
    vImg.alt = card.dataset.title || $('img', card).alt;
    const file = pdf || svg || vPages[0];
    vOpen.href = file; vDown.href = file;
    vDown.setAttribute('download', file.split('/').pop());
    vOpen.textContent = pdf ? 'Åbn PDF ↗' : 'Åbn original ↗';
    vDown.hidden = false;
    if (card.dataset.link) { vOpen.href = card.dataset.link; vOpen.textContent = card.dataset.linkLabel || 'Åbn ↗'; vDown.hidden = true; }
    vThumbs.innerHTML = vPages.length > 1 ? vPages.map((p, i) => `<button type="button" aria-label="Gå til side ${i + 1}"><img src="${p}" alt="" loading="lazy"></button>`).join('') : '';
    $$('button', vThumbs).forEach((b, i) => b.addEventListener('click', () => showPage(i)));
    $$('.vnav', viewer).forEach(b => b.hidden = vPages.length < 2);
    lastFocus = document.activeElement;
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    showPage(0);
    $('#viewerClose').focus();
  };
  const closeViewer = () => {
    viewer.hidden = true; vImg.removeAttribute('src');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  cards.forEach(c => { const m = $('.card-media', c); if (m) m.addEventListener('click', () => openViewer(c)); });
  $$('[data-open-card]').forEach(b => b.addEventListener('click', () => openViewer(b.closest('.card'))));
  $$('[data-viewer]').forEach(b => b.addEventListener('click', () => openViewer(b)));
  $('#viewerClose').addEventListener('click', closeViewer);
  $('.vnav.prev').addEventListener('click', () => showPage(vIdx - 1));
  $('.vnav.next').addEventListener('click', () => showPage(vIdx + 1));
  $('.viewer-stage').addEventListener('click', e => { if (e.target === e.currentTarget) closeViewer(); });
  addEventListener('keydown', e => {
    if (viewer.hidden) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowRight') showPage(vIdx + 1);
    if (e.key === 'ArrowLeft') showPage(vIdx - 1);
    if (e.key === 'Tab') { // hold fokus inde i dialogen
      const f = $$('a[href], button:not([hidden])', viewer).filter(x => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  let touchX = null;
  viewer.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50 && vPages.length > 1) showPage(vIdx + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Motion: korte videoer spiller, når de er i billedet ---------- */
  const mvids = $$('.mvid');
  const setSound = (btn, on) => { btn.setAttribute('aria-pressed', on); btn.setAttribute('aria-label', on ? 'Slå lyd fra' : 'Slå lyd til'); };
  // kun én video ad gangen må have lyd
  const quietOthers = keep => mvids.forEach(v => {
    if (v === keep) return;
    if (v.hasAttribute('data-autoplay')) { v.muted = true; const b = v.parentElement.querySelector('.msound'); if (b) setSound(b, false); }
    else if (!v.paused) v.pause();
  });
  // reducer bevægelse: ingen autoplay, i stedet almindelige kontroller
  if (reduceMotion) mvids.forEach(v => {
    if (!v.hasAttribute('data-autoplay')) return;
    v.removeAttribute('data-autoplay'); v.controls = true; v.muted = false;
    const btn = v.parentElement.querySelector('.msound'); if (btn) btn.remove();
  });
  const autoVids = mvids.filter(v => v.hasAttribute('data-autoplay'));
  if (autoVids.length) {
    const vio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause(); }), { threshold: 0.35 });
    autoVids.forEach(v => vio.observe(v));
  }
  $$('.msound').forEach(btn => btn.addEventListener('click', () => {
    const v = btn.parentElement.querySelector('video'), on = v.muted;
    if (on) { quietOthers(v); v.currentTime = 0; }
    v.muted = !on; setSound(btn, on);
    v.play().catch(() => {});
  }));
  mvids.forEach(v => v.addEventListener('play', () => { if (!v.muted) quietOthers(v); }));

  /* ---------- Kopiér e-mail ---------- */
  const toast = $('.toast');
  const showToast = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove('show'), 2200); };
  $('#copyMail').addEventListener('click', async e => {
    const mail = e.currentTarget.dataset.mail;
    if (matchMedia('(pointer: coarse)').matches) { location.href = 'mailto:' + mail; return; } // telefon: åbn mail med ét tryk
    try { await navigator.clipboard.writeText(mail); showToast('E-mail kopieret ✓'); }
    catch (err) { location.href = 'mailto:' + mail; }
  });

  /* ---------- Mini-bot: "Spørg Sinan" ---------- */
  const qa = [
    { q: 'Hvem er du?', a: 'Jeg hedder Sinan Polat og er multimediedesigner. Jeg er ved at afslutte min professionsbachelor i Digital Konceptudvikling og har arbejdet som studentermedhjælper og praktikant i KOMBITs kommunikationsafdeling.' },
    { q: 'Hvad søger du?', a: 'En rolle inden for UX og brugerresearch, gerne hvor komplekst indhold eller data skal gøres brugbart for rigtige mennesker. Det offentlige og B2B-tunge domæner er mit hjemmebane.' },
    { q: 'Hvad handler dit bachelorprojekt om?', a: 'Valg.dk som dataformidlingsplatform. Jeg undersøger, hvordan borgere, journalister, analytikere og kommunale medarbejdere finder data, og designer en ny informationsstruktur med indgange efter brugergruppe. <a href="/cases/#valg">Se det her</a>.' },
    { q: 'Hvad lavede du i praktikken?', a: 'Jeg lavede en WSJF-præsentation, der blev brugt i workshops med produktejere, og en skabelon til brugerevents i konceptet Brugerfokus. Du kan også se de materialer, jeg har lavet i KOMBIT. <a href="/materialer/">Se materialerne her</a>.' },
    { q: 'Laver du også hjemmesider?', a: 'Ja. Jeg er ved at lave en ny hjemmeside til Lyng Ventilation, et ventilationsfirma i Greve, med indeklima-tjek og AI-chatbot. Koncept, UX, design og kode, skrevet sammen med Claude. <a href="/cases/#lyng">Se casen her</a>.' },
    { q: 'Hvilke værktøjer bruger du?', a: 'Figma til wireframes og prototyper, InDesign og Illustrator til tryk og layout, og HTML, CSS og JavaScript til web.' },
    { q: 'Har du selv kodet siden?', a: 'Ikke alene 😄 Indhold, design og idéer er mine, men koden er skrevet sammen med Claude, en AI-assistent. Prikken i logoet fik også øjne på den måde. <a href="/om/#bag-om-siden">Se samtalen her</a>.' },
    { q: 'Kan jeg se dit CV?', a: 'Selvfølgelig! <a href="/pdf/CV-Sinan-Polat.pdf" target="_blank" rel="noopener">Åbn mit CV her</a> eller <a href="/pdf/CV-Sinan-Polat.pdf" download="CV-Sinan-Polat.pdf">download det som PDF</a>.' },
    { q: 'Hvordan kontakter jeg dig?', a: 'Skriv til <a href="mailto:sinanp2020@hotmail.com">sinanp2020@hotmail.com</a> eller ring på <a href="tel:+4550584245">5058 4245</a>. Jeg svarer hurtigt 😊' }
  ];
  const botBtn = $('#botBtn'), botPanel = $('#botPanel'), log = $('.bot-log'), chips = $('.bot-chips');
  const asked = new Set();
  const say = (html, who) => {
    const m = document.createElement('div');
    m.className = 'msg ' + who; m.innerHTML = html;
    log.appendChild(m); log.scrollTop = log.scrollHeight;
    return m;
  };
  const renderChips = () => {
    chips.innerHTML = '';
    qa.forEach((x, i) => {
      if (asked.has(i)) return;
      const b = document.createElement('button'); b.type = 'button'; b.textContent = x.q;
      b.addEventListener('click', () => ask(i)); chips.appendChild(b);
    });
    if (!chips.children.length) chips.innerHTML = '<span class="msg him" style="margin:0">Det var alle mine svar. Skriv endelig til mig! ✉️</span>';
  };
  const ask = i => {
    asked.add(i); chips.innerHTML = '';
    say(qa[i].q, 'me');
    const typing = say('<span class="typing"><i></i><i></i><i></i></span>', 'him');
    setTimeout(() => { typing.innerHTML = qa[i].a; log.scrollTop = log.scrollHeight; renderChips(); }, reduceMotion ? 0 : 700 + qa[i].a.length * 4);
  };
  const toggleBot = open => {
    botPanel.hidden = !open;
    botBtn.setAttribute('aria-expanded', open);
    botBtn.classList.toggle('hidden', open);
    if (open && !log.children.length) { say('Hej! 👋 Jeg er Sinans lille bot. Hvad vil du gerne vide?', 'him'); renderChips(); }
    if (open) setTimeout(() => (chips.querySelector('button') || botPanel).focus?.(), 50);
  };
  botBtn.addEventListener('click', () => toggleBot(true));
  // på små skærme: vis først botten efter toppen, og gem den ved kontaktsektionen
  const botEl = $('#bot'), contactEl = $('#kontakt'), heroEl = $('.hero');
  const tuck = () => {
    if (innerWidth > 640 || !botPanel.hidden) { botEl.classList.remove('tucked'); return; }
    const pastHero = scrollY > (heroEl ? heroEl.offsetHeight : 200) * .6;
    const atContact = contactEl.getBoundingClientRect().top < innerHeight * .85;
    botEl.classList.toggle('tucked', !pastHero || atContact);
  };
  addEventListener('scroll', tuck, { passive: true }); addEventListener('resize', tuck); tuck();
  $('.bot-x').addEventListener('click', () => { toggleBot(false); botBtn.focus(); });

  /* ---------- Hilsen til nysgerrige udviklere ---------- */
  console.log('%cHej udvikler 👋', 'font:600 20px Georgia;color:#E9532B');
  console.log('Denne side er lavet af Sinan Polat i HTML, CSS og vanilla JavaScript.\nSkriv til sinanp2020@hotmail.com');
  /* ---------- Filter fra adressen (fx /materialer/#tryk) ---------- */
  const hashFilter = location.hash.slice(1);
  if (hashFilter) { const fb = $(`.filters button[data-filter="${hashFilter}"]`); if (fb) fb.click(); }
})();
