'use strict';
// Prisma Pop art & story: original characters (Prismi the gem, Grisón the grey cloud), worlds and dialog lines. Pure strings, no game logic.

const INK = '#1d0f4a';
function prismiSVG(mood = 'happy', size = 80) {
  const eyes = {
    happy: `<ellipse cx="38" cy="52" rx="6.5" ry="8.5" fill="${INK}"/><ellipse cx="62" cy="52" rx="6.5" ry="8.5" fill="${INK}"/><circle cx="40.5" cy="48.5" r="2.6" fill="#fff"/><circle cx="64.5" cy="48.5" r="2.6" fill="#fff"/>`,
    wow: `<circle cx="38" cy="50" r="9.5" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="62" cy="50" r="9.5" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="38" cy="51" r="5.5" fill="${INK}"/><circle cx="62" cy="51" r="5.5" fill="${INK}"/><circle cx="40" cy="48.5" r="2" fill="#fff"/><circle cx="64" cy="48.5" r="2" fill="#fff"/>`,
    sad: `<path d="M31 50 q7 6 14 0 M55 50 q7 6 14 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="33" cy="61" rx="2.6" ry="4.2" fill="#7fd8ff"/>`,
    worried: `<ellipse cx="38" cy="53" rx="6" ry="7.5" fill="${INK}"/><ellipse cx="62" cy="53" rx="6" ry="7.5" fill="${INK}"/><circle cx="40" cy="50" r="2.2" fill="#fff"/><circle cx="64" cy="50" r="2.2" fill="#fff"/><path d="M30 42 L44 37 M70 42 L56 37" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  }[mood];
  const mouth = {
    happy: `<path d="M40 65 q10 11 20 0 z" fill="#ff5c8a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    wow: `<ellipse cx="50" cy="70" rx="6" ry="7.5" fill="${INK}"/><ellipse cx="50" cy="73" rx="3.5" ry="2.5" fill="#ff5c8a"/>`,
    sad: `<path d="M41 74 q9 -8 18 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    worried: `<path d="M40 71 q5 -4 10 0 t10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  }[mood];
  const up = mood === 'wow' || mood === 'happy';
  const arms = up ? 'M20 58 q-14 -6 -10 -22 M80 58 q14 -6 10 -22' : 'M20 66 q-12 6 -10 18 M80 66 q12 6 10 18';
  return `<svg viewBox="0 0 100 112" width="${size}" height="${Math.round(size * 1.12)}" aria-hidden="true">
<defs><linearGradient id="pgb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9becff"/><stop offset=".5" stop-color="#8a5cff"/><stop offset="1" stop-color="#ff4fd8"/></linearGradient></defs>
<ellipse cx="50" cy="106" rx="24" ry="4.5" fill="rgba(0,0,0,.28)"/>
<path d="${arms}" stroke="#6a3cf0" stroke-width="7" fill="none" stroke-linecap="round"/>
<ellipse cx="38" cy="100" rx="8.5" ry="5" fill="#4417bd"/><ellipse cx="62" cy="100" rx="8.5" ry="5" fill="#4417bd"/>
<path d="M50 8 L84 30 L80 80 L50 98 L20 80 L16 30 Z" fill="url(#pgb)" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M50 8 L64 30 L36 30 Z" fill="#fff" opacity=".5"/><path d="M16 30 L36 30 L20 80 Z" fill="#fff" opacity=".14"/><path d="M84 30 L64 30 L80 80 Z" fill="#000" opacity=".12"/>
${eyes}<ellipse cx="28" cy="64" rx="6" ry="3.5" fill="#ff7ab8" opacity=".75"/><ellipse cx="72" cy="64" rx="6" ry="3.5" fill="#ff7ab8" opacity=".75"/>${mouth}
<path d="M84 10 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff"/>
</svg>`;
}
function grisonSVG(mood = 'angry', size = 110) {
  const face = mood === 'defeated'
    ? `<path d="M44 52 l10 10 M54 52 l-10 10 M66 52 l10 10 M76 52 l-10 10" stroke="#1a1c22" stroke-width="4" stroke-linecap="round"/><path d="M46 78 q6 -5 12 0 t12 0 t12 0" stroke="#1a1c22" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<path d="M40 44 l16 7 M84 44 l-16 7" stroke="#1a1c22" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="58" r="6" fill="#ffdf5c"/><circle cx="70" cy="58" r="6" fill="#ffdf5c"/><circle cx="51" cy="59" r="3" fill="#1a1c22"/><circle cx="69" cy="59" r="3" fill="#1a1c22"/><path d="M46 80 q14 -10 28 0" stroke="#1a1c22" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M52 77 l3 4 3 -5" fill="#fff"/>`;
  return `<svg viewBox="0 0 120 104" width="${size}" height="${Math.round(size * 0.87)}" aria-hidden="true">
<ellipse cx="60" cy="99" rx="34" ry="5" fill="rgba(0,0,0,.3)"/>
<path d="M28 90 q-24 0 -22 -22 q2 -18 22 -17 q4 -26 30 -26 q24 0 30 22 q22 -2 24 20 q2 23 -22 23 Z" fill="#6b7080" stroke="#2b2e38" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M40 38 q10 -10 22 -6" stroke="#9aa0ad" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
<path d="M46 27 l4 -15 8 10 7 -13 7 13 8 -10 3 15 z" fill="#9aa0ad" stroke="#2b2e38" stroke-width="3" stroke-linejoin="round"/>
${face}
<path d="M104 64 l-7 12 h7 l-5 12" stroke="#ffdf5c" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;
}

// one world every 10 levels; after the last one they come back as "II", "III"...
const WORLDS = [
  { name: 'Bosque Cristal', hue: 150, bg: ['#11604c', '#062a24'], deco: ['🌲', '💎', '🍄', '🌿', '🦋'], line: '¡Los árboles de cristal están perdiendo su brillo! Hay que darse prisa.' },
  { name: 'Cuevas Heladas', hue: 200, bg: ['#1d568f', '#0a1f3d'], deco: ['❄️', '🧊', '⛄', '✨', '🐧'], line: 'Brrr… Grisón ha congelado las cuevas. ¡Rompe todo el hielo!' },
  { name: 'Volcán Rubí', hue: 8, bg: ['#7d1f2e', '#2e0710'], deco: ['🌋', '🔥', '🪨', '💥', '🦎'], line: 'Aquí hace mucho calor… y hay piedras por todas partes. ¡Cuidado!' },
  { name: 'Nubes Prisma', hue: 285, bg: ['#5e2c90', '#22103d'], deco: ['☁️', '🌈', '⭐', '🪁', '🎈'], line: '¡Estamos en las nubes! Grisón quiere apagar el arcoíris.' },
  { name: 'Océano Zafiro', hue: 215, bg: ['#11507e', '#041a33'], deco: ['🐚', '🐠', '🌊', '🐙', '🐳'], line: 'Las perlas del océano se han vuelto grises. ¡Vamos a recuperarlas!' },
  { name: 'Desierto Ámbar', hue: 38, bg: ['#8d5c14', '#331f04'], deco: ['🌵', '☀️', '🏜️', '🦂', '🐪'], line: 'Arena por todas partes… pero las gemas brillan más que nunca.' },
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
