'use strict';
// Prisma Pop art & story: pixel-art sprites (Prismi the gem, Grisón the grey cloud), block tiles, world scenes and dialog lines. No game logic.

// ---------- pixel art: everything is drawn on tiny canvases and scaled up without smoothing ----------
const PAL = { o: '#1d0f4a', k: '#1d0f4a', w: '#ffffff', c: '#9becff', p: '#8a5cff', m: '#ff4fd8', d: '#4417bd', r: '#ff7ab8', h: '#ff5c8a', b: '#7fd8ff',
  G: '#2b2e38', g: '#6b7080', l: '#9aa0ad', s: '#4d5260', y: '#ffdf5c', K: '#1a1c22', B: '#0b3d66', D: '#1a8fd6' };
function pxCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function gridCanvas(rows) {
  const c = pxCanvas(rows[0].length, rows.length), g = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
  return c;
}
const setPx = (rows, pts, ch) => pts.forEach(([x, y]) => { rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1); });
const pxCache = new Map();
function pxImg(key, make, size) {
  let v = pxCache.get(key); if (!v) { const c = gridCanvas(make()); v = [c.toDataURL(), c.width, c.height]; pxCache.set(key, v); }
  const w = Math.max(v[1], Math.round(size / v[1]) * v[1]); // whole-pixel scale keeps the pixels square
  return `<img class="px" src="${v[0]}" width="${w}" height="${w * v[2] / v[1]}" alt="" draggable="false">`;
}

// Prismi: 16x18 gem body, padded to 20 wide for the arms; faces are pixel lists in padded coordinates
const PRISMI_BODY = ['......oooo......', '.....owwcco.....', '....owwccppo....', '...owwcccpppo...', '..owwccccppppo..', '.owcccccpppppmo.',
  'owccccppppppmmmo', 'occcccppppppmmmo', 'occccpppppppmmmo', 'occcpppppppmmmmo', 'occcpppppppmmmmo', '.occpppppppmmmo.',
  '..ocppppppmmmo..', '...opppppmmmo...', '....oppppmmo....', '.....oppmmo.....', '......oooo......', '.....dd..dd.....'];
