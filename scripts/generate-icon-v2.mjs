/**
 * Generate v2 launcher icons with ~25% transparent safe zone on every side.
 * Does not modify the original brand source asset.
 *
 * Run: node scripts/generate-icon-v2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('assets/images');
const source = path.join(root, 'brand', 'rebiid-logo-source.png');

if (!fs.existsSync(source)) {
  throw new Error(`Missing source asset: ${source}`);
}

const canvasSize = 1024;
/** Mascot occupies ~50% of canvas — 25% margin each side. */
const mascotSize = Math.round(canvasSize * 0.5);

async function writeIcon(dest, background) {
  const resized = await sharp(source)
    .resize(mascotSize, mascotSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(dest);

  console.log(`wrote ${path.basename(dest)} (${(fs.statSync(dest).size / 1024).toFixed(1)}KB)`);
}

await writeIcon(path.join(root, 'icon-v2.png'), { r: 255, g: 255, b: 255, alpha: 1 });
await writeIcon(path.join(root, 'android-icon-foreground-v2.png'), {
  r: 0,
  g: 0,
  b: 0,
  alpha: 0,
});

console.log('icon v2 generation complete');
