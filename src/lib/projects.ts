/**
 * MONTACUTI — Helpers per content collection `progetti`
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Progetto = CollectionEntry<'progetti'>;

/** Lista progetti pubblicati (esclude draft), ordinata per anno desc */
export async function listProgetti(): Promise<Progetto[]> {
  const all = await getCollection('progetti', (p) => !p.data.draft);
  return all.sort((a, b) => {
    const ya = typeof a.data.anno === 'number' ? a.data.anno : parseInt(String(a.data.anno));
    const yb = typeof b.data.anno === 'number' ? b.data.anno : parseInt(String(b.data.anno));
    return (yb || 0) - (ya || 0);
  });
}

/** Featured progetti per home (Pattern 2) — ordinati per featured_order */
export async function getFeatured(): Promise<Progetto[]> {
  const all = await listProgetti();
  return all
    .filter((p) => p.data.featured)
    .sort((a, b) => (a.data.featured_order ?? 999) - (b.data.featured_order ?? 999));
}

/**
 * Related projects (Pattern 10):
 *   1. Stessa categoria + stato realizzato (escluso il corrente)
 *   2. Completa fino a 3 con stessa categoria, stato qualsiasi
 *   3. Completa fino a 3 con progetti random
 */
export async function getRelated(current: Progetto, count = 3): Promise<Progetto[]> {
  const all = await listProgetti();
  const others = all.filter((p) => p.id !== current.id);

  const sameCatRealized = others.filter(
    (p) => p.data.categoria === current.data.categoria && p.data.stato === 'realizzato',
  );
  const result: Progetto[] = sameCatRealized.slice(0, count);

  if (result.length < count) {
    const sameCatRest = others.filter(
      (p) => p.data.categoria === current.data.categoria && !result.includes(p),
    );
    result.push(...sameCatRest.slice(0, count - result.length));
  }

  if (result.length < count) {
    const rest = others.filter((p) => !result.includes(p));
    result.push(...rest.slice(0, count - result.length));
  }

  return result;
}
