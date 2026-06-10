import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

/**
 * Output: static.
 * Adapter Netlify per le route con `export const prerender = false`
 * (es. /api/contact). Le pagine statiche restano nella CDN Netlify;
 * l'endpoint diventa una Netlify Function on-demand.
 */
export default defineConfig({
  site: 'https://studiomontacuti.it',
  output: 'static',
  adapter: netlify(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/api/'),
      i18n: {
        defaultLocale: 'it',
        locales: { it: 'it-IT' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    responsiveStyles: true,
  },
});
