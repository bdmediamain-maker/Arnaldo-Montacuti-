/**
 * MONTACUTI — Content Collections (Astro 5 Content Layer API)
 *
 * Una sola collection: `progetti`
 * Schema esteso da montacuti-ui-patterns.md §6 per supportare:
 *   - metadata block strutturato (Pattern 5)
 *   - specs numerate 01/N (Pattern 8)
 *   - pullquote large + attribution (Pattern 7)
 *   - location lat/lng + POI opzionali (Pattern 9)
 *   - featured row (Pattern 2)
 *
 * Fonte hero/images: src/content/progetti/[slug]/images/
 * Body: index.md (Markdown con immagini interleaved — Pattern 6)
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const progetti = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/progetti' }),
  schema: ({ image }) =>
    z.object({
      // ===== Identità =====
      titolo: z.string(),
      sottotitolo: z.string().optional(),

      // ===== Categorizzazione =====
      categoria: z.enum([
        'commerciale-terziario',
        'residenziale',
        'riqualificazione-urbana',
        'industriale',
      ]),
      tags: z.array(z.string()).optional(),

      // ===== Stato & tempo =====
      stato: z.enum(['realizzato', 'in-corso', 'concept']),
      /** Anno completamento o range come stringa (es. "2022–2024") */
      anno: z.union([z.number(), z.string()]),

      // ===== Metadata strutturato (Pattern 5) =====
      meta: z.object({
        tipologia: z.string().optional(),
        localizzazione: z.string(),
        superficie: z.string().optional(),
        committente: z.string().optional(),
        progetto_architettonico: z.string().optional(),
        direzione_lavori: z.string().optional(),
        strutture: z.string().optional(),
        impianti: z.string().optional(),
        impresa: z.string().optional(),
        tema_progettuale: z.string().optional(),
      }),

      // ===== Immagini =====
      hero: image(),
      /** Crop verticale opzionale (4:5) per mobile hero */
      hero_mobile: image().optional(),

      // ===== Specs numerate (Pattern 8) =====
      specs: z
        .array(
          z.object({
            label: z.string(),
            content: z.string(),
          }),
        )
        .optional(),

      // ===== Pullquote (Pattern 7) =====
      pullquote: z
        .object({
          text: z.string(),
          author: z.string(),
          role: z.string().optional(),
        })
        .optional(),

      // ===== Location (Pattern 9) =====
      location: z
        .object({
          lat: z.number(),
          lng: z.number(),
          poi: z
            .array(
              z.object({
                name: z.string(),
                category: z.string().optional(),
                description: z.string().optional(),
              }),
            )
            .optional(),
        })
        .optional(),

      // ===== Featured (Pattern 2 — home) =====
      featured: z.boolean().default(false),
      featured_order: z.number().optional(),

      // ===== SEO =====
      seo: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          og_image: image().optional(),
        })
        .optional(),

      // ===== Credit =====
      fotografo: z.string().optional(),

      // ===== Pubblicazione =====
      draft: z.boolean().default(false),
    }),
});

export const collections = { progetti };
