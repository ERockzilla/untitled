/**
 * Combinatorics calculations for each library
 * Helps explain the relationship between address space and visual space
 */

export interface SpaceInfo {
  addressBits: number;
  addressSpace: string; // Human readable
  visualSpace: string; // Human readable
  visualFormula: string;
  relationship: 'exceeds' | 'bounded' | 'equal';
  explanation: string;
}

/**
 * Format large numbers for display
 */
function formatBigNumber(exponent: number): string {
  if (exponent < 10) {
    return Math.pow(10, exponent).toLocaleString();
  }
  return `10^${exponent}`;
}

/**
 * Calculate log10 of base^exponent
 */
function log10Power(base: number, exponent: number): number {
  return exponent * Math.log10(base);
}

/**
 * Address space info (same for all libraries)
 */
export const ADDRESS_SPACE = {
  bits: 256,
  hexChars: 64,
  approximate: '10^77',
  exact: '2^256',
};

/**
 * Pixel Canvas combinatorics
 */
export function getPixelSpaceInfo(gridSize: number, colors: number): SpaceInfo {
  const totalPixels = gridSize * gridSize;
  const visualExponent = Math.round(log10Power(colors, totalPixels));
  
  return {
    addressBits: 256,
    addressSpace: ADDRESS_SPACE.approximate,
    visualSpace: formatBigNumber(visualExponent),
    visualFormula: `${colors}^${totalPixels}`,
    relationship: visualExponent > 77 ? 'exceeds' : 'bounded',
    explanation: visualExponent > 77 
      ? `Only ~10^77 of ${formatBigNumber(visualExponent)} possible images are addressable`
      : `All ${formatBigNumber(visualExponent)} possible images have unique addresses`,
  };
}

/**
 * Geometric composition combinatorics
 */
export function getGeometricSpaceInfo(
  shapeTypes: number,
  colorCount: number,
  minShapes: number,
  maxShapes: number
): SpaceInfo {
  // Continuous parameters mean effectively infinite visual space
  // but bounded by address precision
  return {
    addressBits: 256,
    addressSpace: ADDRESS_SPACE.approximate,
    visualSpace: '~10^77',
    visualFormula: `${minShapes}-${maxShapes} shapes × ${shapeTypes} types × ${colorCount} colors`,
    relationship: 'bounded',
    explanation: 'Continuous parameters create ~10^77 unique compositions from addresses',
  };
}

/**
 * Voxel space combinatorics
 */
export function getVoxelSpaceInfo(gridSize: number, colorCount: number): SpaceInfo {
  const totalVoxels = gridSize * gridSize * gridSize;
  const states = colorCount + 1; // +1 for empty
  const visualExponent = Math.round(log10Power(states, totalVoxels));
  
  return {
    addressBits: 256,
    addressSpace: ADDRESS_SPACE.approximate,
    visualSpace: formatBigNumber(visualExponent),
    visualFormula: `${states}^${totalVoxels} (${states} states × ${totalVoxels} voxels)`,
    relationship: visualExponent > 77 ? 'exceeds' : 'bounded',
    explanation: visualExponent > 77
      ? `Only ~10^77 of ${formatBigNumber(visualExponent)} possible sculptures are addressable`
      : `All ${formatBigNumber(visualExponent)} possible sculptures have unique addresses`,
  };
}

/**
 * Parametric curves combinatorics
 */
export function getCurveSpaceInfo(colorCount: number): SpaceInfo {
  return {
    addressBits: 256,
    addressSpace: ADDRESS_SPACE.approximate,
    visualSpace: '~10^77',
    visualFormula: `2-5 curves × 4 control points × ${colorCount} colors × continuous params`,
    relationship: 'bounded',
    explanation: 'Bezier control points use continuous coordinates, bounded by address space',
  };
}

/**
 * Tile pattern combinatorics
 */
export function getTileSpaceInfo(
  gridSize: number,
  tileTypes: number,
  rotations: number,
  colors: number,
  symmetry: 'none' | 'horizontal' | 'vertical' | 'quad'
): SpaceInfo {
  // Each tile has: type × rotation × primary color × secondary color
  const statesPerTile = tileTypes * rotations * colors * colors;
  
  // Effective tiles based on symmetry
  let effectiveTiles: number;
  switch (symmetry) {
    case 'quad':
      effectiveTiles = Math.ceil(gridSize / 2) * Math.ceil(gridSize / 2);
      break;
    case 'horizontal':
    case 'vertical':
      effectiveTiles = Math.ceil(gridSize / 2) * gridSize;
      break;
    default:
      effectiveTiles = gridSize * gridSize;
  }
  
  const visualExponent = Math.round(log10Power(statesPerTile, effectiveTiles));
  
  return {
    addressBits: 256,
    addressSpace: ADDRESS_SPACE.approximate,
    visualSpace: formatBigNumber(visualExponent),
    visualFormula: `${statesPerTile.toLocaleString()}^${effectiveTiles} (${effectiveTiles} effective tiles)`,
    relationship: visualExponent > 77 ? 'exceeds' : 'bounded',
    explanation: symmetry !== 'none'
      ? `${symmetry} symmetry reduces to ${effectiveTiles} unique tiles`
      : `${effectiveTiles} independent tiles with ${statesPerTile.toLocaleString()} states each`,
  };
}

/**
 * LED Matrix combinatorics
 */
export function getLEDSpaceInfo(
  width: number,
  height: number,
  colors: number,
  isTextMode: boolean
): SpaceInfo {
  if (isTextMode) {
    return {
      addressBits: 256,
      addressSpace: ADDRESS_SPACE.approximate,
      visualSpace: 'Text-defined',
      visualFormula: `User text × ${colors} colors`,
      relationship: 'bounded',
      explanation: 'Text mode renders user input, not address-generated patterns',
    };
  }
  
  const totalLEDs = width * height;
  // Each LED: on/off × color selection ≈ colors + 1 states (off + each color)
  const states = colors + 1;
  const visualExponent = Math.round(log10Power(states, totalLEDs));
  
  return {
    addressBits: 256,
    addressSpace: ADDRESS_SPACE.approximate,
    visualSpace: formatBigNumber(visualExponent),
    visualFormula: `${states}^${totalLEDs} (${totalLEDs} LEDs × ${states} states)`,
    relationship: visualExponent > 77 ? 'exceeds' : 'bounded',
    explanation: visualExponent > 77
      ? `Only ~10^77 of ${formatBigNumber(visualExponent)} patterns are addressable`
      : `All ${formatBigNumber(visualExponent)} patterns have unique addresses`,
  };
}

