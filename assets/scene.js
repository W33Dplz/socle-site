import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {t as T, onLang} from './i18n.js';

const Q = new URLSearchParams(location.search);
const MOBILE = innerWidth < 760;
const STILL = Q.has('still'); if (STILL) document.body.classList.add('still');
const root = document.documentElement;

/* ------------------------------------------------------------------ renderer */
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias: !MOBILE || Q.has('pr'), alpha: true, preserveDrawingBuffer: Q.has('cap'), powerPreference: 'high-performance'});
} catch (e) { root.classList.add('nogl'); throw e; }
/* Résolution plafonnée puis ajustée en continu selon le temps réel d'une image (voir boucle). */
const PR_MAX = Q.has('pr') ? parseFloat(Q.get('pr')) : Math.min(devicePixelRatio || 1, MOBILE ? 1.25 : 1.5), PR_MIN = MOBILE ? .7 : .8;
let PR = PR_MAX;
renderer.setPixelRatio(PR);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, 1, 500);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

scene.add(new THREE.HemisphereLight('#ffffff', '#e8e0cf', 0.9));
const sun = new THREE.DirectionalLight('#fff3dc', 2.3);
sun.position.set(-12, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 1536, MOBILE ? 1024 : 1536);
Object.assign(sun.shadow.camera, {left: -36, right: 36, top: 36, bottom: -36, near: 5, far: 130});
sun.shadow.radius = 5; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
scene.add(sun);
const fill = new THREE.DirectionalLight('#dbe8ff', 0.5); fill.position.set(22, 12, -14); scene.add(fill);

/* ------------------------------------------------------------------ helpers */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const sm = x => x * x * (3 - 2 * x);
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eb = x => { x = clamp(x); const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, t) => a + (b - a) * t;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const C = {erp: '#E8A33D', crm: '#E0589F', tab: '#3FB27F', mail: '#4A8CF2', doc: '#8B6BEA', pt: '#F26D5B'};
const TINT = {erp: '#fdf0d6', crm: '#fbe0ee', tab: '#dff4e9', mail: '#e0ecfd', doc: '#ebe5fb', pt: '#fde4df'};
const DARK = {erp: '#c2801f', crm: '#b23a7f', tab: '#2b8a5f', mail: '#2f6ad0', doc: '#6a4cc8', pt: '#d24c3b'};
const BRAND = '#2f4b9c', NAVY = '#1f2f5c';

const matCache = {};
function mat(c, o = {}) {
  const k = c + JSON.stringify(o);
  return matCache[k] || (matCache[k] = new THREE.MeshStandardMaterial({color: c, roughness: o.r ?? .72, metalness: o.m ?? 0, envMapIntensity: o.env ?? .55, emissive: o.e ?? '#000000', emissiveIntensity: o.ei ?? 0}));
}
function add(parent, geo, color, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color, o) : color);
  m.position.set(x, y, z); m.castShadow = o.cast !== false; m.receiveShadow = true; parent.add(m); return m;
}
function rb(parent, w, h, d, r, color, x = 0, y = 0, z = 0, o = {}) {
  r = Math.max(.004, Math.min(r, w / 2 - .003, h / 2 - .003, d / 2 - .003));
  return add(parent, new RoundedBoxGeometry(w, h, d, o.seg || 3, r), color, x, y + h / 2, z, o);
}
const rbox = (parent, w, d, h, r, color, x, y, z, o) => rb(parent, w, h, d, r, color, x, y, z, o);
function roundedShape(w, d, r) {
  r = Math.max(.01, Math.min(r, w / 2 - .01, d / 2 - .01));
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + d - r);
  s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s;
}
function rgeo(w, d, h, r, bevel = .05) {
  const g = new THREE.ExtrudeGeometry(roundedShape(w, d, r), {depth: Math.max(.01, h - 2 * bevel), bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 14});
  g.rotateX(-Math.PI / 2); g.translate(0, bevel, 0); return g;
}
function prismGeo(w, h, d) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: false}); g.translate(0, 0, -d / 2); return g;
}
const cyl = (parent, rt, rbm, h, color, x, y, z, seg = 32, o = {}) => add(parent, new THREE.CylinderGeometry(rt, rbm, h, seg), color, x, y + h / 2, z, o);
const box = (parent, w, h, d, color, x, y, z, o = {}) => add(parent, new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z, o);
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/* ------------------------------------------------------------------ sol et monde */
const FLOOR = -3.4;
const world = new THREE.Group(); scene.add(world);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.ShadowMaterial({opacity: .12, color: 0x3a4466}));
floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR; floor.receiveShadow = true; scene.add(floor);

/* ------------------------------------------------------------------ îlots (outils) */
const TOP = .76;
function buildERP(g) {
  const m = C.erp, d = DARK.erp;
  rbox(g, 3.5, 2.1, 1.6, .15, m, 0, TOP, -.3);
  for (let i = 0; i < 3; i++) add(g, prismGeo(1.15, .7, 2.1), d, -1.15 + i * 1.15, TOP + 1.6, -.3);
  cyl(g, .2, .24, 1.1, '#fff6e4', 1.35, TOP + 1.5, -.9, 16); cyl(g, .26, .2, .12, d, 1.35, TOP + 2.5, -.9, 16);
  rbox(g, .9, 1.1, .1, .05, '#9a6a1a', -.7, TOP, .9, {seg: 2});
  box(g, .9, 1.0, .08, '#7a521a', 0, TOP, .78);
  for (let i = 0; i < 4; i++) box(g, .34, .4, .06, '#fff8e8', -1.3 + i * .62, TOP + .9, .77);
  box(g, .55, .5, .55, '#f2c070', -2.1, TOP, .9); box(g, .5, .45, .5, '#efb85c', -1.9, TOP, 1.45); box(g, .5, .4, .5, '#f2c070', -2.05, TOP + .5, .95);
  // coffre-fort
  rbox(g, .95, .95, .8, .12, '#6b5420', 2.35, TOP, -.3, {seg: 2});
  const dial = add(g, new THREE.CylinderGeometry(.24, .24, .07, 24), '#e8c36a', 2.35, TOP + .5, .14); dial.rotation.x = Math.PI / 2;
  box(g, .05, .22, .05, '#3a2a0a', 2.35, TOP + .4, .2); rbox(g, .1, .34, .1, .03, '#e8c36a', 2.0, TOP + .3, .12, {seg: 2});
}
function buildCRM(g) {
  rbox(g, 3.4, 2.0, 1.6, .15, '#ffffff', 0, TOP, -.4);
  rbox(g, 3.7, 2.3, .3, .1, C.crm, 0, TOP + 1.6, -.35, {seg: 2});
  for (let i = 0; i < 6; i++) { const a = rbox(g, .6, 1.0, .12, .04, i % 2 ? '#ffffff' : C.crm, -1.5 + i * .6, TOP + 1.2, .9, {seg: 2}); a.rotation.x = .38; }
  box(g, 2.3, .95, .06, '#cfe7f5', -.2, TOP + .12, .42, {r: .2});
  for (let i = 0; i < 3; i++) rbox(g, .42, .42, .42, .08, ['#f8b4d0', '#ffd98a', '#a9d6f5'][i], -.9 + i * .72, TOP + .12, .62, {seg: 2});
  box(g, .55, 1.05, .06, DARK.crm, 1.3, TOP, .42);
  rbox(g, 1.7, .5, 1.0, .1, '#f4d9e6', 0, TOP, 1.5, {seg: 2}); // comptoir
  const st = canvasTex(256, 256, (x, w, h) => { x.fillStyle = C.crm; x.fillRect(0, 0, w, h); glyph('client', x, w, '#ffffff'); });
  const sm_ = new THREE.MeshStandardMaterial({color: C.crm, roughness: .6});
  const sg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, .14), [sm_, sm_, sm_, sm_, new THREE.MeshStandardMaterial({map: st, roughness: .6}), sm_]);
  sg.position.set(0, TOP + 2.45, -.05); sg.castShadow = true; g.add(sg);
}
function buildTab(g) {
  const hs = [[.5, 1.1, .7, 1.6, .9], [1.3, .6, 1.8, .8, 1.2], [.7, 1.5, .5, 1.0, .6], [.9, .6, 1.2, .5, 1.4]];
  g.userData.cells = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    const h = hs[r][c], header = r === 0;
    const col = header ? DARK.tab : ((r + c) % 3 === 0 ? '#ffffff' : ((r + c) % 3 === 1 ? '#7fd6a8' : '#bdebd2'));
    const m = rbox(g, .78, .78, header ? .35 : h, .12, col, -1.9 + c * .95, TOP, -1.45 + r * .95); g.userData.cells.push(m);
  }
}
function buildMail(g) {
  rbox(g, 3.4, 2.3, 1.5, .15, '#ffffff', 0, TOP, -.2);
  const roof = add(g, prismGeo(3.6, 1.0, 2.5), C.mail, 0, TOP + 1.5, -.2); roof.rotation.y = Math.PI / 2;
  const tex = canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#4A8CF2'; x.lineWidth = 14; x.lineJoin = 'round';
    x.strokeRect(24, 30, w - 48, h - 60); x.beginPath(); x.moveTo(24, 30); x.lineTo(w / 2, h * .58); x.lineTo(w - 24, 30); x.stroke();
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.15), new THREE.MeshStandardMaterial({map: tex, roughness: .6}));
  p.position.set(0, TOP + .85, .56); g.add(p);
  cyl(g, .05, .05, .8, '#9aa3b8', 1.9, TOP, 1.3, 8); rbox(g, .5, .3, .34, .1, C.mail, 1.9, TOP + .78, 1.3, {seg: 2}); box(g, .04, .2, .1, '#fff', 2.12, TOP + .84, 1.3);
}
function buildDoc(g) {
  rbox(g, 1.9, 2.5, 1.4, .12, C.doc, -.4, TOP, -.3);
  for (let i = 0; i < 4; i++) { rbox(g, 1.6, .52, .06, .05, '#f4effd', -.4, TOP + .2 + i * .58, .42, {seg: 2}); box(g, .5, .07, .08, '#fff', -.4, TOP + .42 + i * .58, .5); }
  for (let i = 0; i < 7; i++) rbox(g, 1.1, .09, 1.5, .06, i % 2 ? '#ffffff' : '#e3dafa', 1.6 + (i % 3) * .04, TOP + i * .1, .1 + (i % 2) * .05, {seg: 2});
  for (let i = 0; i < 4; i++) rbox(g, .9, .08, 1.2, .05, i % 2 ? '#ffffff' : '#d9ccf8', 1.55, TOP + i * .1, -1.45, {seg: 2});
  for (let i = 0; i < 4; i++) rbox(g, .3, .36, .5, .04, i % 2 ? '#bba7f3' : '#d9cdf9', -1.1 + i * .42, TOP + 2.5, -.3, {seg: 2});
}
function buildPt(g) {
  rbox(g, 2.2, 2.2, 2.0, .14, C.pt, 0, TOP, -.2);
  rbox(g, 1.6, 1.6, 1.3, .12, '#f98f80', 0, TOP + 2.0, -.2);
  const c = add(g, new THREE.ConeGeometry(1.25, 1.0, 4), DARK.pt, 0, TOP + 3.8, -.2); c.rotation.y = Math.PI / 4;
  g.userData.hands = [];
  const face = (rx, ry, rz, rot) => {
    const f = new THREE.Group(); f.position.set(rx, ry, rz); f.rotation.y = rot; f.scale.setScalar(1.75); g.add(f);
    const d = add(f, new THREE.CylinderGeometry(.5, .5, .08, 40), '#ffffff'); d.rotation.x = Math.PI / 2;
    for (const [len, w] of [[.34, .05], [.24, .065]]) { const pv = new THREE.Group(); pv.position.set(0, 0, .06); f.add(pv); box(pv, w, len, .04, '#2b3550', 0, 0, 0); g.userData.hands.push(pv); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(f, .03, .07, .03, '#9aa3b8', Math.sin(a) * .41, Math.cos(a) * .41 - .035, .06); }
  };
  face(0, TOP + 2.65, .5, 0); face(.85, TOP + 2.65, -.2, Math.PI / 2);
  for (let i = 0; i < 4; i++) box(g, .05, .36, .5, '#fff1ee', -.7 + i * .46, TOP + .8, .92);
  cyl(g, .07, .07, .8, '#2b3550', -1.9, TOP, 1.2, 8); cyl(g, .07, .07, .8, '#2b3550', -1.2, TOP, 1.2, 8); box(g, .78, .07, .07, C.pt, -1.55, TOP + .55, 1.2);
}

