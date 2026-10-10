/* Mobile : le film est une vraie vidéo rendue à l'avance (nette sur tous les téléphones, démarrage immédiat).
   La 3D en direct reste sur grand écran (scene.js). Sous-titres et chapitres restent du texte, calés sur la vidéo. */
import {t as T, getLang, onLang} from './i18n.js';

const FILM = 46, STEPS = [.08, .27, .57, .70, .83, 1];
const root = document.documentElement;
const stage = document.getElementById('stage'), poster = document.getElementById('poster');
const chaps = [...document.querySelectorAll('.chap')];
const rail = [...document.querySelectorAll('.rail i')];
const playBtn = document.getElementById('film-play');

const v = document.createElement('video');
v.id = 'film-video'; v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
const src = l => `assets/film-mobile-${l === 'fr' ? 'fr' : 'en'}.mp4`;
v.poster = `assets/film-mobile-${getLang() === 'fr' ? 'fr' : 'en'}.jpg`;
v.src = src(getLang());
v.currentTime = .7; /* démarre sur l'image de l'affiche, sans fondu depuis le blanc */
poster.after(v);

let wantPlay = true, visible = true;
const sync = () => { if (wantPlay && visible && !document.hidden) v.play().catch(() => {}); else v.pause(); };
function setPlaying(on) {
  wantPlay = on; sync();
  if (playBtn) { playBtn.classList.toggle('paused', !on); playBtn.setAttribute('aria-label', T(on ? 'film.pause' : 'film.play')); }
}
v.addEventListener('playing', () => root.classList.add('gl-on', 'vid-on'), {once: true});
if (playBtn) playBtn.addEventListener('click', () => setPlaying(!wantPlay));
rail.forEach((r, i) => {
  const go = () => { v.currentTime = (STEPS[i] + .004) * FILM; setPlaying(true); };
  r.addEventListener('click', go); r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
});
onLang(l => { const at = v.currentTime; v.src = src(getLang()); v.currentTime = at; sync(); setPlaying(wantPlay); });
new IntersectionObserver(es => { visible = es[0].isIntersecting; sync(); }).observe(stage);
document.addEventListener('visibilitychange', sync);

const clamp = x => Math.min(1, Math.max(0, x));
const seg = (x, a, b) => clamp((x - a) / (b - a));
const sm = x => x * x * (3 - 2 * x);
function frame() {
  const P = clamp(v.currentTime / FILM);
  chaps.forEach(c => {
    if (c.id === 'top') { c.style.opacity = 1; c.classList.add('on'); return; }
    const a = parseFloat(c.dataset.a), b = parseFloat(c.dataset.b);
    const op = Math.min(a <= 0 ? 1 : sm(seg(P, a, a + .022)), b > 1 ? 1 : 1 - sm(seg(P, b - .022, b)));
    c.style.opacity = op.toFixed(3);
    const ty = (a <= 0 ? 0 : (1 - sm(seg(P, a, a + .03))) * 26) - (b > 1 ? 0 : sm(seg(P, b - .03, b)) * 18);
    c.style.setProperty('--ty', (ty * .6).toFixed(1) + 'px');
    c.classList.toggle('on', op > .5);
  });
  const k = P < .08 ? -1 : P < .27 ? 0 : P < .57 ? 1 : P < .70 ? 2 : P < .83 ? 3 : 4;
  rail.forEach((r, i) => { r.classList.toggle('on', i === k); r.classList.toggle('done', i < k); r.style.setProperty('--f', i === k ? seg(P, STEPS[i], STEPS[i + 1]).toFixed(3) : (i < k ? 1 : 0)); });
  requestAnimationFrame(frame);
}
setPlaying(true); requestAnimationFrame(frame);