const PRISMI_FACE = {
  happy: { k: [[6, 7], [6, 8], [7, 8], [6, 9], [7, 9], [12, 7], [12, 8], [13, 8], [12, 9], [13, 9], [8, 11], [9, 12], [10, 12], [11, 11]], w: [[7, 7], [13, 7]], h: [[9, 11], [10, 11]], r: [[5, 10], [14, 10]] },
  wow: { w: [[5, 6], [6, 6], [7, 6], [5, 7], [7, 7], [5, 8], [6, 8], [7, 8], [12, 6], [13, 6], [14, 6], [12, 7], [14, 7], [12, 8], [13, 8], [14, 8]], k: [[6, 7], [13, 7], [9, 11], [10, 11], [9, 12], [10, 12]], h: [[9, 13], [10, 13]], r: [[4, 10], [15, 10]] },
  sad: { k: [[5, 9], [6, 8], [7, 8], [12, 8], [13, 8], [14, 9], [9, 11], [10, 11], [8, 12], [11, 12]], b: [[6, 10], [6, 11]] },
  worried: { k: [[6, 8], [7, 8], [6, 9], [7, 9], [12, 8], [13, 8], [12, 9], [13, 9], [5, 6], [6, 6], [7, 5], [14, 6], [13, 6], [12, 5], [8, 12], [9, 11], [10, 12], [11, 11]], w: [[7, 8], [13, 8]] },
};
const ARMS = { up: [[1, 8], [0, 7], [0, 6], [0, 5], [18, 8], [19, 7], [19, 6], [19, 5]], down: [[1, 9], [0, 10], [0, 11], [18, 9], [19, 10], [19, 11]] };
function prismiPx(mood = 'happy', size = 80) {
  return pxImg('p' + mood, () => {
    const rows = PRISMI_BODY.map(r => '..' + r + '..'), f = PRISMI_FACE[mood];
    for (const ch in f) setPx(rows, f[ch], ch);
    setPx(rows, mood === 'happy' || mood === 'wow' ? ARMS.up : ARMS.down, 'd');
    setPx(rows, [[17, 0], [16, 1], [17, 1], [18, 1], [17, 2]], 'w'); // sparkle
    return rows;
  }, size);
}
// Grisón: a cloud made of circles, rim-lit and auto-outlined, with a stone crown
function grisonPx(mood = 'angry', size = 110) {
  return pxImg('g' + mood, () => {
    const w = 28, h = 22, C = [[8, 15, 5], [13, 11, 6.5], [18, 15, 5], [13, 15, 5]];
    const inC = (x, y) => C.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r);
    let rows = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => !inC(x, y) ? '.' : !inC(x, y - 1) ? 'l' : !inC(x, y + 1) || !inC(x, y + 2) ? 's' : 'g').join(''));
    const band = []; for (let x = 9; x <= 17; x++) band.push([x, 3], [x, 4], [x, 5]);
    setPx(rows, [[10, 1], [13, 1], [16, 1], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], ...band], 'l');
    setPx(rows, [[12, 4], [13, 4], [14, 4]], 's');
    if (mood === 'defeated') {
      setPx(rows, [[9, 10], [11, 10], [10, 11], [9, 12], [11, 12], [15, 10], [17, 10], [16, 11], [15, 12], [17, 12], [10, 15], [11, 14], [12, 15], [13, 14], [14, 15], [15, 14], [16, 15]], 'K');
      setPx(rows, [[19, 9], [19, 10]], 'b');
    } else {
      setPx(rows, [[10, 11], [11, 11], [10, 12], [15, 11], [16, 11], [16, 12]], 'y');
      setPx(rows, [[11, 12], [15, 12], [9, 9], [10, 9], [11, 10], [17, 9], [16, 9], [15, 10], [12, 14], [13, 14], [14, 14], [11, 15], [15, 15]], 'K');
      setPx(rows, [[13, 15]], 'w');
      setPx(rows, [[26, 12], [25, 13], [25, 14], [26, 14], [27, 14], [26, 15], [25, 16]], 'y'); // lightning
    }
    const filled = (x, y) => rows[y] && rows[y][x] && rows[y][x] !== '.';
    return rows.map((row, y) => [...row].map((ch, x) => ch === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ? 'G' : ch).join(''));
  }, size);
}
// collectable gem shown on top of a block
let gemPxC; const gemPx = () => gemPxC || (gemPxC = gridCanvas(['.BBBBBBB.', 'BwwcccDDB', 'BcccccDDB', '.BccDDDB.', '..BcDDB..', '...BDB...', '....B....']));
// 12x12 bevelled block tile; kind 'stone' gets cracks, 'ice' gets frost streaks
function blockTile([base, light, dark], kind) {
  const c = pxCanvas(12, 12), g = c.getContext('2d'), F = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  F(1, 0, 10, 12, '#1d0f4a'); F(0, 1, 12, 10, '#1d0f4a'); F(1, 1, 10, 10, base);
  F(1, 1, 10, 1, light); F(1, 1, 1, 10, light); F(2, 10, 9, 1, dark); F(10, 2, 1, 9, dark);
  if (kind === 'stone') [[4, 4], [5, 5], [5, 6], [6, 7], [7, 7], [3, 8], [8, 3]].forEach(([x, y]) => F(x, y, 1, 1, dark));
  else { F(2, 2, 2, 1, '#fff'); F(2, 3, 1, 1, '#fff'); F(8, 8, 1, 1, 'rgba(255,255,255,.6)'); }
  if (kind === 'ice') [[3, 7], [4, 6], [5, 5], [6, 8], [7, 7], [8, 6]].forEach(([x, y]) => F(x, y, 1, 1, '#fff'));
  return c;
}

