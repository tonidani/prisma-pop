'use strict';
// Adventure map in 3D space: every planet is a level. Sectors stack upwards; each splits into 3 routes (easy/normal/hard)
// that spiral out and rejoin at Grisón's boss planet. Drag to orbit/scroll, pinch or wheel to zoom, tap a planet to fly to it.
// Uses globals from index.html (starsMap, levelIntro, tone, ensureAudio, $map, story) and art.js (pxCanvas, BAYER, WORLDS, prismiPx).
const $space = document.getElementById('space'), sctx = $space.getContext('2d'), $pinfo = document.getElementById('pinfo');
const ROUTES = [['Fácil', '#1fe08a'], ['Normal', '#ffd60a'], ['Difícil', '#ff3b5c']];
const cam = { yaw: 0.6, pitch: 0.3, dist: 14, t: [0, 4, 0], goal: null };
let spaceOn = false, sel = 0, sW = 0, sH = 0, sDPR = 1, maxSector = 0;
const done = n => (starsMap[n] || 0) > 0, openLv = n => isOpen(n, done);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function planetPos(n) {
  if (n === 0) return [0, 0, 0]; // home base
  const s = sectorOf(n), r = routeOf(n);
  if (r < 0) return [0, (s + 1) * 10, 0];
  const t = ((n - 1) % 10 % 3 + 1) / 4, a = r * 2.094 + s * 0.9, rad = 3.6 * Math.sin(Math.PI * t);
  return [Math.cos(a) * rad, s * 10 + t * 10, Math.sin(a) * rad];
}
// pixel sphere: dithered light, wavy bands in the theme colour, dark outline; boss planets are grey with a golden ring
const planetSprites = new Map();
function planetSprite(t, boss) {
  const key = t + (boss ? 'b' : ''); if (planetSprites.has(key)) return planetSprites.get(key);
  const S = boss ? 40 : 24, R = boss ? 11.5 : 10.5, c = pxCanvas(S, S), g = c.getContext('2d'), cx = S / 2 - 0.5, cy = S / 2 - 0.5;
  const hue = boss ? 230 : WORLDS[t].hue, sat = boss ? 10 : 70, F = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const ring = front => { if (boss) for (let a = 0; a < 6.3; a += 0.01) if ((Math.sin(a) > 0) === front) F(Math.round(cx + Math.cos(a) * 18), Math.round(cy + Math.sin(a) * 4 - Math.cos(a) * 3), front ? '#ffd60a' : '#8a6d00'); };
  ring(false);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x - cx) / R, dy = (y - cy) / R, d2 = dx * dx + dy * dy;
    if (d2 > (1 + 1.4 / R) ** 2) continue;
    if (d2 > 1) { F(x, y, '#0d0626'); continue; }
    const l = Math.max(0, -dx * 0.5 - dy * 0.55 + Math.sqrt(1 - d2) * 0.68), band = Math.sin((dy * 3 + Math.sin(dx * 4 + t) * 0.6) * 3) * 0.13;
    const lv = clamp(Math.floor((l + band) * 5 + BAYER[(y & 3) * 4 + (x & 3)] / 16), 0, 5);
    F(x, y, t === 1 && !boss && Math.abs(dy) > 0.72 ? '#eafaff' : `hsl(${hue + band * 80},${sat}%,${8 + lv * 12}%)`);
  }
  F(Math.round(cx - R * 0.45), Math.round(cy - R * 0.5), '#fff');
  ring(true);
  planetSprites.set(key, c); return c;
}
const STARS = Array.from({ length: 260 }, () => { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, q = Math.sqrt(1 - u * u); return [q * Math.cos(a), u, q * Math.sin(a), Math.random() < 0.15 ? 3 : 2, Math.random()]; });
const prismiImg = new Image(); prismiImg.src = prismiPx('happy', 20).match(/src="([^"]+)"/)[1];

function rot(p) { // camera rotation only (yaw then pitch)
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const x1 = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy;
  return [x1, p[1] * cp - z1 * sp, p[1] * sp + z1 * cp];
}
function proj(p) {
  const [x, y, z] = rot([p[0] - cam.t[0], p[1] - cam.t[1], p[2] - cam.t[2]]), d = z + cam.dist, f = Math.min(sW, sH) * 0.9;
  return d < 0.5 ? null : { x: sW / 2 + x * f / d, y: sH * 0.46 - y * f / d, k: f / d, d };
}
function spaceNodes() {
  const top = Math.max(...Object.keys(starsMap).map(Number), 1);
  maxSector = sectorOf(top) + (done(sectorOf(top) * 10 + 10) ? 1 : 0);
  return Array.from({ length: (maxSector + 2) * 10 }, (_, i) => i + 1);
}
function frontier() { // the open, unbeaten planet furthest along (the boss beats route planets of its sector)
  const c = spaceNodes().filter(n => openLv(n) && !done(n));
  return c.sort((a, b) => (sectorOf(b) - sectorOf(a)) || (routeOf(a) < 0 ? -1 : routeOf(b) < 0 ? 1 : a - b))[0] || 1;
}

