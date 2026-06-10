/**
 * MONTACUTI — Genera manifest finale immagini
 * Cataloga tutto ciò che è stato scaricato in src/content/progetti + src/assets
 * Output: scripts/images-manifest.final.json
 *
 * Use:
 *   node scripts/build-manifest.mjs
 */
import { readdir, stat, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function sha1(file) {
  const buf = await readFile(file);
  return createHash('sha1').update(buf).digest('hex').slice(0, 12);
}

const targets = {
  progetti: 'src/content/progetti',
  assets: 'src/assets',
};

const result = { generated_at: new Date().toISOString(), projects: {}, assets: [], totals: {} };
let totalFiles = 0;
let totalBytes = 0;

// === Progetti ===
for await (const file of walk(targets.progetti)) {
  if (!/\.(jpg|jpeg|png|webp|avif)$/i.test(file)) continue;
  const parts = file.replace(/\\/g, '/').split('/');
  const slug = parts[parts.indexOf('progetti') + 1];
  if (!slug) continue;
  const s = await stat(file);
  const hash = await sha1(file);
  result.projects[slug] = result.projects[slug] || { count: 0, totalKB: 0, files: [] };
  result.projects[slug].count++;
  result.projects[slug].totalKB += Math.round(s.size / 1024);
  result.projects[slug].files.push({
    name: basename(file),
    sizeKB: Math.round(s.size / 1024),
    sha1: hash,
  });
  totalFiles++;
  totalBytes += s.size;
}

// === Assets generici (home, studio) ===
for await (const file of walk(targets.assets)) {
  if (!/\.(jpg|jpeg|png|webp|avif)$/i.test(file)) continue;
  const s = await stat(file);
  const hash = await sha1(file);
  result.assets.push({
    path: file.replace(/\\/g, '/').replace('src/assets/', ''),
    sizeKB: Math.round(s.size / 1024),
    sha1: hash,
  });
  totalFiles++;
  totalBytes += s.size;
}

result.totals = {
  files: totalFiles,
  totalMB: +(totalBytes / 1024 / 1024).toFixed(1),
  projectsWithImages: Object.keys(result.projects).length,
};

await writeFile('scripts/images-manifest.final.json', JSON.stringify(result, null, 2));

// Console report
console.log('=== IMAGE MANIFEST ===');
console.log(`Generated: ${result.generated_at}`);
console.log(`Totale file: ${result.totals.files}`);
console.log(`Totale dim: ${result.totals.totalMB} MB`);
console.log(`Progetti con immagini: ${result.totals.projectsWithImages}\n`);

console.log('Per progetto:');
for (const [slug, data] of Object.entries(result.projects)) {
  console.log(`  ${slug.padEnd(38)} ${String(data.count).padStart(2)} file  ${String(data.totalKB).padStart(6)} KB`);
}
console.log('\nAsset generici (home + studio):');
result.assets.forEach((a) => console.log(`  ${a.path.padEnd(46)} ${String(a.sizeKB).padStart(6)} KB`));
console.log('\nManifest scritto in scripts/images-manifest.final.json');
