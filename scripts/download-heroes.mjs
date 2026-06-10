/**
 * MONTACUTI — Download hero images
 * Riferimento: montacuti-image-manifest.md (sezione Script — Step 1)
 *
 * Scarica le 25 hero uniche identificate dal manifest verso:
 *  - src/assets/home/        (3 immagini: home hero, contact, ritratto)
 *  - src/assets/studio/      (1 immagine: portrait verticale)
 *  - src/content/progetti/[slug]/images/01-hero.jpg (21 immagini progetto)
 *
 * Use:
 *   node scripts/download-heroes.mjs
 *
 * Se il CDN Wix risponde 403/404 con il primo UA, ritenta con UA browser-like.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const images = [
  // === STUDIO / HOME ===
  { url: 'https://static.wixstatic.com/media/4b6b13_87e95a2cbcd741399084ee3ea1a5ef9e~mv2_d_5184_3456_s_4_2.jpg', dest: 'src/assets/home/home-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_6bc86e7c99fe4e4e8e0c958f3f79a164~mv2.jpg', dest: 'src/assets/home/contact-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_7aef65941c0c49cda1930d000ae1fcf3~mv2.jpg', dest: 'src/assets/studio/arnaldo-portrait.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_b15916a00e554fb59f23ff64ddab97d6~mv2_d_3456_5184_s_4_2.jpg', dest: 'src/assets/studio/portrait-vertical.jpg' },

  // === COMMERCIALE E TERZIARIO ===
  { url: 'https://static.wixstatic.com/media/4b6b13_feffdd38d9bf406596a0af116504a6d9~mv2_d_4962_3456_s_4_2.jpg', dest: 'src/content/progetti/salaroli-cesena/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_29ddbbfddf304144988930c7bb4da911~mv2_d_3528_2220_s_2.jpg', dest: 'src/content/progetti/conad-ponte-abbadesse/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_aad19b9f0cbc46098bec450a8b42d6e1~mv2_d_3508_2480_s_4_2.jpg', dest: 'src/content/progetti/riqualificazione-via-battisti/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_8e1fa5fd15d14ef88b8488d0560413dc~mv2.jpg', dest: 'src/content/progetti/centro-sportivo-romagna-centro/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_bf7e38e69e0c455aa4c2735354d833f6~mv2_d_4195_1843_s_2.jpg', dest: 'src/content/progetti/famila-gambettola/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_a25ec59168ce46439f437776dad72487~mv2.jpg', dest: 'src/content/progetti/hera-pievesestina/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_744d93aa05e741408c3181529f1f2951~mv2.jpg', dest: 'src/content/progetti/quartiere-cesuola/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_66d0ad02e92b43789236d743fd733a84~mv2_d_3543_2362_s_2.jpg', dest: 'src/content/progetti/ex-ristorante-gianni/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_b1ae2c1e730442729ea6cbe2ee45d6fc~mv2.jpg', dest: 'src/content/progetti/stabilimento-siderurgico/images/01-hero.jpg' },

  // === RESIDENZIALE ===
  { url: 'https://static.wixstatic.com/media/4b6b13_282caf20d8af48b2adfb5d5e7be639bd~mv2.jpg', dest: 'src/content/progetti/case-finali-condominio-a/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_597686f59e4e4b45878834549537a2ce~mv2_d_2500_1200_s_2.jpg', dest: 'src/content/progetti/case-finali-condominio-l/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_be5eb42836d54ccaa309edaa24da360c~mv2_d_3309_2339_s_2.jpg', dest: 'src/content/progetti/case-finali-villette-f/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_fcbc198e0c1f4aa58138e5d900c47446~mv2_d_3309_2339_s_2.jpg', dest: 'src/content/progetti/case-finali-villette-de/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_d05b24f6839446a98a16b37c9c633e4b~mv2_d_3307_1579_s_2.jpg', dest: 'src/content/progetti/case-finali-villette-m/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_35d11942b12648098a56ea18358c4668~mv2.jpg', dest: 'src/content/progetti/via-dismano-villa-b1/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_2faa811e52ce4677842b32c1557c7c23~mv2.jpg', dest: 'src/content/progetti/via-dismano-villa-b2/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_b0b48602b57649a89167ce0940d28e1f~mv2_d_2700_1200_s_2.jpg', dest: 'src/content/progetti/via-dismano-bifamiliari-a/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_932d1fee6e2f4bb094e95d0b7dce0a66~mv2_d_4208_1961_s_2.jpg', dest: 'src/content/progetti/via-natale-amore/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_5edaa9f00afa4d2986f5fac84d8965e4~mv2_d_2700_1200_s_2.jpg', dest: 'src/content/progetti/parco-giardino-condomini/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_ff4cda450ed34cd6a78934d7ab334f2c~mv2.jpg', dest: 'src/content/progetti/parco-giardino-villette/images/01-hero.jpg' },
  { url: 'https://static.wixstatic.com/media/4b6b13_2e9545a9b8cc4d36af25bf3108fcde78~mv2.jpg', dest: 'src/content/progetti/torre-del-moro/images/01-hero.jpg' },
];

const UA_SIMPLE = 'Mozilla/5.0 (compatible; MontacutiMigration/1.0)';
const UA_BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

async function fetchWithRetry(url) {
  // First try: minimal UA
  let res = await fetch(url, {
    headers: { 'User-Agent': UA_SIMPLE, Accept: 'image/*,*/*' },
  });
  if (res.ok) return { res, retry: false };

  // Retry: browser-like
  res = await fetch(url, {
    headers: {
      'User-Agent': UA_BROWSER,
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
      Referer: 'https://archmontacuti.wixsite.com/',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
    },
  });
  return { res, retry: true };
}

console.log(`Scarico ${images.length} immagini hero dal CDN Wix...\n`);

let success = 0;
let failed = 0;
const failures = [];

for (const { url, dest } of images) {
  try {
    const { res, retry } = await fetchWithRetry(url);
    if (!res.ok) {
      console.error(`✗ ${dest} — HTTP ${res.status} ${retry ? '(retry browser-UA)' : ''}`);
      failures.push({ url, dest, status: res.status });
      failed++;
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    const marker = retry ? ' [retry]' : '';
    console.log(`✓ ${dest} (${(buf.length / 1024).toFixed(0)} KB)${marker}`);
    success++;
    await new Promise((r) => setTimeout(r, 200));
  } catch (err) {
    console.error(`✗ ${dest} — ${err.message}`);
    failures.push({ url, dest, error: err.message });
    failed++;
  }
}

console.log(`\nFatto: ${success} OK, ${failed} falliti`);

if (failures.length > 0) {
  await writeFile(
    'scripts/download-heroes-failures.json',
    JSON.stringify(failures, null, 2),
  );
  console.log(`\nDettagli fallimenti scritti in scripts/download-heroes-failures.json`);
  process.exit(1);
}