function spaceFrame(now) {
  if (!$map.classList.contains('on')) { spaceOn = false; return; }
  requestAnimationFrame(spaceFrame);
  if (cam.goal) {
    for (let k = 0; k < 3; k++) cam.t[k] += (cam.goal.t[k] - cam.t[k]) * 0.1;
    cam.dist += (cam.goal.dist - cam.dist) * 0.1; cam.yaw += (cam.goal.yaw - cam.yaw) * 0.06;
    if (Math.abs(cam.goal.dist - cam.dist) < 0.02 && Math.abs(cam.goal.t[1] - cam.t[1]) < 0.02) cam.goal = null;
  } else if (!drag3) cam.yaw += 0.0008; // slow idle drift keeps it feeling 3D
  const g = sctx, T = now / 1000; g.setTransform(sDPR, 0, 0, sDPR, 0, 0); g.imageSmoothingEnabled = false;
  g.fillStyle = '#07031a'; g.fillRect(0, 0, sW, sH);
  for (const [x, y, z, sz, ph] of STARS) { // sky sphere: rotates with the camera, never moves
    const r = rot([x, y, z]); if (r[2] < 0.1) continue;
    const f = Math.min(sW, sH) * 0.9; g.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(T * 1.5 + ph * 9));
    g.fillStyle = ph < 0.1 ? '#ffd6f5' : ph < 0.2 ? '#bfe9ff' : '#fff'; g.fillRect((sW / 2 + r[0] / r[2] * f) | 0, (sH / 2 - r[1] / r[2] * f) | 0, sz, sz);
  }
  g.globalAlpha = 1;
  const nodes = spaceNodes(), P = new Map([[0, proj(planetPos(0))], ...nodes.map(n => [n, proj(planetPos(n))])]);
  // routes: hub -> 3 planets -> boss, coloured by class; dashed and dim while locked
  for (let s = 0; s <= maxSector + 1; s++) for (let r = 0; r < 3; r++) {
    const chain = [s ? s * 10 : 0, s * 10 + r * 3 + 1, s * 10 + r * 3 + 2, s * 10 + r * 3 + 3, s * 10 + 10];
    for (let i = 0; i < 4; i++) {
      const a = P.get(chain[i]), b = P.get(chain[i + 1]); if (!a || !b) continue;
      const end = chain[i + 1], on = i < 3 ? openLv(end) : done(chain[3]);
      g.strokeStyle = on ? ROUTES[r][1] : 'rgba(255,255,255,.22)'; g.globalAlpha = on ? (done(end) || i === 3 ? 0.95 : 0.6) : 1;
      g.lineWidth = clamp((a.k + b.k) * 0.05, 2, 8); g.setLineDash(on ? [] : [4, 8]);
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
  }
  g.setLineDash([]); g.globalAlpha = 1;
  // planets far to near
  const order = [0, ...nodes].filter(n => P.get(n)).sort((a, b) => P.get(b).d - P.get(a).d);
  for (const n of order) {
    const p = P.get(n), boss = n && routeOf(n) < 0, R = (n === 0 ? 0.7 : boss ? 1.1 : 0.6) * p.k, isOpen_ = n === 0 || openLv(n);
    if (p.x < -R * 2 || p.x > sW + R * 2 || p.y < -R * 2 || p.y > sH + R * 2) continue;
    const spr = planetSprite(n ? themeIdx(n) : 3, boss), w = R * 2 * spr.width / (boss ? 23 : 21);
    g.globalAlpha = isOpen_ ? 1 : 0.3; g.drawImage(spr, p.x - w / 2, p.y - w / 2, w, w); g.globalAlpha = 1;
    if (n && isOpen_ && !done(n)) { g.strokeStyle = '#fff'; g.globalAlpha = 0.5 + 0.5 * Math.sin(T * 5); g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, R * 1.35, 0, 7); g.stroke(); g.globalAlpha = 1; }
    if (n === sel) { // pixel corner brackets
      const q = R * 1.6, L = Math.max(6, R * 0.5); g.fillStyle = '#ffd60a';
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { g.fillRect(p.x + sx * q - (sx > 0 ? L : 0), p.y + sy * q - (sy > 0 ? 3 : 0), L, 3); g.fillRect(p.x + sx * q - (sx > 0 ? 3 : 0), p.y + sy * q - (sy > 0 ? L : 0), 3, L); });
    }
    if (R > 9) {
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${R > 22 ? 16 : 8}px "Press Start 2P", monospace`;
      const label = n === 0 ? 'BASE' : !isOpen_ ? '🔒' : boss ? '👑' : String(n), y = p.y + R * 1.35 + 12;
      g.fillStyle = '#0d0626'; g.fillText(label, p.x + 2, y + 2); g.fillStyle = '#fff'; g.fillText(label, p.x, y);
      if (done(n)) { g.font = `${R > 22 ? 14 : 10}px Fredoka, system-ui`; g.fillText('⭐'.repeat(starsMap[n]) + '☆'.repeat(3 - starsMap[n]), p.x, y + (R > 22 ? 20 : 13)); }
    }
  }
  const ps = P.get(sel); // Prismi hovers over the selected planet
  if (ps) { const s = clamp(ps.k * 0.9, 24, 64), R = (routeOf(sel) < 0 ? 1.1 : 0.6) * ps.k; g.drawImage(prismiImg, ps.x - s / 2, ps.y - R - s * 1.05 + Math.round(Math.sin(T * 4)) * 3, s, s * 0.9); }
}

function selectPlanet(n, instant) {
  sel = n; const p = planetPos(n), yaw = Math.atan2(-p[0], -p[2]) || cam.yaw; // turn so the planet faces the camera
  const goal = { t: p, dist: 8, yaw: cam.yaw + Math.atan2(Math.sin(yaw - cam.yaw), Math.cos(yaw - cam.yaw)) };
  if (instant) { cam.t = [...p]; cam.dist = 12; cam.yaw = goal.yaw; }
  cam.goal = goal;
  const r = routeOf(n), st = starsMap[n] || 0, ok = openLv(n);
  const why = r < 0 ? 'Termina cualquier ruta de este sector' : (n - 1) % 10 % 3 ? `Supera antes el planeta ${n - 1}` : `Vence antes al jefe ${sectorOf(n) * 10}`;
  $pinfo.innerHTML = `<div class="pt">Planeta ${n} · ${worldName(n)}</div>
    <div class="pr">${r < 0 ? '<span style="color:#ff9db0">👑 Jefe Grisón</span>' : `<span style="color:${ROUTES[r][1]}">● Ruta ${ROUTES[r][0]}</span>`} · Sector ${sectorOf(n) + 1} · ${st ? '⭐'.repeat(st) + '☆'.repeat(3 - st) : ok ? 'sin jugar' : '🔒 ' + why}</div>
    ${ok ? `<button class="b1" id="pGo">▶ ${st ? 'Repetir' : 'Entrar'}</button>` : ''}`;
  if (ok) document.getElementById('pGo').onclick = () => { ensureAudio(); tone(600, 0.06, 'sine', 0.1, 0, 900); levelIntro(n); };
}
function sizeSpace() {
  sDPR = window.devicePixelRatio || 1; sW = innerWidth; sH = innerHeight;
  $space.width = sW * sDPR; $space.height = sH * sDPR; $space.style.width = sW + 'px'; $space.style.height = sH + 'px';
}
addEventListener('resize', () => { if (spaceOn) sizeSpace(); });
function openMap() {
  hideCard(); isOver = true; $map.classList.add('on'); sizeSpace();
  selectPlanet(frontier(), true);
  if (!spaceOn) { spaceOn = true; requestAnimationFrame(spaceFrame); }
  story('intro', STORY.intro);
}

// input: one finger orbits (x) and travels along the tree (y); two fingers or wheel zoom; a tap picks a planet
const ptrs = new Map(); let drag3 = false, moved = 0, pinch0 = 0;
const pdist = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; };
const zoom = f => { cam.goal = null; cam.dist = clamp(cam.dist * f, 4, 60); };
$space.addEventListener('pointerdown', e => { ensureAudio(); $space.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); drag3 = true; moved = 0; if (ptrs.size === 2) pinch0 = pdist(); });
$space.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  const [px, py] = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 2) { const d = pdist(); zoom(pinch0 / d); pinch0 = d; moved = 99; return; }
  const dx = e.clientX - px, dy = e.clientY - py; moved += Math.abs(dx) + Math.abs(dy); if (moved < 8) return;
  cam.goal = null; cam.yaw -= dx * 0.008; cam.t[1] = clamp(cam.t[1] + dy * 0.0025 * cam.dist, -2, (maxSector + 2) * 10 + 2);
  cam.t[0] *= 0.96; cam.t[2] *= 0.96; // drift back to the trunk while travelling
});
const up = e => {
  if (!ptrs.delete(e.pointerId)) return; drag3 = ptrs.size > 0;
  if (moved >= 8 || ptrs.size) return;
  let best = null, bd = 1e9; // nearest planet under the finger, front ones first
  for (const n of spaceNodes()) { const p = proj(planetPos(n)); if (!p) continue; const R = (routeOf(n) < 0 ? 1.1 : 0.6) * p.k, d = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (d < Math.max(22, R * 1.4) && d - p.d * 0.01 < bd) { bd = d; best = n; } }
  if (best) { tone(openLv(best) ? 760 : 200, 0.07, 'sine', 0.1, 0, openLv(best) ? 1200 : 150); selectPlanet(best); }
};
$space.addEventListener('pointerup', up); $space.addEventListener('pointercancel', up);
$space.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 0.89); }, { passive: false });
document.getElementById('zIn').onclick = () => zoom(0.75);
document.getElementById('zOut').onclick = () => zoom(1.33);
document.getElementById('zHome').onclick = () => selectPlanet(frontier());
