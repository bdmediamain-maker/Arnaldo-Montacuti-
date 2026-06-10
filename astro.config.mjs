import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

/**
 * Output: static.
 * Adapter Node solo per route con `export const prerender = false` (es. /api/contact).
 * Quando si decide il target serverless (Vercel/Netlify) sostituire l'adapter.
 */
export default defineConfig({
  site: 'https://studiomontacuti.it',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
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
