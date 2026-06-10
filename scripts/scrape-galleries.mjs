/**
 * MONTACUTI — Scrape gallerie progetto dal sito Wix vecchio
 * Riferimento: montacuti-image-manifest.md (Script Step 2)
 *
 * Per ogni pagina progetto del vecchio archmontacuti.wixsite.com/montacuti:
 *  1. Apre con Playwright headless
 *  2. Scrolla in fondo per triggerare lazy-load delle gallerie Wix JS
 *  3. Estrae tutti gli URL di immagini servite da static.wixstatic.com (anche da bg-image inline)
 *  4. Converte gli URL in versione originale full-res (rimuove i path /v1/.../FILENAME)
 *  5. Scarica tutto verso src/content/progetti/[slug]/images/ con naming progressivo
 *  6. Salva un images-manifest.json per progetto con scraped_at + source + urls
 *
 * Use:
 *   node scripts/scrape-galleries.mjs
 */
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const projects = [
  { url: 'https://archmontacuti.wixsite.com/montacuti/project-1', slug: 'salaroli-cesena' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/project-2', slug: 'conad-ponte-abbadesse' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-nuovo-conad-ponte-abbadess', slug: 'riqualificazione-via-battisti' },
  { url: 'https://archmontacuti.wixsite.com/montacuti', slug: 'centro-sportivo-romagna-centro' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/project-4', slug: 'famila-gambettola' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-supermercato-alimentare-fa', slug: 'hera-pievesestina' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/project-5', slug: 'quartiere-cesuola' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/project-6', slug: 'ex-ristorante-gianni' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-ristrutturazione-ex-ristoran', slug: 'stabilimento-siderurgico' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-appartamenti-via-dell-amor', slug: 'case-finali-condominio-a' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-case-finali-condominio-1', slug: 'case-finali-condominio-l' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-case-finali-condominio', slug: 'case-finali-villette-f' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-case-finali-villette', slug: 'case-finali-villette-de' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-case-finali-villette-tipol', slug: 'case-finali-villette-m' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-case-finali-villette-tipol-1', slug: 'via-dismano-villa-b1' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-via-dismano-villa-unifamil', slug: 'via-dismano-villa-b2' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-via-dismano-villa-bifamili', slug: 'via-dismano-bifamiliari-a' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-ristrutturazione-ex-ristor', slug: 'via-natale-amore' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/parco-giardino', slug: 'parco-giardino-condomini' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/copia-di-parco-giardino', slug: 'parco-giardino-villette' },
  { url: 'https://archmontacuti.wixsite.com/montacuti/ristrutturazione-edificio-in-localita', slug: 'torre-del-moro' },
];