// ---------- pixel world scenes (dithered sky, ridges, props); 1 scene pixel = 4 css px ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const CLASSIC_THEME = { hue: 262, bg: ['#5b2fa8', '#0d0626'] };
function pxScene(wi, w, h, tall = false) {
  const T = WORLDS[wi] || CLASSIC_THEME, hue = T.hue, c = pxCanvas(w, h), g = c.getContext('2d'), R = mulberry32(wi * 131 + 7 + w + h);
  const F = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), ww, hh); };
  const hs = (s, l, dh = 0) => `hsl(${hue + dh},${s}%,${l}%)`;
  const circ = (cx, cy, r, col) => { for (let dy = -r; dy <= r; dy++) { const d = Math.floor(Math.sqrt(r * r - dy * dy)); F(cx - d, cy + dy, 2 * d + 1, 1, col); } };
  const tri = (cx, top, n, col) => { for (let i = 0; i < n; i++) F(cx - i, top + i, 2 * i + 1, 1, col); };
  // sky: dark at the top, glowing towards the horizon, 7 bands with ordered dithering
  const [a, b] = T.bg.map(x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16))), img = g.createImageData(w, h), L = 7, hz = tall ? h : h * 0.8;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = (1 - Math.min(1, y / hz)) * (L - 1), k = Math.min(L - 1, (v | 0) + (v % 1 > BAYER[(y & 3) * 4 + (x & 3)] / 16 ? 1 : 0)) / (L - 1), o = (y * w + x) * 4;
    for (let j = 0; j < 3; j++) img.data[o + j] = a[j] + (b[j] - a[j]) * k;
    img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < w * h / 70; i++) F(R() * w, R() * h * (tall ? 1 : 0.7), 1, 1, `rgba(255,255,255,${(0.2 + R() * 0.6).toFixed(2)})`);
  for (let i = 0; i < w * h / 900; i++) { const x = R() * w, y = R() * h * 0.6; F(x - 1, y, 3, 1, '#fff'); F(x, y - 1, 1, 3, '#fff'); } // twinkles
  // world specials
  const far = h - Math.min(h * 0.24, 40), near = h - Math.min(h * 0.12, 18);
  if (wi === -1) { circ(w * 0.8 | 0, h * 0.08 + 6 | 0, 6, '#fff3c4'); circ((w * 0.8 | 0) + 2, (h * 0.08 + 6 | 0) - 1, 1, '#e8d79a'); }
  if (wi === 1) for (let x = 2; x < w; x += 5 + (R() * 4 | 0)) { const n = 4 + R() * 12 | 0; F(x, 0, 3, n / 2 | 0, '#c9f0ff'); F(x + 1, 0, 1, n, '#eafaff'); }
  if (wi === 3) [['#ff3b5c', 0], ['#ff8a00', 1], ['#ffd000', 2], ['#1fe08a', 3], ['#00c8ff', 4], ['#8a5cff', 5]].forEach(([col, k]) => {
    const cx = w / 2, cy = far, r = Math.min(w * 0.45, h * 0.5) - k * 2;
    for (let x = -r; x <= r; x++) { const y = Math.sqrt(Math.max(0, r * r - x * x)); F(cx + x, cy - y, 1, 2, col); }
  });
  if (wi === 4) for (let i = 0; i < 5; i++) { const x0 = R() * w; for (let y = 0; y < h * 0.7; y++) F(x0 + y * 0.4, y, 3, 1, 'rgba(160,230,255,.08)'); } // light rays
  if (wi === 5) { circ(w * 0.75 | 0, h * 0.1 + 8 | 0, 9, '#ffb627'); circ(w * 0.75 | 0, h * 0.1 + 8 | 0, 7, '#ffd23f'); }
  // ridges
  const RIDGE = { '-1': [hs(40, 18), hs(45, 9)], 0: [hs(45, 20), hs(50, 11)], 1: [hs(35, 32), '#dff4ff'], 2: [hs(50, 15), '#2a0f14'], 3: ['#c9a8f0', '#f3e6ff'], 4: [hs(45, 22), '#d9b77a'], 5: ['#c98a2e', '#e8b860'] }[wi];
  const ridge = (base, amp, f, ph, col) => { for (let x = 0; x < w; x++) { const t = base - amp * (Math.sin(x * f + ph) * 0.6 + Math.sin(x * f * 2.7 + ph * 3) * 0.4); F(x, t, 1, h, col); } };
  ridge(far, wi === 5 ? 6 : 10, wi === 3 ? 0.3 : 0.08, R() * 6, RIDGE[0]);
  if (wi === 2) { const cx = w * 0.7 | 0, top = far - Math.min(40, h * 0.2) | 0; for (let i = 0; i < far - top + 4; i++) F(cx - 4 - i, top + i, 9 + 2 * i, 1, '#3a1a20'); F(cx - 4, top, 9, 2, '#ff6a00'); F(cx - 1, top + 2, 2, (far - top) / 2, '#ff3b00'); F(cx - 2, top - 2, 1, 1, '#ffd000'); F(cx + 2, top - 4, 1, 1, '#ff8a00'); }
  ridge(near, 3, wi === 3 ? 0.4 : 0.15, R() * 6, RIDGE[1]);
  // props: a row along the ground, plus little floating islands on the tall map
  const PROPS = [
    (x, y) => R() < 0.6 ? (F(x, y - 3, 2, 3, '#5a3418'), tri(x, y - 13, 4, '#2fbf71'), tri(x, y - 10, 5, '#1f9a5a'), tri(x, y - 6, 4, '#147344'))
      : R() < 0.5 ? (F(x, y - 6, 2, 6, '#9becff'), F(x + 2, y - 4, 1, 4, '#4fc3f7'), F(x - 1, y - 3, 1, 3, '#c9f5ff'), F(x, y - 7, 1, 1, '#fff'))
        : (F(x, y - 3, 2, 3, '#f5e6c8'), F(x - 2, y - 5, 6, 2, '#ff3b5c'), F(x - 1, y - 6, 4, 1, '#ff3b5c'), F(x - 1, y - 5, 1, 1, '#fff'), F(x + 2, y - 5, 1, 1, '#fff')),
    (x, y) => R() < 0.6 ? (tri(x, y - 8, 8, '#8fe3ff'), F(x, y - 8, 1, 8, '#eafaff'))
      : (circ(x, y - 3, 3, '#eafaff'), circ(x, y - 8, 2, '#fff'), F(x - 1, y - 9, 1, 1, '#1d0f4a'), F(x + 1, y - 9, 1, 1, '#1d0f4a'), F(x, y - 8, 2, 1, '#ff8a00')),
    (x, y) => R() < 0.5 ? (circ(x, y - 2, 3, '#4a2a30'), F(x - 1, y - 4, 2, 1, '#6e4048'))
      : (F(x - 1, y - 4, 3, 4, '#ff6a00'), F(x, y - 6, 1, 2, '#ffd000'), F(x - 2, y - 2, 5, 2, '#ff3b00')),
    (x, y) => (circ(x, y - 3, 3, '#fff'), circ(x + 4, y - 2, 2, '#fff'), circ(x - 4, y - 2, 2, '#ffe0f5'), F(x - 6, y - 1, 13, 1, '#f3c6ff')),
    (x, y) => R() < 0.5 ? Array.from({ length: 9 }, (_, i) => F(x + (Math.sin(i * 0.9) > 0 ? 1 : 0), y - i, 1, 1, '#1fe08a'))
      : (F(x, y - 10, 4, 2, '#ffd000'), F(x + 4, y - 11, 1, 4, '#ff8a00'), F(x + 1, y - 10, 1, 1, '#1d0f4a'), F(x - 1, y - 2, 4, 2, '#ffb0c8')),
    (x, y) => R() < 0.6 ? (F(x, y - 9, 2, 9, '#2f9e4f'), F(x - 2, y - 5, 2, 1, '#2f9e4f'), F(x - 3, y - 8, 1, 4, '#2f9e4f'), F(x + 2, y - 4, 2, 1, '#2f9e4f'), F(x + 3, y - 7, 1, 4, '#2f9e4f'), F(x, y - 9, 1, 9, '#55c46f'))
      : (F(x - 2, y - 2, 5, 2, '#a86a24'), F(x - 1, y - 3, 3, 1, '#c98a2e')),
  ];
  const prop = PROPS[wi] || ((x, y) => (F(x, y - 5, 2, 5, '#cbb6ff'), F(x, y - 6, 1, 1, '#fff')));
  for (let x = 3 + R() * 6; x < w - 3; x += 9 + R() * 10) prop(x | 0, near + 3 + R() * Math.max(1, h - near - 4) | 0);
  if (tall) for (let y = 40; y < near - 30; y += 22 + R() * 20) {
    const x = (R() < 0.5 ? 4 + R() * w * 0.14 : w * 0.86 - R() * w * 0.14 + 0) | 0;
    if (wi !== 3 && wi !== 4) F(x - 6, y, 13, 2, RIDGE[1]);
    prop(x, y);
  }
  return c;
}

