/* Accueil sous le film : barre du haut, apparitions, comparatif, étapes, onglets, accordéon.
   IntersectionObserver et ResizeObserver seulement : aucun écouteur de défilement.
   Tout ce qui s'anime passe par transform, opacité ou stroke-dashoffset (voir style.css).
   Sans IntersectionObserver, rien n'est caché : la page s'affiche telle quelle. */
import { onLang } from './i18n.js';

const de = document.documentElement;
const hasIO = 'IntersectionObserver' in window;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

/* 1. Barre du haut : opaque une fois le film passé, lien actif selon la section visible. */
(function header() {
  const hd = $('header.top'), mr = $('main.rest');
  if (!hd) return;
  let past = false;
  /* bannière toujours pleine : logo et menu restent visibles, la page défile dessous */
  const solid = () => hd.classList.add('solid');
  const bg = $('.burger', hd), mn = $('#menu');
  if (bg && mn) {
    const open = on => { hd.classList.toggle('open', on); bg.setAttribute('aria-expanded', on ? 'true' : 'false'); };
    bg.addEventListener('click', e => { e.stopPropagation(); open(!hd.classList.contains('open')); });
    mn.addEventListener('click', e => { if (e.target.closest('a')) open(false); });
    document.addEventListener('click', e => { if (!hd.contains(e.target)) open(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });
  }
  if (mr && hasIO) {
    new IntersectionObserver(es => { past = es[es.length - 1].isIntersecting; solid(); }, { rootMargin: '0px 0px -50% 0px' }).observe(mr);
  }
  addEventListener('load', solid);
  solid();
  const links = $$('nav.main a[href^="#"]');
  if (!hasIO || !links.length) return;
  const map = {};
  links.forEach(a => { map[a.getAttribute('href').slice(1)] = a; });
  const spy = new IntersectionObserver(es => es.forEach(e => {
    const a = map[e.target.id];
    if (!a) return;
    if (e.isIntersecting) { links.forEach(l => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
    else if (a.getAttribute('aria-current')) a.removeAttribute('aria-current');
  }), { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(map).forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });
})();

/* 2. Titres : chaque mot sort d'un masque. Les textes viennent de i18n.js, donc on redécoupe à chaque changement de langue. */
function split(el) {
  if (el.querySelector('.w')) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  let i = 0;
  nodes.forEach(tn => {
    const frag = document.createDocumentFragment();
    tn.nodeValue.split(/([ \t\n\r\f]+)/).forEach(part => {
      if (!part) return;
      if (/^[ \t\n\r\f]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      const w = document.createElement('span'); w.className = 'w';
      const wi = document.createElement('span'); wi.className = 'wi';
      wi.style.setProperty('--wi', i++);
      wi.textContent = part;
      w.appendChild(wi); frag.appendChild(w);
    });
    tn.parentNode.replaceChild(frag, tn);
  });
}
const titles = $$('[data-split]');
titles.forEach(split);
onLang(() => titles.forEach(split));

/* 3. Apparitions : une seule fois par bloc. .rv = bloc simple (la classe part une fois l'effet fini), le reste garde .in. */
if (hasIO) {
  const reveal = new IntersectionObserver(es => {
    let k = 0;
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      reveal.unobserve(el);
      if (el.classList.contains('rv')) {
        el.style.setProperty('--d', Math.min(k, 4) * 70 + 'ms');
        const done = ev => {
          if (ev.target !== el || ev.propertyName !== 'opacity') return;
          el.classList.remove('rv', 'in');
          el.style.removeProperty('--d');
          el.removeEventListener('transitionend', done);
        };
        el.addEventListener('transitionend', done);
      }
      k++;
      el.classList.add('in');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('main.rest [data-split], main.rest .rv, .vs, .s3, .cs, .stg, .go').forEach(el => reveal.observe(el));

  /* Les boucles (agitation, flux de données, pulsation) ne tournent que pendant que le bloc est à l'écran. */
  const live = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.isIntersecting)), { rootMargin: '8% 0px' });
  $$('.vs, .s3').forEach(el => live.observe(el));
}

/* 4. Pour qui : une bande de métiers, avec un repère qui glisse d'un métier à l'autre. */
(function tabs() {
  const cs = $('#cs');
  if (!cs) return;
  const bar = $('.cs-bar', cs), list = $('.cs-tabs', cs), tabs = $$('.cs-tab', cs), panels = $$('.cs-p', cs);
  let cur = 0;
  const place = () => {
    const t = tabs[cur];
    cs.style.setProperty('--ix', list.offsetLeft + t.offsetLeft + 'px');
    cs.style.setProperty('--iy', list.offsetTop + t.offsetTop + 'px');
    cs.style.setProperty('--iw', t.offsetWidth + 'px');
    cs.style.setProperty('--ih', t.offsetHeight + 'px');
  };
  const sel = (i, focus) => {
    cur = i;
    tabs.forEach((t, j) => {
      const on = j === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    place();
    if (focus) tabs[i].focus({ preventScroll: true });
    if (bar.scrollWidth > bar.clientWidth + 2) {
      bar.scrollTo({ left: list.offsetLeft + tabs[i].offsetLeft - (bar.clientWidth - tabs[i].offsetWidth) / 2, behavior: reduce.matches ? 'auto' : 'smooth' });
    }
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => sel(i));
    t.addEventListener('keydown', e => {
      let n = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n >= 0) { e.preventDefault(); sel(n, true); }
    });
  });
  sel(0);
  requestAnimationFrame(() => requestAnimationFrame(() => cs.classList.add('ready')));
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(bar);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  onLang(place);
})();

/* 5. Bouton principal : il suit le pointeur de quelques pixels (souris seulement, jamais en mouvement réduit). Le mouvement est une transition CSS : interruptible. */
(function magnet() {
  const mag = $('.mag');
  if (!mag || reduce.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const area = mag.parentElement;
  let mx = 0, my = 0;
  const set = (x, y) => { mx = x; my = y; mag.style.setProperty('--mx', x + 'px'); mag.style.setProperty('--my', y + 'px'); };
  area.addEventListener('pointermove', e => {
    const r = mag.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2 - mx), dy = e.clientY - (r.top + r.height / 2 - my);
    if (Math.hypot(dx, dy) > 170) { set(0, 0); return; }
    set(Math.max(-10, Math.min(10, dx * 0.16)), Math.max(-6, Math.min(6, dy * 0.2)));
  });
  area.addEventListener('pointerleave', () => set(0, 0));
})();
