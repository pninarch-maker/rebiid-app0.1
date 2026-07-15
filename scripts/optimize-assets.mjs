import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Compress branded image assets for smaller Android packages.
 * Requires: npm i -D sharp && node scripts/optimize-assets.mjs
 */
const root = path.resolve('assets/images');
const sourceCandidates = [
  path.join(root, 'icon.png'),
  path.join(root, 'rebiid-logo.webp'),
];
const source = sourceCandidates.find((candidate) => fs.existsSync(candidate));
if (!source) {
  throw new Error('No source brand image found under assets/images');
}

async function writePalettePng(src, dest, size, quality = 70) {
  const before = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
  const jpg = await sharp(src)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 247, g: 249, b: 252, alpha: 1 },
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  await sharp(jpg)
    .png({ palette: true, quality, compressionLevel: 9, effort: 10 })
    .toFile(dest);

  console.log(
    `${path.basename(dest)}: ${(before / 1024).toFixed(1)}KB -> ${(fs.statSync(dest).size / 1024).toFixed(1)}KB`,
  );
}

async function writeWebp(src, dest, size, quality = 85) {
  const before = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
  await sharp(src)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 247, g: 249, b: 252, alpha: 1 },
    })
    .webp({ quality, effort: 6 })
    .toFile(dest);
  console.log(
    `${path.basename(dest)}: ${(before / 1024).toFixed(1)}KB -> ${(fs.statSync(dest).size / 1024).toFixed(1)}KB`,
  );
}

await writePalettePng(source, path.join(root, 'icon.png'), 1024);
await writePalettePng(source, path.join(root, 'android-icon-foreground.png'), 1024);
await writePalettePng(source, path.join(root, 'splash-icon.png'), 512);
await writePalettePng(source, path.join(root, 'favicon.png'), 192, 65);
await writeWebp(source, path.join(root, 'rebiid-logo.webp'), 512, 85);

console.log('done');