// one world every 10 levels; after the last one they come back as "II", "III"...
const WORLDS = [
  { name: 'Bosque Cristal', hue: 150, bg: ['#11604c', '#062a24'], line: '¡Los árboles de cristal están perdiendo su brillo! Hay que darse prisa.' },
  { name: 'Cuevas Heladas', hue: 200, bg: ['#1d568f', '#0a1f3d'], line: 'Brrr… Grisón ha congelado las cuevas. ¡Rompe todo el hielo!' },
  { name: 'Volcán Rubí', hue: 8, bg: ['#7d1f2e', '#2e0710'], line: 'Aquí hace mucho calor… y hay piedras por todas partes. ¡Cuidado!' },
  { name: 'Nubes Prisma', hue: 285, bg: ['#5e2c90', '#22103d'], line: '¡Estamos en las nubes! Grisón quiere apagar el arcoíris.' },
  { name: 'Océano Zafiro', hue: 215, bg: ['#11507e', '#041a33'], line: 'Las perlas del océano se han vuelto grises. ¡Vamos a recuperarlas!' },
  { name: 'Desierto Ámbar', hue: 38, bg: ['#8d5c14', '#331f04'], line: 'Arena por todas partes… pero las gemas brillan más que nunca.' },
];
const worldIdx = n => Math.floor((n - 1) / 10);
const worldOf = n => WORLDS[worldIdx(n) % WORLDS.length];
const worldName = n => { const lap = Math.floor(worldIdx(n) / WORLDS.length); return worldOf(n).name + (lap ? ' ' + ['II', 'III', 'IV', 'V', 'VI'][Math.min(4, lap - 1)] : ''); };