/** Pattern Wix: .../FILEID~mv2(_d_W_H_s_X)?.jpg/v1/.../FILENAME.jpg → .../FILEID....jpg */
function toOriginalUrl(url) {
  return url.replace(/\.(jpg|jpeg|png|webp|avif)\/v1\/[^?#]+/i, '.$1');
}

function fileIdFromUrl(url) {
  const m = url.match(/4b6b13_([a-f0-9]+)/i);
  return m ? m[1].slice(0, 12) : 'unknown';
}

async function scrapeProject(browser, project, index, total) {
  console.log(`\n[${index + 1}/${total}] ${project.slug}`);
  console.log(`  → ${project.url}`);

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    locale: 'it-IT',
  });
  const page = await context.newPage();

  let downloaded = 0;
  let skipped = 0;
  const errors = [];
  let scrapedUrls = [];

  try {
    // Wix non raggiunge mai networkidle (analytics polling). Usiamo domcontentloaded
    // + wait esplicito + scroll progressivo per attivare il lazy-load.
    await page.goto(project.url, { waitUntil: 'domcontentloaded', timeout: 90000 });

    // Attendi che il main runtime Wix renderizzi il viewport iniziale
    await page.waitForTimeout(3500);

    // Auto-scroll progressivo per innescare il lazy load Wix (3 passate per sicurezza)
    for (let pass = 0; pass < 3; pass++) {
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 400;
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            if (totalHeight >= document.body.scrollHeight + 1000) {
              clearInterval(timer);
              resolve();
            }
          }, 120);
        });
      });
      await page.waitForTimeout(1500);
    }

    // Torna in cima e attendi un'ultima volta per assicurarsi che gli IMG sopra siano risolti
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(2000);

    // Estrai URL immagini Wix dallo studio (file id 4b6b13_)
    const imageUrls = await page.evaluate(() => {
      const urls = new Set();
      const collect = (s) => {
        if (s && s.includes('static.wixstatic.com')) {
          s.split(',').forEach((item) => {
            const url = item.trim().split(' ')[0];
            if (url) urls.add(url);
          });
        }
      };
      document.querySelectorAll('img').forEach((el) => {
        collect(el.getAttribute('src'));
        collect(el.getAttribute('srcset'));
        collect(el.getAttribute('data-src'));
      });
      document.querySelectorAll('source').forEach((el) => {
        collect(el.getAttribute('src'));
        collect(el.getAttribute('srcset'));
      });
      document.querySelectorAll('*').forEach((el) => {
        const bg = el.style && el.style.backgroundImage;
        if (bg && bg.includes('static.wixstatic.com')) {
          const m = bg.match(/url\(["']?(https:\/\/static\.wixstatic\.com[^"')]+)["']?\)/);
          if (m) urls.add(m[1]);
        }
      });
      return Array.from(urls);
    });

    const originals = [...new Set(imageUrls.map(toOriginalUrl))];
    const studioImgs = originals.filter((u) => u.includes('4b6b13_'));
    // Escludi file ID 1px tracker / icone Wix interne (es. avatar generico)
    const filtered = studioImgs.filter((u) => !/wix_logo|favicon/i.test(u));

    scrapedUrls = filtered;
    console.log(`  Trovate ${filtered.length} immagini uniche (studio)`);

    // Download progressivo. NOTA: il file 01-hero.jpg esiste già (da download-heroes.mjs),
    // quindi numeriamo da 02 e marchiamo l'hero come "skip" se è già presente nella lista
    // (verrebbe semplicemente sovrascritto con la stessa risorsa)
    let i = 2;
    for (const url of filtered) {
      const fileId = fileIdFromUrl(url);
      const ext = (url.match(/\.(jpg|jpeg|png|webp|avif)/i)?.[1] || 'jpg').toLowerCase();
      const name = `${String(i).padStart(2, '0')}-${fileId}.${ext}`;
      const dest = `src/content/progetti/${project.slug}/images/${name}`;

      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            Accept: 'image/*,*/*',
            Referer: 'https://archmontacuti.wixsite.com/',
          },
        });
        if (!res.ok) {
          console.log(`  ✗ ${name} — HTTP ${res.status}`);
          errors.push({ url, status: res.status });
          i++;
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        // Skip immagini troppo piccole (probabili tracker/icone < 5KB)
        if (buf.length < 5 * 1024) {
          skipped++;
          i++;
          continue;
        }
        await mkdir(dirname(dest), { recursive: true });
        await writeFile(dest, buf);
        console.log(`  ✓ ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
        downloaded++;
        i++;
        await new Promise((r) => setTimeout(r, 150));
      } catch (err) {
        console.log(`  ✗ ${name} — ${err.message}`);
        errors.push({ url, error: err.message });
        i++;
      }
    }

    // Manifest per progetto (timestamp passato come arg perché Date.now() ok in CLI script)
    await writeFile(
      `src/content/progetti/${project.slug}/images-manifest.json`,
      JSON.stringify(
        {
          scraped_at: new Date().toISOString(),
          source: project.url,
          slug: project.slug,
          urls: filtered,
          downloaded,
          skipped,
          errors,
        },
        null,
        2,
      ),
    );
  } catch (err) {
    console.error(`  ✗ Errore scraping ${project.slug}: ${err.message}`);
    errors.push({ stage: 'navigation', error: err.message });
  } finally {
    await page.close();
    await context.close();
  }

  return { slug: project.slug, downloaded, skipped, errors: errors.length, totalUrls: scrapedUrls.length };
}

const browser = await chromium.launch({ headless: true });
console.log(`Avvio scraping di ${projects.length} pagine progetto...`);

const results = [];
for (let i = 0; i < projects.length; i++) {
  const r = await scrapeProject(browser, projects[i], i, projects.length);
  results.push(r);
}

await browser.close();

console.log('\n=== REPORT ===');
results.forEach((r) => {
  const tag = r.errors > 0 ? '⚠' : '✓';
  console.log(`${tag} ${r.slug.padEnd(38)} found=${r.totalUrls}  dl=${r.downloaded}  skip=${r.skipped}  err=${r.errors}`);
});

const totalDl = results.reduce((s, r) => s + r.downloaded, 0);
const totalErr = results.reduce((s, r) => s + r.errors, 0);
console.log(`\nTotale immagini scaricate: ${totalDl}`);
console.log(`Totale errori: ${totalErr}`);

await writeFile(
  'scripts/scrape-galleries-report.json',
  JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2),
);
console.log('\nReport completo: scripts/scrape-galleries-report.json');