const SPREAD = 1.2;
const DEF = {
  tab:  {x: -13.5, z: -9.6, y0: 6.6, tx: -.04, tz: .05,  ry: -.1,  tree: [2.75, -2.0], build: buildTab},
  erp:  {x: -13.5, z: 0,    y0: 3.0, tx: .05,  tz: -.04, ry: .12,  tree: [2.0, 1.9],   build: buildERP},
  crm:  {x: -13.5, z: 9.6,  y0: 4.8, tx: -.05, tz: -.03, ry: .1,   tree: [-2.7, -1.9], build: buildCRM},
  mail: {x: 13.5,  z: -9.6, y0: 1.8, tx: .05,  tz: .03,  ry: .08,  tree: [-2.6, -1.9], build: buildMail},
  doc:  {x: 13.5,  z: 0,    y0: 5.6, tx: -.05, tz: -.05, ry: -.14, tree: [-2.7, 1.9],  build: buildDoc},
  pt:   {x: 13.5,  z: 9.6,  y0: 3.8, tx: .04,  tz: -.04, ry: .1,   tree: [2.4, 1.9],   build: buildPt},
};
const KEYS = Object.keys(DEF);
const UNDER = ['#e2dccd', '#d2cab7', '#c1b8a3'];

function tree(s = 1, blossom = false, seed = 0) {
  const g = new THREE.Group(); g.scale.setScalar(s);
  const GREENS = ['#7fcf9e', '#5bb87f', '#9fdcb0', '#6ec59a'];
  cyl(g, .09, .12, .7, '#b88a63', 0, 0, 0, 8);
  const col = blossom ? ['#f7aabd', '#f58fa8', '#fbc3cf'][seed % 3] : GREENS[seed % 4];
  const crown = new THREE.Group(); crown.position.y = .7; g.add(crown);
  add(crown, new THREE.IcosahedronGeometry(.55, 1), col, 0, .3, 0); add(crown, new THREE.IcosahedronGeometry(.4, 1), col, .28, .65, .1); add(crown, new THREE.IcosahedronGeometry(.36, 1), col, -.25, .6, -.1);
  g.userData.crown = crown; g.userData.seed = seed;
  return g;
}

for (const k of KEYS) {
  const o = DEF[k]; const g = new THREE.Group(); world.add(g); o.g = g;
  const w = 6.6, d = 5.4;
  rbox(g, w + .4, d + .4, .22, .9, C[k], 0, 0, 0);
  rbox(g, w, d, .5, .8, TINT[k], 0, .22, 0);
  rbox(g, w - 1.4, d - 1.4, .04, .5, '#ffffff', 0, .72, 0, {cast: false});
  const under = new THREE.Group(); g.add(under); o.under = under;
  let y = 0;
  [[.84, 1.35], [.6, 1.25], [.36, 1.1]].forEach(([s, h], i) => { y -= h; rbox(under, (w + .4) * s, (d + .4) * s, h + .05, .6, UNDER[i], 0, y, 0, {seg: 2}); });
  o.build(g);
  const t = tree(.85, false, KEYS.indexOf(k)); t.position.set(o.tree[0], TOP, o.tree[1]); g.add(t); (o.trees = [t]);
}

/* ------------------------------------------------------------------ personnages */
function person(shirt, {pants = '#34405c', hair = '#3a2c28', skin = '#f1c9a5', s = 1} = {}) {
  const g = new THREE.Group();
  const legs = [-.1, .1].map(x => { const p = new THREE.Group(); p.position.set(x, .5, 0); g.add(p); box(p, .14, .5, .16, pants, 0, -.5, 0, {seg: 2}); return p; });
  add(g, new THREE.CapsuleGeometry(.2, .34, 6, 12), shirt, 0, .85, 0);
  add(g, new THREE.SphereGeometry(.17, 16, 12), skin, 0, 1.4, 0);
  add(g, new THREE.SphereGeometry(.18, 16, 10, 0, Math.PI * 2, 0, Math.PI * .55), hair, 0, 1.43, -.01);
  const arms = [-.27, .27].map(x => { const p = new THREE.Group(); p.position.set(x, 1.08, 0); g.add(p); box(p, .1, .4, .1, shirt, 0, -.4, 0); return p; });
  g.userData = {legs, arms}; g.scale.setScalar(s); return g;
}
function walk(p, t, speed = 8, amp = .7) { const u = p.userData; u.legs[0].rotation.x = Math.sin(t * speed) * amp; u.legs[1].rotation.x = -Math.sin(t * speed) * amp; u.arms[0].rotation.x = -Math.sin(t * speed) * amp * .8; u.arms[1].rotation.x = Math.sin(t * speed) * amp * .8; }
function stand(p) { const u = p.userData; u.legs.forEach(l => l.rotation.x = 0); u.arms.forEach(a => a.rotation.x = 0); }
function agent(s = 1) {
  const g = new THREE.Group(); g.scale.setScalar(s);
  rbox(g, .55, .5, .5, .18, '#f4f1ea', 0, .1, 0, {seg: 2});
  const head = new THREE.Group(); g.add(head);
  rbox(head, .7, .5, .55, .2, '#ffffff', 0, .62, 0, {seg: 2});
  rbox(head, .52, .3, .1, .05, '#2b3550', 0, .8, .2, {seg: 2});
  add(head, new THREE.SphereGeometry(.05, 10, 8), '#ffffff', -.12, .85, .34); add(head, new THREE.SphereGeometry(.05, 10, 8), '#ffffff', .12, .85, .34);
  cyl(head, .015, .015, .22, '#9aa3b8', 0, 1.17, 0, 6); add(head, new THREE.SphereGeometry(.07, 12, 10), '#F26D5B', 0, 1.42, 0);
  add(g, new THREE.SphereGeometry(.09, 10, 8), '#e9e3d6', -.38, .35, 0); add(g, new THREE.SphereGeometry(.09, 10, 8), '#e9e3d6', .38, .35, 0);
  g.userData.head = head; return g;
}

/* "?" au-dessus des personnages bloqués */
const qTex = canvasTex(128, 128, (x, w, h) => {
  x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.fill(); x.strokeStyle = '#9aa3b8'; x.lineWidth = 6; x.stroke();
  x.fillStyle = '#1d2433'; x.font = '700 78px "Schibsted Grotesk", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', 64, 70);
});
const patrol = [];
[['erp', 0, 1.8], ['mail', 2, 1.4]].forEach(([k, idx, edge]) => {
  const o = DEF[k]; const p = person(['#6d89d9', '#f2b23a', '#43b581'][idx], {s: 1.5});
  o.g.add(p);
  const q = new THREE.Sprite(new THREE.SpriteMaterial({map: qTex, transparent: true, depthWrite: false})); q.scale.setScalar(1.5); q.center.set(.5, 0); p.add(q); q.position.y = 1.9;
  // trajet : du fond de l'îlot vers le bord qui regarde le vide, puis demi-tour
  const toCenter = V(-o.x, 0, -o.z).normalize();
  patrol.push({p, q, o, a: V(-toCenter.x * 1.0, TOP, -toCenter.z * 1.0), b: V(toCenter.x * 2.6, TOP, toCenter.z * 2.6), ph: idx * 1.7});
});

/* ------------------------------------------------------------------ jetons de données */
function glyph(kind, x, c, col) {
  x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 15; x.lineCap = 'round'; x.lineJoin = 'round';
  const cx = c / 2, cy = c / 2;
  if (kind === 'client') { x.beginPath(); x.arc(cx, cy - 26, 26, 0, 7); x.fill(); x.beginPath(); x.arc(cx, cy + 74, 58, Math.PI * 1.08, Math.PI * 1.92); x.lineWidth = 22; x.stroke(); }
  else if (kind === 'invoice') { x.beginPath(); x.moveTo(cx - 44, cy - 62); x.lineTo(cx + 22, cy - 62); x.lineTo(cx + 46, cy - 38); x.lineTo(cx + 46, cy + 62); x.lineTo(cx - 44, cy + 62); x.closePath(); x.stroke(); x.lineWidth = 11; x.beginPath(); x.moveTo(cx - 22, cy - 6); x.lineTo(cx + 24, cy - 6); x.moveTo(cx - 22, cy + 20); x.lineTo(cx + 24, cy + 20); x.moveTo(cx - 22, cy + 44); x.lineTo(cx + 4, cy + 44); x.stroke(); }
  else if (kind === 'hours') { x.beginPath(); x.arc(cx, cy, 56, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx, cy - 32); x.lineTo(cx, cy); x.lineTo(cx + 26, cy + 16); x.stroke(); }
  else if (kind === 'job') { x.beginPath(); x.moveTo(cx - 58, cy + 4); x.lineTo(cx, cy - 56); x.lineTo(cx + 58, cy + 4); x.stroke(); x.beginPath(); x.rect(cx - 40, cy + 4, 80, 56); x.stroke(); }
}
const iconCache = {};
function iconTex(kind, col, bg) {
  const k = kind + col + (bg || ''); if (iconCache[k]) return iconCache[k];
  return iconCache[k] = canvasTex(256, 256, (x, w, h) => { if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); } glyph(kind, x, w, col); });
}
function tile(kind, color, size = 1, merged = false) {
  const g = new THREE.Group();
  const inner = new THREE.Group(); g.add(inner);
  rb(inner, .95 * size, .95 * size, .2 * size, .2 * size, merged ? '#f6c64a' : color, 0, -.475 * size, 0, {seg: 3, r: .35, env: .8});
  const f = new THREE.Mesh(new THREE.PlaneGeometry(.72 * size, .72 * size), new THREE.MeshBasicMaterial({map: iconTex(kind, merged ? NAVY : '#ffffff'), transparent: true, toneMapped: false}));
  f.position.z = .106 * size; inner.add(f);
  g.userData.inner = inner; g.userData.size = size; return g;
}
/* tuile fusionnée : trois pastilles de couleur sur le bord */
function mergedTile(kind, cols) {
  const g = tile(kind, '#fff', 1.45, true);
  cols.forEach((c, i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), mat(c)); d.position.set((i - 1) * .3 * 1.45, -.475 * 1.45 + .0 - .08, .12 * 1.45); d.position.y = -.44 * 1.45 - .03; g.userData.inner.add(d); });
  return g;
}

const TOKENS = [
  {tool: 'erp', kind: 'client', side: -.8, rot: .38}, {tool: 'erp', kind: 'invoice', side: .8},
  {tool: 'crm', kind: 'client', side: -.8, rot: -.32}, {tool: 'crm', kind: 'job', side: .8},
  {tool: 'tab', kind: 'client', side: -.8, rot: .06}, {tool: 'tab', kind: 'job', side: .8},
  {tool: 'mail', kind: 'job', side: -.8}, {tool: 'mail', kind: 'invoice', side: .8},
  {tool: 'doc', kind: 'job', side: -.8}, {tool: 'doc', kind: 'invoice', side: .8},
  {tool: 'pt', kind: 'hours', side: -.8}, {tool: 'pt', kind: 'job', side: .8},
];
const DIR = {}; // vers le coeur, par outil
KEYS.forEach(k => { const o = DEF[k]; DIR[k] = V(-o.x, 0, -o.z).normalize(); });
const tokenGroup = new THREE.Group(); scene.add(tokenGroup);
TOKENS.forEach((t, i) => {
  const o = DEF[t.tool];
  const perp = V(-DIR[t.tool].z, 0, DIR[t.tool].x);
  t.off = DIR[t.tool].clone().multiplyScalar(1.9).addScaledVector(perp, t.side); t.off.y = 3.2 + (i % 2) * .35;
  t.orig = tile(t.kind, C[t.tool]); tokenGroup.add(t.orig);
  t.clone = tile(t.kind, C[t.tool]); t.clone.visible = false; tokenGroup.add(t.clone);
  t.ph = i * 1.13; t.stag = (i % 5) * .006;
});

