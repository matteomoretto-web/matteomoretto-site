// Builds the site into dist/: copies pages, fonts and content,
// and makes web-sized copies of every photo in img/ (originals are not published).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const WIDTHS = [900, 1600, 2400];
const PHOTO = /\.(jpe?g|png|webp|tiff?)$/i;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const f of ['index.html', '_redirects', '_headers']) {
  if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
}
for (const d of ['fonts', 'content']) {
  if (fs.existsSync(path.join(ROOT, d))) fs.cpSync(path.join(ROOT, d), path.join(OUT, d), { recursive: true });
}

(async () => {
  const dir = path.join(ROOT, 'img');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => PHOTO.test(f)) : [];
  let ok = 0;
  for (const f of files) {
    const base = f.replace(/\.[^.]+$/, '');
    try {
      for (const w of WIDTHS) {
        const out = path.join(OUT, 'r', String(w));
        fs.mkdirSync(out, { recursive: true });
        await sharp(path.join(dir, f), { failOn: 'none' })
          .rotate()
          .resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82, progressive: true, mozjpeg: true })
          .toFile(path.join(out, base + '.jpg'));
      }
      ok++;
    } catch (e) {
      console.warn('Skipped ' + f + ': ' + e.message);
    }
  }
  console.log(`Built ${ok}/${files.length} photos into dist/`);
})();
