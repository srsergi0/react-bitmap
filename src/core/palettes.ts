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
