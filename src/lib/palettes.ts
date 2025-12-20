/**
 * Color palettes for the visual generators
 */

// 16-color palette inspired by classic pixel art
export const PIXEL_PALETTE_16 = [
  '#0d0d0d', // black
  '#1a1a2e', // dark blue
  '#16213e', // navy
  '#533483', // purple
  '#e94560', // red
  '#ff6b6b', // coral
  '#feca57', // yellow
  '#48dbfb', // cyan
  '#1dd1a1', // green
  '#10ac84', // teal
  '#222f3e', // dark gray
  '#576574', // gray
  '#8395a7', // light gray
  '#c8d6e5', // silver
  '#ffffff', // white
  '#ff9f43', // orange
];

// 64-color extended palette for geometric compositions
export const GEO_PALETTE_64 = [
  // Blacks & Grays
  '#0a0a0f', '#141420', '#1e1e2e', '#28283d',
  '#32324c', '#3c3c5b', '#46466a', '#505079',
  // Blues
  '#1a1a4e', '#2d2d7a', '#4040a6', '#5353d2',
  '#6666ff', '#8080ff', '#9999ff', '#b3b3ff',
  // Purples
  '#4a1a6b', '#6b2d8a', '#8c40a9', '#ad53c8',
  '#ce66e7', '#df80ef', '#f099f7', '#ffb3ff',
  // Reds & Pinks
  '#6b1a1a', '#8a2d2d', '#a94040', '#c85353',
  '#e76666', '#ef8080', '#f79999', '#ffb3b3',
  // Oranges
  '#6b3a1a', '#8a522d', '#a96a40', '#c88253',
  '#e79a66', '#efb280', '#f7ca99', '#ffe2b3',
  // Yellows
  '#6b6b1a', '#8a8a2d', '#a9a940', '#c8c853',
  '#e7e766', '#efef80', '#f7f799', '#ffffb3',
  // Greens
  '#1a6b3a', '#2d8a52', '#40a96a', '#53c882',
  '#66e79a', '#80efb2', '#99f7ca', '#b3ffe2',
  // Cyans
  '#1a6b6b', '#2d8a8a', '#40a9a9', '#53c8c8',
  '#66e7e7', '#80efef', '#99f7f7', '#b3ffff',
];

// Tile pattern colors - high contrast
export const TILE_PALETTE_16 = [
  '#0f0f1a', // void black
  '#1a1a2e', // deep navy
  '#2d3a4a', // slate
  '#4a5568', // gray
  '#718096', // silver
  '#e2e8f0', // light
  '#ffffff', // white
  '#ff6b35', // orange
  '#ff3366', // pink
  '#7c5cff', // purple
  '#00d4aa', // teal
  '#00aaff', // blue
  '#ffcc00', // gold
  '#ff0066', // magenta
  '#00ff88', // lime
  '#ff8800', // amber
];

// Curve colors - vibrant
export const CURVE_PALETTE_32 = [
  '#ff0055', '#ff0088', '#ff00bb', '#ff00ee',
  '#cc00ff', '#9900ff', '#6600ff', '#3300ff',
  '#0033ff', '#0066ff', '#0099ff', '#00ccff',
  '#00ffee', '#00ffbb', '#00ff88', '#00ff55',
  '#33ff00', '#66ff00', '#99ff00', '#ccff00',
  '#ffee00', '#ffbb00', '#ff8800', '#ff5500',
  '#ffffff', '#cccccc', '#999999', '#666666',
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3',
];

// Background gradients
export const GRADIENTS = {
  void: ['#0a0a0f', '#12121a'],
  abyss: ['#0a0a0f', '#1a1a2e', '#0a0a0f'],
  sunset: ['#1a1a2e', '#4a1a6b', '#8a2d2d'],
  ocean: ['#0a0a0f', '#1a1a4e', '#1a6b6b'],
  forest: ['#0a0a0f', '#1a4a2a', '#1a6b3a'],
  cosmic: ['#0a0a0f', '#2d2d7a', '#4a1a6b'],
};

/**
 * Get a color from a palette by index
 */
export function getPaletteColor(palette: string[], index: number): string {
  return palette[index % palette.length];
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Interpolate between two colors
 */
export function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

