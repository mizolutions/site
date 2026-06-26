// Rasterizes the brand OG card (scripts/og-default.svg) to public/og/default.png
// at 1200x630, supersampled for crisp text. Run: node scripts/build-og.mjs
// Re-run whenever the SVG (branding) changes. Uses sharp (already a dep).
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(here, 'og-default.svg'));
const outDir = join(here, '..', 'public', 'og');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, 'default.png');

// density 144 → render the 1200x630 SVG at 2x, then downscale for antialiasing.
await sharp(svg, { density: 144 })
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toFile(out);

console.log('OG image written:', out);