/* ------------------------------------------------------------------ nuages */
const clouds = [];
[[-34, 19, -14, 1.2], [30, 21, -22, 1.4], [38, 16, 6, 1.0], [-30, 17, 16, 1.1], [4, 24, -34, 1.5]].forEach(([x, y, z, s], i) => {
  const g = new THREE.Group();
  [[0, 0, 0, 2.4], [2.2, -.3, .3, 1.9], [-2.1, -.4, -.2, 1.8], [.9, .9, .1, 1.7], [-.9, .6, .5, 1.5]].forEach(([a, b, c, r]) => add(g, new THREE.IcosahedronGeometry(r, 2), '#ffffff', a, b, c, {r: .9, cast: false}));
  g.scale.setScalar(s * .9); g.position.set(x, y, z); scene.add(g); clouds.push({g, x, z, i});
});

/* ------------------------------------------------------------------ le SOCLE : plan d'architecte */
const BP_VERT = `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const BP_FRAG = `
precision highp float;
varying vec3 vW;
uniform float uReveal,uGrid,uFill,uSock,uFade,uTime;
uniform vec3 uColor;
uniform vec4 uS[6];
float sdR(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
float line(float d,float w){ float aa=fwidth(d)*1.2; return 1.-smoothstep(w,w+aa,abs(d)); }
void main(){
  vec2 p=vW.xz;
  float a=fract(atan(p.x,p.y)/6.2831853+.5+.06);
  float d=sdR(p,vec2(20.,15.),3.0);
  float ol=line(d,.085)*step(a,uReveal);
  float tip=smoothstep(.05,0.,uReveal-a)*step(a,uReveal)*step(uReveal,.999);
  float ol2=line(sdR(p,vec2(19.,14.),2.2),.03)*step(a,uReveal)*.7;
  // quadrillage
  vec2 g1=abs(fract(p/2.+.5)-.5)*2.; float gl=1.-smoothstep(0.,.045,min(g1.x,g1.y)*1.0);
  vec2 g2=abs(fract(p/10.+.5)-.5)*10.; float gm=1.-smoothstep(0.,.07,min(g2.x,g2.y));
  float inside=1.-smoothstep(-.2,.4,d);
  float rad=1.-smoothstep(14.,36.,length(p));
  float grid=(gl*.28+gm*.4)*uGrid*mix(.35,1.,inside)*rad;
  // emplacements des outils
  float sk=0.; for(int i=0;i<6;i++){ vec4 s=uS[i]; sk=max(sk,line(sdR(p-s.xy,s.zw,.9),.06)); }
  sk*=uSock;
  // coeur
  float rc=length(p); float core=(line(rc-5.6,.06)+line(rc-4.8,.03)*.8)*uSock;
  float dash=step(.5,fract(atan(p.x,p.y)*9.));
  core=max(core*mix(1.,dash,.5),0.);
  // reperes de coin
  vec2 cn=abs(p)-vec2(20.,15.); vec2 ct=abs(cn+vec2(2.6,2.6)); float cross_=max(line(ct.x,.045)*step(ct.y,.9),line(ct.y,.045)*step(ct.x,.9));
  cross_*=step(.0,uReveal-.25);
  float fill=inside*uFill*.085;
  float al=clamp(max(max(ol,ol2),max(sk,core))+grid+cross_*.9,0.,1.);
  vec3 col=uColor;
  col=mix(col,vec3(.12,.2,.48),tip*.8);
  float A=max(al*.95,fill)*uFade;
  gl_FragColor=vec4(col,A);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const bpU = {
  uReveal: {value: 0}, uGrid: {value: 0}, uFill: {value: 0}, uSock: {value: 0}, uFade: {value: 1}, uTime: {value: 0}, uColor: {value: new THREE.Color(BRAND)},
  uS: {value: KEYS.map(k => new THREE.Vector4(DEF[k].x, DEF[k].z, 3.9, 3.3))},
};
const bpMesh = new THREE.Mesh(new THREE.PlaneGeometry(64, 52), new THREE.ShaderMaterial({vertexShader: BP_VERT, fragmentShader: BP_FRAG, uniforms: bpU, transparent: true, depthWrite: false, extensions: {derivatives: true}}));
bpMesh.rotation.x = -Math.PI / 2; bpMesh.position.y = FLOOR + .03; scene.add(bpMesh);

/* ombre portée douce sous le socle */
const csTex = canvasTex(512, 400, (x, w, h) => { x.filter = 'blur(26px)'; x.fillStyle = 'rgba(40,50,90,.55)'; x.beginPath(); x.roundRect(80, 72, w - 160, h - 150, 46); x.fill(); });
const contact = new THREE.Mesh(new THREE.PlaneGeometry(66, 52), new THREE.MeshBasicMaterial({map: csTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0}));
contact.rotation.x = -Math.PI / 2; contact.position.set(2.2, FLOOR + .01, 3.2); contact.renderOrder = 0; scene.add(contact);
/* le socle : dalle massive */
const slab = new THREE.Group(); slab.position.y = FLOOR; scene.add(slab);
const GLOW = {border: null, letters: []};
const slabBase = new THREE.Mesh(rgeo(41.6, 31.6, 1.1, 3.4, .1), new THREE.MeshStandardMaterial({color: '#2b3a6e', roughness: .55, envMapIntensity: .7, emissive: '#5a82ff', emissiveIntensity: 0})); slabBase.castShadow = slabBase.receiveShadow = true; slab.add(slabBase);
const slabMain = new THREE.Mesh(rgeo(40, 30, 2.3, 3, .12), mat('#f1eadb', {r: .78, env: .6})); slabMain.position.y = 1.1; slabMain.castShadow = slabMain.receiveShadow = true; slab.add(slabMain);
const slabTop = new THREE.Mesh(rgeo(39.3, 29.3, .08, 2.7, .02), mat('#fbf8f0', {r: .85, env: .7})); slabTop.position.y = 3.4 - .02; slabTop.receiveShadow = true; slab.add(slabTop);
// filet marine incrusté
{
  const sh = roundedShape(39.0, 29.0, 2.6); sh.holes.push(new THREE.Path(roundedShape(38.6, 28.6, 2.4).getPoints(24).reverse()));
  const g = new THREE.ExtrudeGeometry(sh, {depth: .03, bevelEnabled: false, curveSegments: 20}); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: BRAND, roughness: .6, emissive: '#7aa0ff', emissiveIntensity: 0})); m.position.y = 3.4 + .045; m.receiveShadow = true; slab.add(m); GLOW.border = m;
}
// lettrage SOCLE en relief sur la tranche
const letters = new THREE.Group(); letters.position.set(0, FLOOR + 1.1 + 1.15, 15.1); scene.add(letters); letters.visible = false;
new FontLoader().load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', font => {
  const word = 'SOCLE'; let xcur = 0; const parts = [];
  for (const ch of word) {
    const g = new TextGeometry(ch, {font, size: 1.35, height: .34, curveSegments: 8, bevelEnabled: true, bevelThickness: .035, bevelSize: .025, bevelSegments: 2});
    g.computeBoundingBox(); const w = g.boundingBox.max.x - g.boundingBox.min.x;
    g.translate(-g.boundingBox.min.x, 0, 0); parts.push([g, xcur]); xcur += w + .5;
  }
  const total = xcur - .5;
  parts.forEach(([g, x]) => { const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: NAVY, roughness: .45, envMapIntensity: .8, emissive: '#6b93ff', emissiveIntensity: 0})); GLOW.letters.push(m); m.position.set(x - total / 2, -.68, 0); m.castShadow = true; m.receiveShadow = true; letters.add(m); });
});

/* ------------------------------------------------------------------ pont du dessus : emplacements, veines, coeur */
const deck = new THREE.Group(); scene.add(deck); deck.visible = false;
const sockets = {};
KEYS.forEach(k => {
  const o = DEF[k]; const g = new THREE.Group(); g.position.set(o.x, 0, o.z); deck.add(g);
  rbox(g, 7.9, 6.7, .05, 1.0, C[k], 0, 0, 0, {cast: false, seg: 2});
  rbox(g, 7.5, 6.3, .07, .9, '#fbf9f3', 0, 0, 0, {cast: false, seg: 2});
  sockets[k] = g;
});

