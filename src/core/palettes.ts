const presets = {
  monochrome: ['#000000', '#ffffff'],
  gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  cga: ['#000000', '#55ffff', '#ff55ff', '#ffffff'],
  pipboy: ['#000000', '#004400', '#008800', '#00ff00'],
  pipboyAmber: ['#000000', '#442200', '#884400', '#ffaa00'],
  cyberpunk: ['#000000', '#ff0055', '#00ffff', '#ffff00'],
  vaporwave: ['#2a0845', '#ff007f', '#00f0ff', '#fffb00'],
  macintosh: ['#000000', '#555555', '#aaaaaa', '#ffffff'],
  ega: [
    '#000000', '#0000aa', '#00aa00', '#00aaaa',
    '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
    '#555555', '#5555ff', '#55ff55', '#55ffff',
    '#ff5555', '#ff55ff', '#ffff55', '#ffffff'
  ],
  vga: [
    '#000000', '#0000a8', '#00a800', '#00a8a8',
    '#a80000', '#a800a8', '#a85400', '#a8a8a8',
    '#545454', '#5454fc', '#54fc54', '#54fcfc',
    '#fc5454', '#fc54fc', '#fcfc54', '#ffffff'
  ],
  nes: [
    '#7c7c7c', '#0000fc', '#0000bc', '#4428bc',
    '#940084', '#a80020', '#a81000', '#881400',
    '#503000', '#007800', '#006800', '#005800',
    '#004058', '#000000', '#ffffff', '#a8a8a8'
  ],
  gbc: [
    '#2c1e38', '#403d58', '#606c70', '#909c80',
    '#c2cca8', '#e2ecc8', '#181010', '#a86840',
    '#d89858', '#f8d080'
  ],
  c64: [
    '#000000', '#ffffff', '#68372b', '#70a4b2',
    '#6f3d86', '#588d43', '#352879', '#b8c5e2',
    '#9f5731', '#564d00', '#9a6759', '#444444',
    '#6c6c6c', '#9ad284', '#6c5eb5', '#959595'
  ],
  dracula: [
    '#282a36', '#44475a', '#f8f8f2', '#6272a4',
    '#8be9fd', '#50fa7b', '#ffb86c', '#ff79c6',
    '#bd93f9', '#ff5555', '#f1fa8c'
  ],
  nord: [
    '#2e3440', '#3b4252', '#434c5e', '#4c566a',
    '#d8dee9', '#e5e9f0', '#eceff4', '#8fbcbb',
    '#88c0d0', '#81a1c1', '#5e81ac', '#bf616a'
  ],
  gruvbox: [
    '#282828', '#cc241d', '#98971a', '#d79921',
    '#458588', '#b16286', '#689d6a', '#a89984',
    '#928374', '#fb4934', '#b8bb26', '#fabd2f'
  ],
  sunset: [
    '#1a0c2e', '#4b154a', '#7f1c5c', '#b52f5f',
    '#e65257', '#ff7f50', '#ffb347', '#ffe4b5'
  ],
  glitch: [
    '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#00ffff', '#ff00ff', '#ffffff'
  ]
};

export const PALETTE_PRESETS: Record<string, string[]> & typeof presets = presets;

export type PaletteName = keyof typeof presets;

export function resolvePalette(palette: string[] | PaletteName | undefined | null): string[] | null {
  if (!palette) return null;
  if (typeof palette === 'string') {
    return PALETTE_PRESETS[palette] || null;
  }
  return palette;
}
