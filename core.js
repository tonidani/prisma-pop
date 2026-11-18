'use strict';
// Prisma Pop core: board rules, scoring, piece dealing, level generator and validation bot. Pure logic, no DOM.
// N is the current board size; adventure levels change it (6-10), every rule below reads it at call time
let N = 8;
const STONE = 8, ICE = 9, VOID = 10, NCOL = 7; // VOID: cell outside a shaped board, never playable, never cleared
const isObstacleOnly = v => v === STONE || v === VOID;
function withSize(n, fn) { const old = N; N = n; try { return fn(); } finally { N = old; } }

// ---------- shapes ----------
const BASE = ['#', '##', '###', '####', '#####', '##|##', '###|###|###', '#.|##', '#..|###', '###|.#.', '.##|##.', '##.|.##', '##|##|##', '#..|#..|###'];
const parse = s => s.split('|').flatMap((row, r) => [...row].map((ch, c) => ch === '#' ? [r, c] : null)).filter(Boolean);
const norm = cs => { const mr = Math.min(...cs.map(p => p[0])), mc = Math.min(...cs.map(p => p[1])); return cs.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
const SHAPES = []; { const seen = new Set();
  for (const b of BASE) { let cs = parse(b); for (let i = 0; i < 4; i++) { cs = norm(cs.map(([r, c]) => [c, -r])); const k = JSON.stringify(cs); if (!seen.has(k)) { seen.add(k); SHAPES.push(cs); } } } }
const BIG = SHAPES.filter(s => s.length >= 5);
const dims = cs => [Math.max(...cs.map(p => p[0])) + 1, Math.max(...cs.map(p => p[1])) + 1];

function mulberry32(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- board ----------
// g: 0 empty, 1..7 colour, STONE (indestructible), ICE (needs 2 hits, hp in B.hp). gem: block carries a gem.
const emptyGrid = (v = 0) => Array.from({ length: N }, () => Array(N).fill(v));
const newBoard = () => ({ g: emptyGrid(), hp: emptyGrid(), gem: emptyGrid(false) });
const cloneBoard = B => ({ g: B.g.map(r => r.slice()), hp: B.hp.map(r => r.slice()), gem: B.gem.map(r => r.slice()) });
const fits = (g, cs, r, c) => cs.every(([dr, dc]) => { const R = r + dr, C = c + dc; return R >= 0 && R < N && C >= 0 && C < N && !g[R][C]; });
function fitsAnywhere(g, cs) { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(g, cs, r, c)) return true; return false; }
// a line is complete when every cell is filled; stones count as filled but a line of only stones never clears
function fullLines(g) {
  const rows = [], cols = [];
  for (let i = 0; i < N; i++) {
    let rf = true, rs = true, cf = true, csx = true;
    for (let j = 0; j < N; j++) {
      const a = g[i][j], b = g[j][i];
      if (!a) rf = false; else if (!isObstacleOnly(a)) rs = false;
      if (!b) cf = false; else if (!isObstacleOnly(b)) csx = false;
    }
    if (rf && !rs) rows.push(i); if (cf && !csx) cols.push(i);
  }
  return { rows, cols };
}
function linesIfPlaced(g, cs, r, c) { const t = g.map(row => row.slice()); cs.forEach(([dr, dc]) => t[r + dr][c + dc] = 1); return fullLines(t); }
// hit one cell; force = bomb (also breaks stone and whole ice)
function hitCell(B, r, c, force) {
  const v = B.g[r][c], out = { color: v, removed: false, cracked: false, gem: false, ice: false };
  if (!v || v === VOID || (v === STONE && !force)) return out;
  if (v === ICE && !force && --B.hp[r][c] > 0) { out.cracked = true; return out; }
  if (v === ICE) out.ice = true;
  if (B.gem[r][c]) { out.gem = true; B.gem[r][c] = false; }
  B.g[r][c] = 0; B.hp[r][c] = 0; out.removed = true;
  return out;
}
function applyMove(B, cells, color, r, c) {
  cells.forEach(([dr, dc]) => B.g[r + dr][c + dc] = color);
  const { rows, cols } = fullLines(B.g), keys = new Set();
  rows.forEach(R => { for (let C = 0; C < N; C++) keys.add(R * N + C); });
  cols.forEach(C => { for (let R = 0; R < N; R++) keys.add(R * N + C); });
  const hits = [...keys].map(k => ({ r: k / N | 0, c: k % N, ...hitCell(B, k / N | 0, k % N, false) }));
  return { n: rows.length + cols.length, rows, cols, hits, gems: hits.filter(h => h.gem).length, ice: hits.filter(h => h.ice).length };
}
const isEmpty = g => g.every(row => row.every(v => !v || v === VOID));
// share of playable cells that are taken (VOID cells are not part of the board)
function fillRatio(g) { let f = 0, p = 0; for (const row of g) for (const v of row) if (v !== VOID) { p++; if (v) f++; } return p ? f / p : 0; }

// ---------- scoring ----------
const linePoints = (n, streak) => n ? (n === 1 ? 20 : n * n * 15) * (1 + Math.max(0, streak - 1) * 0.5) | 0 : 0;
// streak +1 on every clearing move, reset after 3 moves in a row without clearing
const nextStreak = (s, idle, n) => n ? [s + 1, 0] : idle + 1 >= 3 ? [0, idle + 1] : [s, idle + 1];

// ---------- pieces ----------
function randPiece(rnd, d) { const pool = rnd() < d * 0.4 ? BIG : SHAPES; return { cells: pool[rnd() * pool.length | 0], color: 1 + (rnd() * NCOL | 0) }; }
function dealTray(g, rnd, d) {
  const fill = fillRatio(g);
  const tray = [0, 1, 2].map(() => {
    let p = randPiece(rnd, d);
    // soft help on a crowded board, fading out as difficulty rises
    for (let k = 0; fill > 0.45 && k < Math.round(6 * (1 - d)) && !fitsAnywhere(g, p.cells); k++) p = randPiece(rnd, d);
    return p;
  });
  // fairness: never deal a trio where nothing fits if some shape could
  if (!tray.some(p => fitsAnywhere(g, p.cells))) { const ok = SHAPES.filter(cs => fitsAnywhere(g, cs)); if (ok.length) tray[0].cells = ok[rnd() * ok.length | 0]; }
  return tray;
}

// ---------- levels ----------
// 1-10 teach one thing at a time; from 11 on everything comes from the seed
// from level 5 the tutorial also introduces board sizes and shapes
const TUTORIAL = [
  { goal: 'score', prefill: 0 }, { goal: 'score', prefill: 6 }, { goal: 'score', prefill: 10 },
  { goal: 'score', stones: 2, prefill: 4 }, { goal: 'score', stones: 3, prefill: 5, size: 7 },
  { goal: 'gems', gems: 3, prefill: 4, shape: 'corners' }, { goal: 'gems', gems: 5, stones: 2, prefill: 5, size: 9 },
  { goal: 'ice', ice: 4, prefill: 3, shape: 'hole' }, { goal: 'ice', ice: 5, stones: 2, prefill: 2, size: 7 },
  { goal: 'mix', gems: 4, ice: 4, stones: 3, prefill: 3, size: 9, shape: 'cross' },
];
// adventure tree: sector s holds levels s*10+1..s*10+10; three routes of 3 planets (easy 1-3, normal 4-6, hard 7-9) that rejoin at the boss (10)
const sectorOf = n => (n - 1) / 10 | 0;
const routeOf = n => { const k = (n - 1) % 10; return k === 9 ? -1 : k / 3 | 0; }; // -1 = boss
const nextInRoute = n => { const k = (n - 1) % 10; return k === 9 ? null : k % 3 === 2 ? sectorOf(n) * 10 + 10 : n + 1; };
function isOpen(n, done) { // done(n): level n already won
  const s = sectorOf(n), k = (n - 1) % 10;
  if (k === 9) return [3, 6, 9].some(j => done(s * 10 + j)); // any finished route opens the boss
  if (k % 3) return done(n - 1);
  return s === 0 || done(s * 10); // route starts open once the previous boss falls
}
// difficulty: slow upward trend per sector, plus the route class; each planet inside a route a bit harder
function levelDiff(n) {
  const tier = Math.min(1, n / 50), r = routeOf(n), extra = r < 0 ? 0.4 : [0, 0.12, 0.26][r] + ((n - 1) % 10 % 3) * 0.04;
  return Math.min(1, 0.1 + tier * 0.5 + extra);
}
// attempt > 0: same level made easier (fewer obstacles) because the bot found the previous one too hard
function levelLayout(n, attempt = 0) {
  const R = mulberry32(n * 7919 + 13 + attempt * 104729), d = levelDiff(n), ease = Math.max(0, 1 - attempt * 0.25);
  let spec;
  if (n <= TUTORIAL.length) spec = { stones: 0, gems: 0, ice: 0, ...TUTORIAL[n - 1] };
  else {
    const goal = n % 10 === 0 ? 'mix' : ['score', 'gems', 'gems', 'ice', 'ice'][mulberry32(n * 7919 + 13)() * 5 | 0]; // goal never changes between attempts
    spec = { goal, stones: Math.round(d * 5 + R() * 2), prefill: 2 + Math.round(R() * 6),
      gems: goal === 'gems' || goal === 'mix' ? 3 + Math.round(d * 4) : 0, ice: goal === 'ice' || goal === 'mix' ? 3 + Math.round(d * 5) : 0 };
  }
  // still too hard after 3 tries: plainest board allowed (world 2+ never plain 8x8, so corners there)
  spec.shape = attempt >= 3 ? (n > TUTORIAL.length && N === 8 ? 'corners' : 'square') : levelShape(n);
  const B = newBoard();
  if (spec.shape !== 'square') for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (MASKS[spec.shape](r, c)) B.g[r][c] = VOID;
  const area = (N * N - B.g.flat().filter(v => v === VOID).length) / 64; // obstacles scale with the playable area
  if (n > TUTORIAL.length) ['stones', 'prefill', 'gems', 'ice'].forEach(k => spec[k] = Math.round(spec[k] * area));
  spec.stones = Math.round(spec.stones * ease); spec.prefill = Math.round(spec.prefill * ease);
  if (attempt) { spec.ice = Math.max(spec.ice ? 2 : 0, Math.round(spec.ice * ease)); spec.gems = Math.max(spec.gems ? 2 : 0, Math.round(spec.gems * ease)); }
  const stonesIn = (r, c) => { let k = 0; for (let j = 0; j < N; j++) k += (B.g[r][j] === STONE) + (B.g[j][c] === STONE); return k; };
  const put = (count, val, after) => {
    for (let tries = 0, k = 0; k < count && tries < 400; tries++) {
      const r = R() * N | 0, c = R() * N | 0, v = val();
      if (B.g[r][c] || (v === STONE && stonesIn(r, c) >= 2)) continue;
      B.g[r][c] = v;
      const L = fullLines(B.g);
      if (L.rows.length || L.cols.length) { B.g[r][c] = 0; continue; }
      if (after) after(r, c);
      k++;
    }
  };
  const col = () => 1 + (R() * NCOL | 0);
  put(spec.stones, () => STONE);
  put(spec.ice, () => ICE, (r, c) => B.hp[r][c] = attempt < 5 && (d >= 0.45 || n === 9) ? 2 : 1); // double ice only on hard levels (and level 9 teaches it); last resort: single
  put(spec.gems, col, (r, c) => B.gem[r][c] = true);
  put(spec.prefill, col);
  return { n, d, spec, B };
}
// greedy bot: best single placement by lines, goal progress and fewer isolated holes
function evalMove(B, p, r, c) {
  const g = B.g.map(row => row.slice());
  p.cells.forEach(([dr, dc]) => g[r + dr][c + dc] = p.color);
  const { rows, cols } = fullLines(g);
  let prog = 0;
  const hit = (R, C) => { if (B.gem[R][C] && g[R][C] && g[R][C] !== STONE) prog++; if (g[R][C] === ICE) prog += B.hp[R][C] === 1 ? 1 : 0.4; };
  rows.forEach(R => { for (let C = 0; C < N; C++) hit(R, C); });
  cols.forEach(C => { for (let R = 0; R < N; R++) hit(R, C); });
  const stays = v => v === STONE || v === ICE || v === VOID;
  rows.forEach(R => { for (let C = 0; C < N; C++) if (!stays(g[R][C])) g[R][C] = 0; });
  cols.forEach(C => { for (let R = 0; R < N; R++) if (!stays(g[R][C])) g[R][C] = 0; });
  let holes = 0, rough = 0, empty = 0;
  for (let R = 0; R < N; R++) for (let C = 0; C < N; C++) if (!g[R][C]) {
    empty++;
    const nb = [R === 0 || g[R - 1][C], R === N - 1 || g[R + 1][C], C === 0 || g[R][C - 1], C === N - 1 || g[R][C + 1]];
    if (nb.every(Boolean)) holes++;
    if (R > 0 && g[R - 1][C]) rough++; if (R < N - 1 && g[R + 1][C]) rough++; if (C > 0 && g[R][C - 1]) rough++; if (C < N - 1 && g[R][C + 1]) rough++;
  }
  return (rows.length + cols.length) * 100 + prog * 60 + empty * 2 - holes * 25 - rough * 3;
}
function botPlay(B0, rnd, d, cap, goals) {
  const B = cloneBoard(B0), scores = [];
  let score = 0, streak = 0, idle = 0, gems = 0, ice = 0, tray = dealTray(B.g, rnd, d), objAt = goals.gems || goals.ice ? Infinity : 0;
  for (let m = 1; m <= cap; m++) {
    let best = null;
    tray.forEach((p, i) => { if (p) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(B.g, p.cells, r, c)) { const v = evalMove(B, p, r, c); if (!best || v > best.v) best = { v, i, r, c }; } });
    if (!best) break; // bot is stuck: its score stays frozen
    const p = tray[best.i]; tray[best.i] = null;
    const res = applyMove(B, p.cells, p.color, best.r, best.c);
    [streak, idle] = nextStreak(streak, idle, res.n);
    score += p.cells.length + linePoints(res.n, streak); gems += res.gems; ice += res.ice;
    if (objAt === Infinity && gems >= goals.gems && ice >= goals.ice) objAt = m;
    scores.push(score);
    if (tray.every(t => !t)) tray = dealTray(B.g, rnd, d);
  }
  while (scores.length < cap) scores.push(score);
  return { scores, objAt };
}
const quant = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))]; };
const round10 = x => Math.max(10, Math.round(x / 10) * 10);
// moves and target come from bot runs: share w of runs must win (easy 85 % to boss 30 %)
// board shapes: true = cell is outside the board (VOID). Read N at call time.
const MASKS = {
  cross: (r, c) => { const k = Math.max(1, N >> 2); return (r < k || r >= N - k) && (c < k || c >= N - k); },
  corners: (r, c) => Math.min(r, N - 1 - r) + Math.min(c, N - 1 - c) < (N >= 8 ? 2 : 1),
  hole: (r, c) => { const s = N >= 9 ? (N & 1 ? 3 : 2) : (N & 1 ? 1 : 2), a = (N - s) >> 1; return r >= a && r < a + s && c >= a && c < a + s; },
  diamond: (r, c) => Math.abs(r - (N - 1) / 2) + Math.abs(c - (N - 1) / 2) > (N - 1) / 2 + 1.5,
};
// from world 2 on no board is the plain 8x8 square
function levelShape(n) {
  if (n <= TUTORIAL.length) return TUTORIAL[n - 1].shape || 'square';
  const opts = ['square', 'corners', 'hole', ...(N >= 7 ? ['cross', 'cross'] : []), ...(N >= 9 ? ['diamond'] : [])];
  const s = opts[mulberry32(n * 2203 + 17)() * opts.length | 0];
  return s === 'square' && N === 8 ? 'corners' : s;
}
// board size per level: tutorial as written, then from the seed (small = less room, big = longer lines)
const SIZES = [6, 7, 7, 8, 9, 9, 10];
const levelSize = n => n <= TUTORIAL.length ? TUTORIAL[n - 1].size || 8 : SIZES[mulberry32(n * 3571 + 5)() * SIZES.length | 0];
const makeLevel = (n, runs) => withSize(levelSize(n), () => ({ ...buildLevel(n, runs), size: N }));
// validation: the bot must beat the goal in at least half its runs, otherwise the layout is regenerated easier
function buildLevel(n, runs = 14) {
  const CAP = 45, d = levelDiff(n), pd = d * 0.6;
  let L, res, goals, share = 0, attempt = 0;
  for (; attempt < 7; attempt++) {
    L = levelLayout(n, attempt); goals = { gems: L.spec.gems, ice: L.spec.ice };
    const rnd = mulberry32(n * 31 + 7 + attempt);
    res = Array.from({ length: runs }, () => botPlay(L.B, rnd, pd, CAP, goals));
    share = res.filter(x => isFinite(x.objAt)).length / runs;
    if (share >= 0.5) break;
  }
  // harder since 18-11-2026: bot target 70 % easy → ~25 % boss, almost no spare moves
  const obj = goals.gems || goals.ice, w = Math.min(0.72 - d * 0.48, share - 0.01);
  let moves = obj ? quant(res.map(x => x.objAt), w) : 12 + Math.round(d * 6) + Math.min(8, n / 20 | 0);
  moves = Math.max(8, Math.min(CAP, Math.ceil((isFinite(moves) ? moves : CAP) * (1.05 - d * 0.08))));
  const atM = res.map(x => x.scores[moves - 1]);
  const target = obj ? Math.max(round10(quant(atM, 0.15)), round10(moves * 5)) : round10(quant(atM, 1 - w));
  return { n, d, moves, target, goals, B: L.B, spec: L.spec, stars: [target, round10(target * 1.35), round10(target * 1.75)], botWin: +w.toFixed(2), share: +share.toFixed(2), attempt: Math.min(attempt, 6) };
}

if (typeof module !== 'undefined') module.exports = { N, STONE, ICE, SHAPES, fits, fullLines, hitCell, applyMove, newBoard, makeLevel, levelLayout, isOpen, nextInRoute, routeOf };