/* tracés des veines */
function roundPath(pts, r = 1.6, n = 12) {
  const out = [pts[0].clone()];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const da = a.clone().sub(b), dc = c.clone().sub(b); const ra = Math.min(r, da.length() * .5), rc = Math.min(r, dc.length() * .5);
    const p0 = b.clone().addScaledVector(da.normalize(), ra), p2 = b.clone().addScaledVector(dc.normalize(), rc);
    for (let j = 0; j <= n; j++) { const t = j / n; out.push(p0.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(b, 2 * t * (1 - t)).addScaledVector(p2, t * t)); }
  }
  out.push(pts[pts.length - 1].clone()); return out;
}
function route(S, E) {
  const dx = E.x - S.x, dz = E.z - S.z, ax = Math.abs(dx), az = Math.abs(dz), sx = Math.sign(dx), sz = Math.sign(dz);
  const pts = [S.clone()];
  if (ax >= az) pts.push(V(S.x + sx * (ax - az), 0, S.z)); else pts.push(V(S.x, 0, S.z + sz * (az - ax)));
  pts.push(E.clone()); return pts;
}
function ribbon(pts, hw, y) {
  const n = pts.length; const pos = [], uv = [], idx = []; let L = 0; const cum = [0];
  for (let i = 1; i < n; i++) { L += pts[i].distanceTo(pts[i - 1]); cum.push(L); }
  for (let i = 0; i < n; i++) {
    const t = (pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)])).normalize();
    const nx = -t.z, nz = t.x;
    pos.push(pts[i].x + nx * hw, y, pts[i].z + nz * hw, pts[i].x - nx * hw, y, pts[i].z - nz * hw);
    uv.push(cum[i] / L, 1, cum[i] / L, -1);
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.userData = {L}; return g;
}
const VEIN_FRAG = `
precision highp float; varying vec2 vUv; uniform vec3 uColor; uniform float uFill,uTime,uLen,uFlow,uDir;
void main(){
  float e=smoothstep(1.,.78,abs(vUv.y));
  float fill=step(vUv.x,uFill);
  float lead=smoothstep(uFill-.03,uFill,vUv.x)*fill;
  vec3 base=vec3(.80,.81,.86);
  vec3 col=mix(base,uColor,fill);
  float ph=fract(vUv.x*uLen/3.4*uDir-uTime*.55);
  float pulse=smoothstep(0.,.12,ph)*smoothstep(.42,.12,ph)*fill*uFlow;
  col=mix(col,vec3(1.),pulse*.6);
  col+=lead*.18;
  float core=smoothstep(.55,.2,abs(vUv.y));
  col=mix(col,col*.92,1.-core);
  gl_FragColor=vec4(col,e);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const veins = {};
const CORE_R = 5.7; const BS = 1.3;
KEYS.forEach(k => {
  const o = DEF[k]; const dir = DIR[k];
  const S = V(o.x - Math.sign(o.x) * 3.7, 0, o.z);
  const E = V(0, 0, 0).addScaledVector(S.clone().normalize(), CORE_R - .3);
  const poly = roundPath(route(S, E), 2.2, 14);
  const gGroove = ribbon(poly, .52, .075), gFill = ribbon(poly, .32, .1);
  const groove = new THREE.Mesh(gGroove, new THREE.MeshBasicMaterial({color: '#e7e1d2', transparent: true, opacity: .0}));
  const fillMat = new THREE.ShaderMaterial({vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: VEIN_FRAG, transparent: true, depthWrite: false,
    uniforms: {uColor: {value: new THREE.Color(C[k])}, uFill: {value: 0}, uTime: {value: 0}, uLen: {value: gFill.userData.L}, uFlow: {value: 0}, uDir: {value: 1}}, side: THREE.DoubleSide});
  const fillMesh = new THREE.Mesh(gFill, fillMat); fillMesh.renderOrder = 3; fillMesh.receiveShadow = false;
  deck.add(groove, fillMesh);
  veins[k] = {S, E, poly, L: gFill.userData.L, mat: fillMat, mesh: fillMesh, groove};
});
function polyPos(poly, L, u, y = 1.0) {
  // point à l'abscisse curviligne u (0..1) d'un polyligne
  const target = u * L; let acc = 0;
  for (let i = 1; i < poly.length; i++) { const d = poly[i].distanceTo(poly[i - 1]); if (acc + d >= target || i === poly.length - 1) { const t = d > 0 ? clamp((target - acc) / d) : 0; return V(lerp(poly[i - 1].x, poly[i].x, t), y, lerp(poly[i - 1].z, poly[i].z, t)); } acc += d; }
  return V(poly[0].x, y, poly[0].z);
}

/* tracés décoratifs (circuit) : texture masquée par un rayon qui grandit */
const circuitTex = canvasTex(2048, 1536, (x, w, h) => {
  x.clearRect(0, 0, w, h); const sx = w / 40, sz = h / 30;
  x.strokeStyle = 'rgba(47,75,156,.28)'; x.lineWidth = 3.2; x.lineCap = 'round'; x.lineJoin = 'round'; x.fillStyle = 'rgba(47,75,156,.34)';
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const P = (a, b) => [(a + 20) * sx, (b + 15) * sz];
  const trace = (pts, via = true) => { x.beginPath(); pts.forEach(([a, b], i) => { const [px, py] = P(a, b); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); if (via) { const [px, py] = P(...pts[pts.length - 1]); x.beginPath(); x.arc(px, py, 6, 0, 7); x.fill(); } };
  for (let i = 0; i < 38; i++) {
    const ang = rnd() * Math.PI * 2, r0 = 5.2 + rnd() * 1.2; let a = Math.cos(ang) * r0, b = Math.sin(ang) * r0 * .9; const pts = [[a, b]];
    let dir = Math.round(ang / (Math.PI / 4)) * Math.PI / 4;
    for (let s = 0; s < 4; s++) { const len = 1.8 + rnd() * 4.5; a += Math.cos(dir) * len; b += Math.sin(dir) * len; pts.push([a, b]); dir += (rnd() < .5 ? -1 : 1) * Math.PI / 4; if (Math.abs(a) > 18.6 || Math.abs(b) > 13.6) break; }
    trace(pts);
  }
});
const circuit = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.ShaderMaterial({
  vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader: `precision highp float; varying vec2 vUv; varying vec3 vW; uniform sampler2D uMap; uniform float uR,uTime;
   void main(){ vec4 t=texture2D(uMap,vUv); float r=length(vW.xz*vec2(1.,1.1)); float m=smoothstep(uR,uR-3.,r); float sh=.6+.4*sin(r*.7-uTime*1.2); gl_FragColor=vec4(t.rgb,t.a*m*sh);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
   }`,
  uniforms: {uMap: {value: circuitTex}, uR: {value: 0}, uTime: {value: 0}}, transparent: true, depthWrite: false}));
circuit.rotation.x = -Math.PI / 2; circuit.position.y = .062; circuit.renderOrder = 2; deck.add(circuit);

/* halo doux de lumière sur la dalle, autour du coeur */
const poolTex = canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,248,222,.95)'); g.addColorStop(.45, 'rgba(255,244,214,.45)'); g.addColorStop(1, 'rgba(255,244,214,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const pool = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshBasicMaterial({map: poolTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0}));
pool.rotation.x = -Math.PI / 2; pool.position.y = .058; pool.renderOrder = 1; deck.add(pool);

/* le coeur : tour du cerveau */
const brain = new THREE.Group(); deck.add(brain);
const plinth = new THREE.Group(); brain.add(plinth);
cyl(plinth, 4.5, 4.7, .5, '#ffffff', 0, 0, 0, 72); cyl(plinth, 3.9, 4.1, .34, '#f1ede3', 0, .5, 0, 72);
const arcs = {};
KEYS.forEach(k => {
  const ang = Math.atan2(-veins[k].E.z, veins[k].E.x); DEF[k].ang = ang;
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.8, 24, 1, ang - .36, .72), new THREE.MeshStandardMaterial({color: C[k], roughness: .6, side: THREE.DoubleSide, envMapIntensity: .5}));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .86; ring.receiveShadow = true; plinth.add(ring); arcs[k] = ring;
});
const tower = new THREE.Group(); tower.position.y = .84; brain.add(tower);
cyl(tower, 1.55, 1.8, .45, '#ffffff', 0, 0, 0, 48);
cyl(tower, 1.2, 1.3, 3.1, '#f6f1e6', 0, .45, 0, 48);
const bands = [];
for (let i = 0; i < 6; i++) bands.push(cyl(tower, 1.31, 1.31, .1, '#cfe3fb', 0, .9 + i * .5, 0, 48, {r: .2, cast: false, e: '#ffe9a8', ei: 0}));
const dome = add(tower, new THREE.SphereGeometry(1.25, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), '#8197ea', 0, 3.55, 0, {e: '#ffe9a8', ei: 0});
cyl(tower, .08, .08, .7, '#9aa3b8', 0, 4.75, 0, 8); box(tower, .8, .4, .04, '#F26D5B', .4, 5.05, 0);
const finH = {erp: 3.5, crm: 3.7, tab: 3.9, mail: 4.3, doc: 3.7, pt: 4.1};
KEYS.forEach(k => { const a = DEF[k].ang, R = 1.6; const f = rbox(tower, .5, .7, finH[k], .16, C[k], Math.cos(a) * R, 0, -Math.sin(a) * R, {seg: 2}); f.rotation.y = a; });

/* l'arbre et les petites choses vivantes sur la dalle */
const slabTrees = [];
[[-13.5, -4.8, 1, 0], [13.5, -4.8, .9, 1], [-13.5, 4.8, 1, 2], [13.5, 4.8, .9, 3], [-4.4, -13.2, 1.1, 0], [0.4, -13.8, .8, 1], [4.6, -13.1, 1, 2],
 [3.6, 13.6, 1, 3], [7.6, 13.9, .8, 0], [-8.6, 13.7, .9, 1], [-8.8, -13.6, .9, 2], [8.9, -13.9, .8, 3], [-18.6, -4.8, .8, 1], [18.6, 4.8, .8, 0], [-18.7, 14, .7, 2]].forEach(([x, z, s, i], n) => {
  const t = tree(s, n % 4 === 1, i + n); t.position.set(x, .05, z); t.userData.s0 = s; t.userData.n = n; deck.add(t); slabTrees.push(t);
});
// flux circulaires de cubes sur les veines
const flows = [];
KEYS.forEach(k => { for (let i = 0; i < 4; i++) { const m = rb(deck, .3, .3, .3, .08, C[k], 0, 0, 0, {seg: 2, cast: false}); m.position.y = .42; flows.push({m, k, i}); } });
// équipe : la personne qui demande, son agent
const PX = -2.4, PZ = 12.6;
const asker = person('#1f2d4f', {pants: '#2c3550', hair: '#2a2220', s: 1.25}); asker.position.set(PX, .06, PZ); asker.rotation.y = 2.4; deck.add(asker);
const bot = agent(1.35); bot.position.set(PX + 1.7, .06, PZ + .5); bot.rotation.y = 2.2; deck.add(bot);
rbox(deck, 5.4, 3.6, .05, 1.0, '#ffffff', PX + .85, 0, PZ + .15, {cast: false, seg: 2});
const walkers = [];
['#f2b23a', '#8b6bea', '#43b581', '#f26d5b'].forEach((c, i) => { const p = person(c, {s: 1.0, pants: ['#34405c', '#3d3d52', '#2f4b9c', '#463a35'][i], hair: ['#8a5a2b', '#3a2c28', '#b78a54', '#2a2220'][i]}); deck.add(p); walkers.push({p, ph: i * 1.57, r: 8.0 + (i % 2) * .6, dir: i % 2 ? -1 : 1}); });
// action de retour vers l'ERP (tube orange)
const erpTop = V(DEF.erp.x + .2, 3.9, DEF.erp.z + .3);
const curve = new THREE.CatmullRomCurve3([V(-2.4, 7.4, 1.5), V(-5.5, 8.4, 1.9), V(-9.5, 6.8, 1.0), erpTop.clone().add(V(.8, 1.8, .2)), erpTop]);
const tubeGeo = new THREE.TubeGeometry(curve, 90, .13, 10, false); const tubeIdx = tubeGeo.index.count;
const tube = new THREE.Mesh(tubeGeo, mat(C.erp, {r: .5})); tube.castShadow = true;
const arrow = new THREE.Mesh(new THREE.ConeGeometry(.36, .75, 16), mat(C.erp, {r: .5})); arrow.castShadow = true;
{ const tg = curve.getTangent(1); arrow.position.copy(erpTop).addScaledVector(tg, .18); arrow.quaternion.setFromUnitVectors(V(0, 1, 0), tg); }
deck.add(tube, arrow);
const stampDrop = {}; // pas utilisé

/* jetons fusionnés au-dessus de la tour */
const mClient = mergedTile('client', [C.erp, C.crm, C.tab]); mClient.position.set(-1.7, 17.9, 0); tokenGroup.add(mClient); mClient.visible = false;
const mJob = mergedTile('job', [C.crm, C.mail, C.doc]); mJob.position.set(1.7, 17.9, 0); tokenGroup.add(mJob); mJob.visible = false;
const mArrive = {client: ['erp', 'tab', 'pt'], job: ['tab', 'mail', 'doc']};

/* trajets des jetons copiés */
const SINK = V(0, 6.2, 0);
TOKENS.forEach(t => {
  const vn = veins[t.tool], o = DEF[t.tool];
  const start = V(o.x, 0, o.z).add(t.off); start.y = t.off.y;
  const pts = [start];
  const drop = vn.S.clone(); drop.y = 1.0; pts.push(V(lerp(start.x, drop.x, .5), 1.9, lerp(start.z, drop.z, .5)));
  const n = vn.poly.length; for (let i = 0; i < n; i += 2) pts.push(V(vn.poly[i].x, 1.0, vn.poly[i].z));
  const E = vn.E;
  const merge = t.kind === 'client' ? mClient.position : t.kind === 'job' ? mJob.position : SINK;
  const sink = (t.kind === 'client' || t.kind === 'job');
  pts.push(V(E.x * .62, 2.8, E.z * .62)); pts.push(V(E.x * .34, 9.5, E.z * .34));
  pts.push(V(E.x * .2, 13.5, E.z * .2)); pts.push(sink ? merge.clone() : V(o.x * .56, 16.9, o.z * .56));
  t.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); t.merge = sink;
});

/* ------------------------------------------------------------------ AVANT / APRES : robots, coureur, pastilles, onde */
const softTex = canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
function makeRobot() {
  const g = new THREE.Group(); const m = {};
  const mk = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .5, envMapIntensity: .6, ...o});
  m.body = mk('#b4b9c4'); m.head = mk('#bfc4cd'); m.eye = mk('#7a8396', {emissive: '#ffffff', emissiveIntensity: 0}); m.ball = mk('#9aa3b8'); m.arm = mk('#a9aeba'); m.visor = mk('#2b3550');
  const rbm = (w, h, d, r, mt, x, y, z, p = g) => { const me = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), mt); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; p.add(me); return me; };
  rbm(.55, .5, .5, .16, m.body, 0, .35, 0);
  const head = new THREE.Group(); g.add(head);
  rbm(.7, .55, .5, .18, m.head, 0, .89, 0, head); rbm(.52, .3, .1, .05, m.visor, 0, .92, .22, head);
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), m.eye), e2 = e1.clone(); e1.position.set(-.12, .92, .28); e2.position.set(.12, .92, .28); head.add(e1, e2);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .22, 6), mk('#9aa3b8')); st.position.set(0, 1.28, 0); head.add(st);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 10), m.ball); ball.position.set(0, 1.42, 0); head.add(ball);
  const a1 = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), m.arm), a2 = a1.clone(); a1.position.set(-.38, .4, 0); a2.position.set(.38, .4, 0); g.add(a1, a2);
  g.userData = {m, head, arms: [a1, a2]}; return g;
}
const ROBOT_POS = {erp: [-.6, 2.1], crm: [2.5, 1.9], tab: [-2.7, 1.9], mail: [.2, 2.1], doc: [2.7, 1.9], pt: [-2.2, 1.7]};
const robots = {};
KEYS.forEach(k => { const r = makeRobot(); r.position.set(ROBOT_POS[k][0], TOP, ROBOT_POS[k][1]); r.rotation.y = .5; r.scale.setScalar(k === 'pt' ? 3.4 : .001); DEF[k].g.add(r); robots[k] = r; });
const robotQ = new THREE.Sprite(new THREE.SpriteMaterial({map: qTex, transparent: true, depthWrite: false})); robotQ.scale.setScalar(.75); robotQ.center.set(.5, 0); robotQ.position.y = 1.75; robots.pt.add(robotQ);
const GREYS = {body: new THREE.Color('#b4b9c4'), head: new THREE.Color('#bfc4cd'), eye: new THREE.Color('#7a8396'), ball: new THREE.Color('#9aa3b8'), arm: new THREE.Color('#a9aeba')};
const arrive = k => .70 + Math.hypot(DEF[k].x, DEF[k].z) / 36 * .05;
const _c1 = new THREE.Color(), _c2 = new THREE.Color();

/* coureur : saute d'un ilot a l'autre, ne trouve rien */
const runner = person('#e0493a', {s: 2.0, pants: '#2f3550'}); scene.add(runner);
const runnerQ = new THREE.Sprite(new THREE.SpriteMaterial({map: qTex, transparent: true, depthWrite: false})); runnerQ.scale.setScalar(1.15); runnerQ.center.set(.5, 0); runnerQ.position.y = 1.9; runner.add(runnerQ);
const ORD = ['pt', 'erp', 'pt', 'crm', 'pt', 'mail', 'pt', 'doc', 'pt', 'tab'];

/* lueur au sol sous chaque ilot et onde de choc */
const halos = {};
KEYS.forEach(k => { const m = new THREE.Mesh(new THREE.PlaneGeometry(13, 11), new THREE.MeshBasicMaterial({map: softTex, color: C[k], transparent: true, depthWrite: false, toneMapped: false, opacity: 0})); m.rotation.x = -Math.PI / 2; m.position.set(DEF[k].x, .095, DEF[k].z); m.renderOrder = 1; deck.add(m); halos[k] = m; });
const waves = [0, 1].map(i => { const m = new THREE.Mesh(new THREE.RingGeometry(1, 1.18, 96), new THREE.MeshBasicMaterial({color: i ? '#ffffff' : BRAND, transparent: true, depthWrite: false, toneMapped: false, opacity: 0, side: THREE.DoubleSide})); m.rotation.x = -Math.PI / 2; m.position.y = .13 + i * .01; m.renderOrder = 4; deck.add(m); return m; });

/* pastilles de resultat qui jaillissent au-dessus des ilots */
function badgeTex(icon, col) {
  return canvasTex(128, 128, (x, w, h) => {
    x.shadowColor = 'rgba(40,50,90,.25)'; x.shadowBlur = 10; x.shadowOffsetY = 3; x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 62, 48, 0, 7); x.fill(); x.shadowColor = 'transparent';
    x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 6; x.beginPath(); x.arc(64, 62, 48, 0, 7); x.stroke();
    x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round';
    if (icon === 'check') { x.beginPath(); x.moveTo(42, 64); x.lineTo(58, 80); x.lineTo(88, 44); x.stroke(); }
    else if (icon === 'doc') { x.lineWidth = 7; x.beginPath(); x.moveTo(46, 34); x.lineTo(70, 34); x.lineTo(84, 48); x.lineTo(84, 90); x.lineTo(46, 90); x.closePath(); x.stroke(); x.beginPath(); x.moveTo(55, 66); x.lineTo(63, 74); x.lineTo(76, 58); x.stroke(); }
    else if (icon === 'invoice') { x.lineWidth = 7; x.beginPath(); x.rect(42, 34, 44, 56); x.stroke(); x.lineWidth = 6; x.beginPath(); x.moveTo(50, 52); x.lineTo(78, 52); x.moveTo(50, 64); x.lineTo(78, 64); x.moveTo(50, 76); x.lineTo(66, 76); x.stroke(); }
    else { x.lineWidth = 7; x.beginPath(); x.rect(38, 40, 52, 48); x.stroke(); x.fillRect(38, 40, 52, 12); for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) x.fillRect(46 + c * 14, 62 + r * 13, 8, 7); }
  });
}
const ICONS = ['check', 'doc', 'invoice', 'plan'];
const badgeTexCache = {};
const bTex = (icon, k) => badgeTexCache[icon + k] || (badgeTexCache[icon + k] = badgeTex(icon, C[k]));
const badges = [];
KEYS.forEach((k, i) => { for (let j = 0; j < 3; j++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: bTex('check', k), transparent: true, depthWrite: false, depthTest: false})); sp.scale.setScalar(1.8); sp.renderOrder = 10; sp.visible = false; scene.add(sp); badges.push({sp, k, i, j, last: -1}); } });

/* poussiere a l'atterrissage */
const dust = [];
KEYS.forEach((k, i) => { for (let j = 0; j < 8; j++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: softTex, color: '#efe9da', transparent: true, depthWrite: false, opacity: 0})); sp.visible = false; scene.add(sp); dust.push({sp, k, i, j}); } });


/* colonnes de lumiere douce du socle vers chaque batiment */
const beamTex = canvasTex(8, 256, (x, w, h) => { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.55, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const beams = {};
KEYS.forEach(k => { const geo = new THREE.CylinderGeometry(2.4, 3.3, 11, 40, 1, true); geo.translate(0, 5.5, 0); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map: beamTex, color: C[k], transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, opacity: 0})); m.position.set(DEF[k].x, .1, DEF[k].z); m.renderOrder = 5; deck.add(m); beams[k] = m; });
const coreGeo = new THREE.CylinderGeometry(2.2, 3.4, 17, 48, 1, true); coreGeo.translate(0, 8.5, 0);
const coreBeam = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({map: beamTex, color: '#fff0bf', transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, opacity: 0})); coreBeam.position.y = .1; coreBeam.renderOrder = 6; deck.add(coreBeam);
const cNavy = new THREE.Color(NAVY), cBright = new THREE.Color('#3f6fe8'), cBrand = new THREE.Color(BRAND), cBrandB = new THREE.Color('#5f8bff'), cBase = new THREE.Color('#2b3a6e'), cBaseB = new THREE.Color('#4b6bd0');

/* ------------------------------------------------------------------ LE JUMEAU NUMERIQUE : une replique claire et rangee du village, au-dessus du socle */
const TWY = 15.5, TWS = .56;
const twin = new THREE.Group(); twin.position.y = TWY; twin.visible = false; scene.add(twin);
const glassMat = new THREE.MeshPhysicalMaterial({color: '#dfe9ff', transparent: true, opacity: .0, roughness: .12, clearcoat: 1, clearcoatRoughness: .1, envMapIntensity: 1.4, depthWrite: false});
const tPlate = new THREE.Mesh(rgeo(24, 17.6, .4, 2.4, .06), glassMat); tPlate.renderOrder = 3; twin.add(tPlate);
let twFrame = null;
{
  const sh = roundedShape(24.3, 17.9, 2.5); sh.holes.push(new THREE.Path(roundedShape(23.7, 17.3, 2.3).getPoints(24).reverse()));
  const g = new THREE.ExtrudeGeometry(sh, {depth: .2, bevelEnabled: false, curveSegments: 20}); g.rotateX(-Math.PI / 2);
  twFrame = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: BRAND, roughness: .4, emissive: '#6f93ff', emissiveIntensity: 0}));
  twFrame.position.y = .2; twin.add(twFrame);
}
const twGridTex = canvasTex(1024, 768, (x, w, h) => {
  x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(47,75,156,.42)'; x.lineWidth = 2;
  for (let i = 0; i <= 24; i++) { x.beginPath(); x.moveTo(i * w / 24, 0); x.lineTo(i * w / 24, h); x.stroke(); }
  for (let j = 0; j <= 18; j++) { x.beginPath(); x.moveTo(0, j * h / 18); x.lineTo(w, j * h / 18); x.stroke(); }
});
const twGrid = new THREE.Mesh(new THREE.PlaneGeometry(24, 17.6), new THREE.MeshBasicMaterial({map: twGridTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false}));
twGrid.rotation.x = -Math.PI / 2; twGrid.position.y = .43; twGrid.renderOrder = 4; twin.add(twGrid);

const twPads = {};
KEYS.forEach(k => {
  const o = DEF[k]; const g = new THREE.Group(); g.position.set(o.x * TWS, .4, o.z * TWS); twin.add(g);
  rb(g, 4.1, .25, 3.4, .5, C[k], 0, 0, 0, {seg: 2, cast: false});
  rb(g, 1.6, 1.0, 1.1, .22, '#ffffff', 0, .25, -.55, {seg: 2, cast: false});
  const row = [];
  ['client', 'job', 'invoice'].forEach((kd, j) => { const tl = tile(kd, C[k], .62); tl.position.set((j - 1) * .98, 2.0, .9); g.add(tl); row.push(tl); });
  g.userData.row = row; g.visible = false; twPads[k] = g;
});

const LINK_VERT = 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const twLinks = [];
{
  const P2 = k => V(DEF[k].x * TWS, 0, DEF[k].z * TWS), Z = V(0, 0, 0);
  const pairs = [['tab', 'erp'], ['erp', 'crm'], ['mail', 'doc'], ['doc', 'pt'], ['tab', 'mail'], ['crm', 'pt']];
  const mkLink = (a, b, hw, col) => {
    const gr = ribbon([a, b], hw, .47);
    const m = new THREE.ShaderMaterial({vertexShader: LINK_VERT, fragmentShader: VEIN_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {uColor: {value: new THREE.Color(col)}, uFill: {value: 0}, uTime: {value: 0}, uLen: {value: gr.userData.L}, uFlow: {value: 0}, uDir: {value: 1}}});
    const me = new THREE.Mesh(gr, m); me.renderOrder = 5; me.visible = false; twin.add(me); twLinks.push(me); return me;
  };
  KEYS.forEach(k => mkLink(P2(k), Z.clone(), .11, '#3b63d6'));
  pairs.forEach(([a, b]) => mkLink(P2(a), P2(b), .08, '#7b95e6'));
}
const twNode = new THREE.Group(); twNode.position.y = .4; twin.add(twNode);
cyl(twNode, 1.5, 1.7, .3, '#f6c64a', 0, 0, 0, 48, {cast: false}); cyl(twNode, 1.0, 1.0, .12, '#fff3c4', 0, .3, 0, 48, {cast: false});
twNode.visible = false;
const chkTex = canvasTex(128, 128, (x, w, h) => { x.shadowColor = 'rgba(30,90,60,.35)'; x.shadowBlur = 12; x.shadowOffsetY = 3; x.fillStyle = '#2e9e68'; x.beginPath(); x.arc(64, 62, 46, 0, 7); x.fill(); x.shadowColor = 'transparent'; x.strokeStyle = '#fff'; x.lineWidth = 12; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(42, 64); x.lineTo(58, 80); x.lineTo(88, 44); x.stroke(); });
const twCheck = new THREE.Sprite(new THREE.SpriteMaterial({map: chkTex, transparent: true, depthWrite: false, depthTest: false})); twCheck.renderOrder = 11; twCheck.position.set(0, 7.2, 0); twCheck.visible = false; twin.add(twCheck);
const twPerson = person('#1f2d4f', {pants: '#2c3550', hair: '#2a2220', s: 1.7}); twPerson.position.set(3.4, .4, 6.4); twPerson.rotation.y = .5; twPerson.visible = false; twin.add(twPerson);

/* faisceaux du jumeau vers chaque robot (les agents lisent le jumeau) + vers la reponse */
const feeds = {};
KEYS.forEach(k => {
  const o = DEF[k]; const a = V(o.x * TWS, TWY + .9, o.z * TWS), b = V(o.x + ROBOT_POS[k][0], .07 + TOP + 4.2, o.z + ROBOT_POS[k][1]);
  const mid = a.clone().lerp(b, .5); mid.y += 1.5; mid.x += (a.x > 0 ? 1 : -1) * 1.5;
  const curve_ = new THREE.CatmullRomCurve3([a, mid, b]);
  const geo = new THREE.TubeGeometry(curve_, 50, .13, 8, false);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: C[k], transparent: true, opacity: .9, toneMapped: false})); m.renderOrder = 7; m.visible = false; scene.add(m);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 10), new THREE.MeshBasicMaterial({color: '#ffffff', toneMapped: false})); dot.visible = false; dot.renderOrder = 8; scene.add(dot);
  feeds[k] = {m, dot, curve: curve_, idx: geo.index.count};
});
let ansBeam;
{
  const a = V(0, TWY + .9, 0), b = V(PX + 1.7, 3.6, PZ + .5), mid = V(-1.5, TWY * .5, 6);
  const curve_ = new THREE.CatmullRomCurve3([a, mid, b]);
  const geo = new THREE.TubeGeometry(curve_, 60, .12, 8, false);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: '#f6c64a', transparent: true, opacity: .95, toneMapped: false})); m.visible = false; m.renderOrder = 7; scene.add(m);
  ansBeam = {m, idx: geo.index.count};
}

/* ------------------------------------------------------------------ cartes HTML */
const cardsEl = document.getElementById('cards');
function mk(html, cls, color, stem) { const d = document.createElement('div'); d.className = 'card ' + cls; d.style.setProperty('--c', color); if (stem != null) d.style.setProperty('--stem', stem + 'px'); d.innerHTML = html; cardsEl.appendChild(d); return d; }
const UI = {};
KEYS.forEach(k => { UI['tag_' + k] = mk('', 'tag', C[k]); });
UI.q = mk('', 'q tailR', '#1f2d4f');
UI.a = mk('', 'a tailL', '#5c6bc0');
UI.apv = mk('', 'apv nostem', '#2e9e68');
/* plan final : ce qu'on voit, nommé */
UI.lTwin = mk('', 'layer', '#3f5bd9', 26);
UI.lSocle = mk('', 'layer nostem', '#26346e');
let apb = null;
const SRC = {
  erp: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 8v8M9.5 10.2c.7-.8 4.3-.9 4.8.6.5 1.8-4.8.9-4.6 3 .1 1.5 3.9 1.6 4.8.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  crm: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6" fill="currentColor"/><path d="M5 20c.5-4 3.3-6 7-6s6.5 2 7 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  pt: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7v5.5l3.5 2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
function renderCards() {
  KEYS.forEach(k => { UI['tag_' + k].textContent = T('tag.' + k); });
  UI.q.textContent = T('q');
  UI.lTwin.innerHTML = `<b>${T('layer.twin')}</b><span>${T('layer.twin.s')}</span>`;
  UI.lSocle.innerHTML = `<b>${T('layer.socle')}</b><span>${T('layer.socle.s')}</span>`;
  UI.a.innerHTML = `<div class="ans"><i class="bolt">⚡</i><span>${T('a')}</span></div><div class="src">${['erp', 'crm', 'pt'].map(k => `<i style="--c:${C[k]}">${SRC[k]}</i>`).join('')}</div>`;
  UI.apv.innerHTML = '<span class="apb"></span>'; apb = UI.apv.querySelector('.apb'); apb.dataset.s = '';
}
renderCards(); onLang(renderCards);

const chaps = [...document.querySelectorAll('.chap')];
const rail = [...document.querySelectorAll('.rail i')];
const hint = document.getElementById('hint');

/* ------------------------------------------------------------------ caméra */
// [p, azimut°, élévation°, distance, cible x,y,z]
const KF = [
  [0.00, 34, 28, 92, 0, 2.0, 1],
  [0.08, 40, 26, 90, 1, 3.2, 0],
  [0.18, 50, 24, 86, 2, 3.4, 0],
  [0.26, 40, 30, 78, 0, 1.4, 0],
  [0.30, 24, 58, 92, 0, -2.4, -3],
  [0.36, 22, 50, 90, 0, -2, -3],
  [0.41, 10, 22, 88, 0, 0, 2],
  [0.48, 6, 16, 80, 0, -.4, 4],
  [0.55, 14, 22, 100, 0, 1.5, 2],
  [0.62, 30, 22, 128, 0, 7.5, 1],
  [0.69, 36, 22, 130, 0, 8.5, 0],
  [0.725, 32, 24, 108, 0, 6.5, 1],
  [0.785, 36, 28, 118, 0, 6.5, 1],
  [0.84, 30, 32, 104, -2, 3.4, 3],
  [0.92, 34, 28, 108, 0, 4.2, 2],
  [0.955, 22, 18, 138, 0, 13, 2],
  [1.00, 22, 18, 138, 0, 13, 2],
];
function camState(p) {
  let i = 0; while (i < KF.length - 2 && p > KF[i + 1][0]) i++;
  const k0 = KF[Math.max(0, i - 1)], k1 = KF[i], k2 = KF[i + 1], k3 = KF[Math.min(KF.length - 1, i + 2)];
  const t = clamp((p - k1[0]) / (k2[0] - k1[0])); const out = [];
  for (let c = 1; c < 8; c++) {
    const p0 = k0[c], p1 = k1[c], p2 = k2[c], p3 = k3[c];
    const m1 = (p2 - p0) * .5, m2 = (p3 - p1) * .5, t2 = t * t, t3 = t2 * t;
    out.push((2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m2);
  }
  return out;
}
let W = 1, H = 1, ASP = 1;
function resize() {
  W = innerWidth; H = innerHeight; ASP = W / H; renderer.setSize(W, H, false); camera.aspect = ASP;
  camera.fov = ASP < 1 ? 36 : 26;
  const sx = (ASP < 1 || STILL) ? 0 : -W * .17, sy = ASP < 1 ? -H * .03 : H * .0;
  camera.setViewOffset(W, H, sx, sy, W, H); camera.updateProjectionMatrix();
}
resize(); addEventListener('resize', resize);
/* écran large : le titre occupe le tiers gauche, la scène doit tenir dans les deux tiers droits */
function wideFit(p) { return (1 - .16 * sm(seg(p, .925, .965))) * (1.08 + .17 * (1 - sm(seg(p, .26, .34))) + .1 * Math.sin(Math.PI * seg(p, .26, .38)) + .3 * Math.sin(Math.PI * seg(p, .40, .56))); }
function distFactor(p) { return ASP < 1.35 ? Math.pow(1.35 / ASP, lerp(lerp(.42, .7, sm(seg(p, .26, .4))), .46, sm(seg(p, .52, .62)))) : 1; }

/* ------------------------------------------------------------------ mise à jour de la scène */
const _v = new THREE.Vector3();
function place(el, pos, op, dx = 0, dy = 0, sc = 1) {
  if (op < .01 || (MOBILE && !el.classList.contains('tag') && !el.classList.contains('layer'))) { el.style.opacity = 0; return; }
  const p = _v.copy(pos).project(camera);
  el.style.transform = `translate(${((p.x + 1) / 2 * W + dx).toFixed(1)}px,${((1 - p.y) / 2 * H + dy).toFixed(1)}px) translate(-50%,-100%) scale(${sc.toFixed(3)})`;
  el.style.opacity = op.toFixed(3);
}
const islandWorld = {};
const STEPS = [.08, .27, .57, .70, .83, 1];
const QM = [[0, 0], [.27, .30], [.56, .62], [.70, .80], [.82, .80], [.93, .96], [1, 1]];
function qmap(P) { for (let i = 0; i < QM.length - 1; i++) if (P <= QM[i + 1][0]) return lerp(QM[i][1], QM[i + 1][1], (P - QM[i][0]) / (QM[i + 1][0] - QM[i][0])); return 1; }
let lastFilter = '';
function update(P, time) {
  const p = qmap(P);
  const pw = seg(P, .70, .9);
  /* caméra */
  let [az, el, d, tx, ty, tz] = camState(P);
  if (ASP < 1) { az = lerp(az, 8, sm(seg(P, .3, .45))); el = lerp(el, Math.max(26, el * .8), sm(seg(P, .4, .55))); }
  const ar = az * Math.PI / 180, er = el * Math.PI / 180, dd = d * distFactor(P) * (ASP < 1 ? lerp(1, .72, sm(seg(P, .9, .955))) : wideFit(P));
  camera.position.set(tx + dd * Math.cos(er) * Math.sin(ar), ty + dd * Math.sin(er), tz + dd * Math.cos(er) * Math.cos(ar));
  if (ASP >= 1 && !STILL) { camera.setViewOffset(W, H, -W * lerp(.19, .18, sm(seg(P, .04, .3))), 0, W, H); }
  let shake = 0; KEYS.forEach((k, i) => { const lt = .52 + i * .012 + .075; shake += Math.sin(Math.PI * seg(p, lt, lt + .035)); });
  camera.position.x += shake * .22 * Math.sin(time * 61); camera.position.y += shake * .26 * Math.sin(time * 47 + 1);
  camera.lookAt(tx, ty, tz); camera.updateMatrixWorld();

  const sat = lerp(.5, 1.02, sm(seg(P, .30, .56))) + .45 * Math.sin(Math.PI * seg(P, .70, .80)) + .08 * sm(seg(P, .72, .8));
  const fl = `saturate(${sat.toFixed(2)})`; if (fl !== lastFilter) { canvas.style.filter = fl; lastFilter = fl; }
  /* nuages */
  clouds.forEach(c => { const out = sm(seg(p, .22, .4)); c.g.position.x = c.x + Math.sin(time * .07 + c.i) * 2 + out * (c.x > 0 ? 24 : -24); c.g.position.y = lerp(c.g.position.y, c.g.position.y, 0); c.g.visible = out < .99; });

  /* îlots : flottants, puis posés sur le socle */
  KEYS.forEach((k, i) => {
    const o = DEF[k];
    const s0 = .52 + i * .012, lt = s0 + .075, dkU = seg(p, s0, lt);
    const dk = dkU < 1 ? Math.pow(dkU, 2.1) : 1;
    const bb = seg(p, lt, lt + .045), bounce = (bb > 0 && bb < 1) ? .55 * Math.pow(1 - bb, 2) * Math.abs(Math.sin(bb * Math.PI * 2.5)) : 0;
    const hopP = Math.sin(Math.PI * seg(P, arrive(k), arrive(k) + .04)) * .6;
    const bob = (1 - dk) * (.42 * Math.sin(time * .9 + i * 1.7) + .15 * Math.sin(time * 1.7 + i));
    const sp = lerp(SPREAD, 1, dk);
    o.g.position.set(o.x * sp, lerp(o.y0 + bob, .07, dk) + bounce + hopP, o.z * sp);
    o.g.rotation.set((1 - dk) * (o.tx + .035 * Math.sin(time * .7 + i)), (1 - dk) * o.ry, (1 - dk) * (o.tz + .035 * Math.cos(time * .6 + i * 2)));
    o.g.scale.y = 1 - .09 * Math.sin(Math.PI * seg(p, lt, lt + .02));
    o.under.scale.y = Math.max(.001, 1 - sm(seg(dk, .55, 1)));
    o.under.visible = o.under.scale.y > .01;
    o.dk = dk; o.lt = lt;
    if (o.g.userData.hands) { const spin = 1 - sm(seg(p, .5, .58)); o.g.userData.hands.forEach((h, j) => { h.rotation.z = (j % 2 ? -.6 : -2.1) - time * (j % 2 ? 1.5 : 15) * spin; }); }
    // cellules du tableur qui "respirent"
    if (o.g.userData.cells) o.g.userData.cells.forEach((c, j) => { c.scale.y = 1 + .12 * Math.sin(time * 1.4 + j * .9) * (1 - dk * .6); });
  });

  /* personnages bloqués, allers-retours vains */
  const stuck = 1 - sm(seg(p, .5, .56));
  patrol.forEach(pt => {
    const T = ((time + pt.ph) % 7.2);
    let u, pause = 0;
    if (T < 2.2) u = sm(T / 2.2); else if (T < 3.9) { u = 1; pause = 1; } else if (T < 6.1) u = 1 - sm((T - 3.9) / 2.2); else u = 0;
    pt.p.position.set(lerp(pt.a.x, pt.b.x, u), TOP, lerp(pt.a.z, pt.b.z, u));
    const moving = (T < 2.2) || (T > 3.9 && T < 6.1);
    const fwd = (T < 3.9);
    const face = Math.atan2(pt.b.x - pt.a.x, pt.b.z - pt.a.z) + (fwd ? 0 : Math.PI);
    pt.p.rotation.y = face;
    if (moving) walk(pt.p, time, 7, .6); else stand(pt.p);
    if (pause) { pt.p.userData.arms[1].rotation.x = -2.2 + .25 * Math.sin(time * 6); }
    pt.q.material.opacity = clamp(pause ? 1 : .0) * stuck; pt.q.visible = pt.q.material.opacity > .02;
    pt.q.position.y = 1.9 + .08 * Math.sin(time * 4);
  });

  /* coureur : d'un ilot a l'autre, sans rien trouver */
  { const rOn = 1 - sm(seg(p, .44, .5)); runner.visible = rOn > .01; runner.scale.setScalar(Math.max(.001, rOn));
    if (runner.visible) {
      const TT = time * .45 + .5, idx = Math.floor(TT), f = TT - idx, ka = ORD[idx % ORD.length], kb = ORD[(idx + 1) % ORD.length];
      const spot = k => { const g = DEF[k].g; return V(g.position.x + DIR[k].x * 1.3, g.position.y + TOP, g.position.z + DIR[k].z * 1.3); };
      const pa = spot(ka), pb = spot(kb), hopF = .55;
      runner.rotation.y = Math.atan2(pb.x - pa.x, pb.z - pa.z);
      if (f < hopF) { const u = f / hopF; runner.position.copy(pa).lerp(pb, sm(u)); runner.position.y += Math.sin(Math.PI * u) * 3.4; walk(runner, time, 16, 1.0); runnerQ.visible = false; }
      else { runner.position.copy(pb); stand(runner); runner.userData.arms[1].rotation.x = -2.4 + .3 * Math.sin(time * 7); runner.userData.arms[0].rotation.x = -2.0 + .3 * Math.cos(time * 7); runnerQ.visible = true; runnerQ.position.y = 1.9 + .08 * Math.sin(time * 5); }
    } }
  /* poussiere aux impacts */
  dust.forEach(dd_ => { const o = DEF[dd_.k], u = seg(p, o.lt || 9, (o.lt || 9) + .05); const on = u > 0 && u < 1; dd_.sp.visible = on;
    if (on) { const ang = dd_.j / 8 * Math.PI * 2 + dd_.i, r = 3.8 + u * 3.4; dd_.sp.position.set(o.x + Math.cos(ang) * r, .5 + u * 1.1, o.z + Math.sin(ang) * r * .85); dd_.sp.scale.setScalar(1.3 + u * 3.2); dd_.sp.material.opacity = (1 - u) * .8 * sm(seg(u, 0, .12)); } });

  /* arbres */
  const swayAll = [...KEYS.map(k => DEF[k].trees[0]), ...slabTrees];
  swayAll.forEach(t => { const cr = t.userData.crown; cr.rotation.z = .045 * Math.sin(time * 1.3 + t.userData.seed * 1.9); cr.rotation.x = .035 * Math.sin(time * 1.1 + t.userData.seed); });
  slabTrees.forEach(t => { const s = eb(seg(p, .6 + (t.userData.n % 8) * .008, .68 + (t.userData.n % 8) * .008)); t.scale.setScalar(Math.max(.001, t.userData.s0 * s)); t.visible = s > .01; });

  /* plan d'architecte */
  const bpOn = p > .285 && p < .53;
  bpMesh.visible = bpOn;
  bpU.uReveal.value = sm(seg(p, .30, .395)) * 1.0; bpU.uGrid.value = sm(seg(p, .30, .36)); bpU.uFill.value = sm(seg(p, .365, .415));
  bpU.uSock.value = sm(seg(p, .385, .43)); bpU.uFade.value = 1 - sm(seg(p, .465, .515)); bpU.uTime.value = time;

  /* la dalle se dresse */
  const ext = eio(seg(p, .405, .5));
  slab.scale.y = Math.max(.0001, ext); slab.visible = ext > .002; contact.material.opacity = sm(seg(p, .43, .5)) * .5;
  const lt = eo(seg(p, .485, .545));
  letters.visible = lt > .01; letters.scale.set(1, 1, Math.max(.01, lt)); letters.position.y = FLOOR + 1.1 + 1.15 + (1 - lt) * -.0;
  const deckOn = ext > .985; deck.visible = deckOn;
  KEYS.forEach((k, i) => { const s = eb(seg(p, .495 + i * .006, .55 + i * .006)); sockets[k].scale.setScalar(Math.max(.001, s)); sockets[k].visible = s > .005; });

  /* veines */
  KEYS.forEach((k, i) => {
    const f = eio(seg(p, .655 + i * .018, .725 + i * .018));
    const v = veins[k]; v.mat.uniforms.uFill.value = f; v.mat.uniforms.uTime.value = time; v.mat.uniforms.uFlow.value = sm(seg(p, .74, .8));
    v.groove.visible = true; v.groove.material.opacity = sm(seg(p, .58, .64)) * .0;
    v.mesh.visible = p > .575;
    // la veine est visible en gris dès l'arrivée des îlots (rainure vide), puis se remplit
    v.mat.uniforms.uFill.value = f;
    arcs[k].visible = f > .97;
  });
  circuit.material.uniforms.uR.value = eio(seg(p, .67, .8)) * 28; circuit.material.uniforms.uTime.value = time;
  pool.material.opacity = sm(seg(p, .68, .8)) * .85;

  /* le cerveau */
  const bp = eb(seg(p, .67, .735));
  brain.scale.set(BS, Math.max(.001, bp * BS), BS); brain.visible = bp > .01;
  const lit = sm(seg(p, .72, .8));
  bands.forEach(b => b.material = lit > .01 ? litMat(lit) : b.material);
  dome.material = litMat(lit, '#8197ea');
  tower.rotation.y = 0;

  /* ===== LE MOMENT DE PUISSANCE ===== */
  { const pulse = Math.sin(Math.PI * seg(P, .70, .80));
    pool.material.opacity = Math.max(pool.material.opacity, .85 + .15 * pulse); pool.scale.setScalar(1 + .55 * pulse);
    waves.forEach(w => { w.visible = false; });
    KEYS.forEach((k, i) => { const arr = arrive(k), up = eo(seg(P, arr, arr + .05)); const bm = beams[k]; bm.scale.set(1, Math.max(.001, up), 1); bm.visible = up > .01; bm.material.opacity = sm(seg(P, arr, arr + .03)) * (.62 - .3 * sm(seg(P, .8, .92)) + .08 * Math.sin(time * 3 + i)) * (1 - .75 * sm(seg(P, .9, .95))); });
    { const up = eo(seg(P, .60, .66)); coreBeam.scale.set(1, Math.max(.001, up), 1); coreBeam.visible = up > .01; coreBeam.material.opacity = up * (.3 + .55 * Math.sin(Math.PI * seg(P, .70, .80))); }
    /* le jumeau se materialise */
    { const reveal = eo(seg(P, .565, .62)); twin.visible = reveal > .01; const fin_ = sm(seg(P, .925, .955)); twin.scale.setScalar(Math.max(.001, 1.2 * (.35 + .65 * reveal))); twin.position.y = TWY - (1 - reveal) * 6 - 1.2 * fin_;
      glassMat.opacity = .36 * reveal; twGrid.material.opacity = .6 * reveal;
      const pulseT = Math.sin(Math.PI * seg(P, .70, .78)); twFrame.material.emissiveIntensity = reveal * (.55 + .7 * pulseT);
      KEYS.forEach((k, i) => {
        const pad = twPads[k], ps = eb(seg(P, .59 + i * .008, .64 + i * .008)); pad.scale.setScalar(Math.max(.001, ps)); pad.visible = ps > .01;
        pad.userData.row.forEach((tl, j) => { const ts = eb(seg(P, .625 + i * .006 + j * .008, .665 + i * .006 + j * .008)); tl.scale.setScalar(Math.max(.001, ts * 1.2)); tl.quaternion.copy(camera.quaternion); });
      });
      twLinks.forEach((lk, i) => { const f = eo(seg(P, .63 + i * .004, .685)); lk.visible = f > .01; lk.material.uniforms.uFill.value = f; lk.material.uniforms.uTime.value = time; lk.material.uniforms.uFlow.value = sm(seg(P, .70, .74)); });
      const ns = eb(seg(P, .655, .69)); twNode.visible = ns > .01; twNode.scale.setScalar(Math.max(.001, ns));
      const cs = eb(seg(P, .69, .715)); twCheck.visible = cs > .01; twCheck.scale.setScalar(Math.max(.001, 2.6 * cs * (1 + .08 * Math.sin(time * 4)) * (1 - sm(seg(P, .78, .82))))); twCheck.position.y = 7.2 + .15 * Math.sin(time * 2);
      const vs = eb(seg(P, .68, .71)); twPerson.visible = vs > .01; twPerson.scale.setScalar(Math.max(.001, 1.7 * vs * (1 - sm(seg(P, .78, .83))))); stand(twPerson); twPerson.userData.arms[1].rotation.x = -2.5 * sm(seg(P, .69, .71)) + .2 * Math.sin(time * 5) * sm(seg(P, .69, .71));
      KEYS.forEach((k, i) => {
        const f = feeds[k], arr = arrive(k), u = eo(seg(P, arr - .035, arr)), on = u > .01 && P < .93;
        f.m.visible = on; f.dot.visible = on && u > .98;
        if (on) { f.m.geometry.setDrawRange(0, Math.floor(f.idx * clamp(u) / 6) * 6); f.m.material.opacity = .9 * (1 - .55 * sm(seg(P, .82, .92))); }
        if (f.dot.visible) { const pp = f.curve.getPointAt(((time * .45 + i * .17) % 1)); f.dot.position.copy(pp); }
      });
      const au = eo(seg(P, .86, .89)), aon = au > .01 && P < .955; ansBeam.m.visible = aon; if (aon) ansBeam.m.geometry.setDrawRange(0, Math.floor(ansBeam.idx * clamp(au) / 6) * 6);
    }
    GLOW.letters.forEach((m, i) => { const l = sm(seg(P, .70 + i * .012, .74 + i * .012)); const st = sm(seg(P, .8, .9)); m.material.color.lerpColors(cNavy, cBright, l * (1 - .55 * st)); m.material.emissiveIntensity = l * (1 - .7 * st) * (.85 + .3 * Math.sin(time * 3 + i)); });
    { const l = sm(seg(P, .70, .76)); GLOW.border.material.color.lerpColors(cBrand, cBrandB, l); const st = 1 - .6 * sm(seg(P, .8, .9)); GLOW.border.material.emissiveIntensity = l * st * (.9 + .2 * Math.sin(time * 3)); slabBase.material.color.lerpColors(cBase, cBaseB, l * st); slabBase.material.emissiveIntensity = l * .45 * st; }
    KEYS.forEach((k, i) => {
      const o = DEF[k], arr = arrive(k), lit = sm(seg(P, arr, arr + .03)); o.litv = lit;
      halos[k].material.opacity = lit * (.34 + .1 * Math.sin(time * 3 + i)); halos[k].visible = lit > .01;
      const R = robots[k], m = R.userData.m;
      const sc = k === 'pt' ? lerp(3.4, 4.3, lit) * (1 + .25 * Math.sin(Math.PI * seg(P, arr, arr + .04))) : 4.3 * eb(seg(P, arr + .004, arr + .04));
      R.scale.setScalar(Math.max(.001, sc)); R.visible = sc > .002;
      m.body.color.lerpColors(GREYS.body, _c1.set('#ffffff'), lit);
      m.head.color.lerpColors(GREYS.head, _c1.set(TINT[k]), lit);
      m.ball.color.lerpColors(GREYS.ball, _c1.set(C[k]), lit);
      m.arm.color.lerpColors(GREYS.arm, _c1.set(C[k]), lit);
      m.eye.color.lerpColors(GREYS.eye, _c1.set('#ffffff'), lit); m.eye.emissive.set(C[k]); m.eye.emissiveIntensity = lit * 1.3;
      R.userData.head.rotation.y = lit * .45 * Math.sin(time * 2.2 + i); R.userData.head.rotation.x = (1 - lit) * .28 + lit * .06 * Math.sin(time * 6 + i);
      R.userData.arms.forEach((a, j) => { a.position.y = .4 + lit * .12 * Math.sin(time * 8 + j * 2 + i); a.position.z = lit * .1 * Math.cos(time * 8 + j + i); });
      R.position.y = TOP + lit * Math.abs(Math.sin(time * 4.2 + i)) * .16;
    });
    robotQ.material.opacity = 1 - sm(seg(p, .5, .56)); robotQ.visible = robotQ.material.opacity > .02; robotQ.position.y = 1.75 + .07 * Math.sin(time * 4);
    badges.forEach(b => {
      const o = DEF[b.k], lit = o.litv || 0; const cyc = time * .8 + b.i * .2 + b.j * .34, ph = cyc - Math.floor(cyc), idx = Math.floor(cyc);
      b.sp.visible = lit > .02;
      if (b.sp.visible) {
        if (idx !== b.last) { b.sp.material.map = bTex(ICONS[(idx + b.i + b.j * 2) % 4], b.k); b.last = idx; }
        b.sp.position.set(o.g.position.x + (b.j - 1) * 2.4, o.g.position.y + 6.4 + ph * 4.2, o.g.position.z + 1.0);
        b.sp.material.opacity = Math.sin(Math.PI * ph) * lit * (1 - sm(seg(P, .815, .845))); b.sp.scale.setScalar(5.0 * (.5 + .5 * eb(seg(ph, 0, .22))));
      }
    });
  }

  /* jetons d'origine, et copies en voyage */
  const mergeDone = {client: 0, job: 0};
  const cur = camera.quaternion;
  TOKENS.forEach((t, i) => {
    const o = DEF[t.tool]; const ig = o.g;
    const hov = ig.position.clone().add(V(o.x * 0 - o.x * 0, 0, 0));
    const base = V(ig.position.x + t.off.x, ig.position.y + t.off.y - .0, ig.position.z + t.off.z);
    const pop = sm(seg(p, .0, .01 + .0)) ; // toujours là
    const bobY = .14 * Math.sin(time * 1.6 + t.ph);
    const settle = (o.dk || 0) * .55; // les jetons se posent un peu plus bas quand l'îlot est branché
    t.orig.position.set(base.x, base.y + bobY - settle, base.z);
    t.orig.quaternion.copy(cur);
    t.orig.rotateZ(.06 * Math.sin(time * 1.1 + t.ph) + (t.rot || 0));
    t.orig.scale.setScalar(1.35);
    // fiches de jetons "bloqués" : légère oscillation latérale = ils tirent sur leur attache
    t.orig.position.x += .1 * Math.sin(time * 2.3 + t.ph) * stuck;

    const u = eio(seg(p, .705 + t.stag, .775 + t.stag + (i % 3) * .008));
    const c = t.clone; c.visible = u > 0 && u < 1;
    if (c.visible) {
      c.position.copy(t.curve.getPointAt(u)); c.position.y += .12 * Math.sin(time * 4 + t.ph) * .5;
      const s = sm(seg(u, 0, .07)) * (1 - (t.merge ? sm(seg(u, .93, 1)) : sm(seg(u, .9, 1))));
      c.scale.setScalar(Math.max(.001, s * 1.1)); c.quaternion.copy(cur); c.rotateZ((t.rot || 0) * (1 - u));
    }
    if (u >= 1 && t.merge) mergeDone[t.kind]++;
  });
  [[mClient, 'client', -1], [mJob, 'job', 1]].forEach(([m, kd, sg]) => {
    const f = eb(seg(p, .775, .805)); m.visible = f > .01; m.scale.setScalar(Math.max(.001, f));
    m.position.y = 18.0 - 1.2 * sm(seg(P, .925, .955)) + .22 * Math.sin(time * 1.5 + sg); m.quaternion.copy(cur);
  });

  /* flux continus après fusion */
  flows.forEach(f => {
    const on = Math.max(sm(seg(p, .8, .86)), sm(seg(P, .70, .74))); const v = veins[f.k];
    const ph = ((f.i / 4) + (time * .06 + pw * .8) * (f.i % 2 ? -1 : 1) + KEYS.indexOf(f.k) * .13) % 1; const u = (ph + 1) % 1;
    const pos = polyPos(v.poly, v.L, u, .28); f.m.position.set(pos.x, .3, pos.z);
    f.m.scale.setScalar(Math.max(.001, on * (.85 + .15 * Math.sin(time * 4 + f.i)))); f.m.visible = on > .01;
    f.m.rotation.y = time * .8 + f.i;
  });

  /* équipe */
  const crew = eb(seg(p, .6, .67));
  asker.visible = bot.visible = crew > .01; asker.scale.setScalar(Math.max(.001, 1.6 * crew)); bot.scale.setScalar(Math.max(.001, 1.7 * crew));
  const askAnim = seg(p, .82, .86); stand(asker); asker.userData.arms[1].rotation.x = -2.4 * askAnim + .15 * Math.sin(time * 5) * askAnim;
  bot.userData.head.rotation.y = .25 * Math.sin(time * 1.2); bot.position.y = .06 + .06 * Math.sin(time * 2);
  walkers.forEach((w, i) => {
    const on = eb(seg(p, .66 + i * .01, .72 + i * .01)); w.p.visible = on > .01; w.p.scale.setScalar(Math.max(.001, on * 1.3));
    const ang = w.ph + (time * .16 + pw * 2.4) * w.dir; const rx = 8.0 + (i % 2) * .5, rz = 10.2 + (i % 2) * .5;
    w.p.position.set(Math.cos(ang) * rx, .06, Math.sin(ang) * rz);
    const dx = -Math.sin(ang) * rx * w.dir, dz = Math.cos(ang) * rz * w.dir; w.p.rotation.y = Math.atan2(dx, dz);
    walk(w.p, time + i, 6.5 + 4 * sm(seg(P, .7, .78)), .55);
  });

  /* action de retour vers l'ERP */
  const act = eio(seg(p, .91, .95));
  tube.geometry.setDrawRange(0, Math.floor(tubeIdx * clamp(act * 1.05) / 6) * 6); tube.visible = arrow.visible = act > .01; arrow.scale.setScalar(Math.max(.001, clamp((act - .9) * 10)));

  /* cartes HTML */
  KEYS.forEach(k => { const g = DEF[k].g; place(UI['tag_' + k], V(g.position.x, g.position.y + 1.0, g.position.z + 3.5), clamp(seg(p, .02, .08)) * (1 - sm(seg(p, .94, .98))) * (MOBILE ? 1 - sm(seg(p, .44, .5)) : 1), 0, 12); });
  place(UI.q, V(PX, 2.9, PZ), sm(seg(p, .835, .86)) * (1 - sm(seg(p, .955, .975))), -40, -4, .88 + .12 * sm(seg(p, .835, .86)));
  place(UI.a, V(PX + 1.7, 3.1, PZ + .5), sm(seg(p, .865, .895)) * (1 - sm(seg(p, .955, .975))), 170, -62, .88 + .12 * sm(seg(p, .865, .895)));
  { const ap = sm(seg(p, .885, .9)) * (1 - sm(seg(p, .955, .975))), pressed = seg(p, .905, .92) > .5;
    place(UI.apv, V(PX + 1.7, 3.1, PZ + .5), ap, 150, 52, pressed ? 1.0 : .94 + .06 * Math.sin(time * 6));
    { const want = pressed ? T('approved') : T('approve'); if (apb && apb.dataset.s !== want) { apb.textContent = want; apb.dataset.s = want; } if (apb) apb.classList.toggle('done', pressed); } }

  { const lo = sm(seg(P, .955, .985)); place(UI.lTwin, V(0, twin.position.y + 1.2, 0), lo, 0, -6);
    place(UI.lSocle, V(0, -1.4, 13.2), sm(seg(P, .97, 1)), MOBILE ? 0 : 300, MOBILE ? 92 : 20, 1); }
  /* chapitres de texte */
  chaps.forEach(c => {
    if (c.id === 'top') { c.style.opacity = 1; c.style.transform = ''; c.classList.add('on'); return; }
    const a = parseFloat(c.dataset.a), b = parseFloat(c.dataset.b);
    let op = Math.min(a <= 0 ? 1 : sm(seg(P, a, a + .022)), b > 1 ? 1 : 1 - sm(seg(P, b - .022, b)));
    c.style.opacity = op.toFixed(3);
    const ty = (a <= 0 ? 0 : (1 - sm(seg(P, a, a + .03))) * 26) - (b > 1 ? 0 : sm(seg(P, b - .03, b)) * 18);
    c.style.setProperty('--ty', (ty * .6).toFixed(1) + 'px'); c.style.transform = '';
    c.classList.toggle('on', op > .5);
  });
  const stepIdx = P < .08 ? -1 : P < .27 ? 0 : P < .57 ? 1 : P < .70 ? 2 : P < .83 ? 3 : 4;
  rail.forEach((r, i) => { r.classList.toggle('on', i === stepIdx); r.classList.toggle('done', i < stepIdx); r.style.setProperty('--f', i === stepIdx ? seg(P, STEPS[i], STEPS[i + 1]).toFixed(3) : (i < stepIdx ? 1 : 0)); });
}
const litCache = {};
function litMat(k, col = '#cfe3fb') { const key = col + Math.round(k * 12); return litCache[key] || (litCache[key] = new THREE.MeshStandardMaterial({color: col, roughness: .25, envMapIntensity: .7, emissive: '#ffd985', emissiveIntensity: k * .85})); }

/* ------------------------------------------------------------------ boucle */
let P = 0, last = performance.now(), frames = 0, T0 = performance.now();
function draw(p, t) { update(p, t); renderer.render(scene, camera); }
window.__draw = (p, t) => { P = p; draw(p, t); };
window.__ready = false;
/* Pas de rendu quand la scène est hors écran (le reste de la page défile sans payer la 3D). */
let onScreen = true;
new IntersectionObserver(e => { onScreen = e[0].isIntersecting; }).observe(document.getElementById('story'));
/* Résolution adaptative : si les images dépassent ~22 ms en moyenne, on baisse la densité de pixels ; on remonte doucement si la marge revient. */
let acc = 0, accN = 0;
function adapt(ms) {
  acc += ms; accN++; if (accN < 30) return;
  const avg = acc / accN; acc = 0; accN = 0;
  const next = avg > 22 ? Math.max(PR_MIN, PR - .15) : (avg < 13 ? Math.min(PR_MAX, PR + .1) : PR);
  if (Math.abs(next - PR) > .01) { PR = next; renderer.setPixelRatio(PR); resize(); }
}
/* Film : l'histoire se joue toute seule, en boucle, comme une vidéo. Pas de défilement.
   Pause : bouton, ou clic sur un chapitre de la barre pour y sauter. */
const FILM = 46, HOLD = 3.5, FADE = .7;
let filmT = Q.has('t') ? parseFloat(Q.get('t')) : 0, playing = true;
const stage = document.getElementById('stage'), playBtn = document.getElementById('film-play');
function setPlaying(v) { playing = v; if (playBtn) { playBtn.classList.toggle('paused', !v); playBtn.setAttribute('aria-label', T(v ? 'film.pause' : 'film.play')); } }
if (playBtn) playBtn.addEventListener('click', () => setPlaying(!playing));
rail.forEach((r, i) => r.addEventListener('click', () => { filmT = (STEPS[i] + .004) * FILM; setPlaying(true); }));
onLang(() => setPlaying(playing));
function filmCut(t) { return Math.max(1 - clamp(t / FADE), clamp((t - (FILM + HOLD - FADE)) / FADE)); }
function loop(now) {
  const ms = now - last, dt = Math.min(.05, ms / 1000); last = now;
  const live = onScreen && !document.hidden;
  if (live && playing && !Q.has('freeze')) { filmT += dt; if (filmT > FILM + HOLD) filmT = 0; }
  P = clamp(filmT / FILM);
  if (!Q.has('vidcap')) stage.style.setProperty('--cut', filmCut(filmT).toFixed(3));
  if (live && !Q.has('freeze')) { draw(P, (now - T0) / 1000); if (frames > 10 && ms < 200) adapt(ms); }
  frames++; if (frames === 8) window.__ready = true;
  requestAnimationFrame(loop);
}
/* Préchauffage : on dessine une fois chaque phase du récit, une par image, derrière l'affiche,
   pour que le navigateur compile tous les matériaux avant que le lecteur n'y arrive (sinon saccade de 50 à 90 ms à chaque nouvelle phase). */
function reveal() { root.classList.add('gl-on'); window.__revealAt = Math.round(performance.now()); }
function warm(i) {
  const steps = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1];
  if (i < steps.length && !STILL) { draw(steps[i], 1); requestAnimationFrame(() => warm(i + 1)); return; }
  P = clamp(filmT / FILM); draw(P, 0); last = performance.now(); reveal(); setPlaying(true); requestAnimationFrame(loop);
}
document.fonts.ready.then(() => warm(0));