const STORY = {
  intro: [
    { who: 'prismi', mood: 'happy', text: '¡Hola! Soy <b>Prismi</b>, la gema más brillante del reino. 💎' },
    { who: 'grison', mood: 'angry', text: '¡Ja, ja, ja! Soy <b>Grisón</b>. He llenado el mundo de piedra gris. ¡Los colores son una pesadez!' },
    { who: 'prismi', mood: 'worried', text: '¡Oh, no! Si completamos líneas en los tableros, los colores volverán. ¿Me ayudas?' },
  ],
  world: n => [{ who: 'prismi', mood: 'wow', text: `¡Bienvenido a <b>${worldName(n)}</b>! ${worldOf(n).line}` }],
  boss: n => [
    { who: 'grison', mood: 'angry', text: ['¡Este tablero es mío! No pasarás de aquí.', '¡Mis piedras son indestructibles!', '¡Te quedarás sin movimientos, ja, ja!', '¡Nadie ha superado nunca mi trampa!'][(n / 10 - 1) % 4] },
    { who: 'prismi', mood: 'happy', text: '¡No le tenemos miedo! ¡A por él! 💪' },
  ],
  bossWin: n => [
    { who: 'grison', mood: 'defeated', text: '¡Grrr! Esta vez has ganado… ¡pero te espero en el próximo mundo!' },
    { who: 'prismi', mood: 'wow', text: `¡Lo hemos conseguido! El color vuelve a <b>${worldName(n)}</b>. 🌈` },
  ],
};
const CHEERS = ['¡Increíble!', '¡Qué pasada!', '¡Sigue así!', '¡Eres un crack!', '¡Wooow!'];
