/**
 * MONTACUTI — Etichette UI per categorie / stati progetto
 */
import type { CollectionEntry } from 'astro:content';

type Categoria = CollectionEntry<'progetti'>['data']['categoria'];
type Stato = CollectionEntry<'progetti'>['data']['stato'];

export const categoriaLabel: Record<Categoria, string> = {
  'commerciale-terziario': 'Commerciale e terziario',
  residenziale: 'Residenziale',
  'riqualificazione-urbana': 'Riqualificazione urbana',
  industriale: 'Industriale',
};

export const statoLabel: Record<Stato, string> = {
  realizzato: 'Realizzato',
  'in-corso': 'In corso',
  concept: 'Concept',
};

/** Etichette campi del meta block (Pattern 5) */
export const metaLabel: Record<string, string> = {
  tipologia: 'Tipologia',
  localizzazione: 'Localizzazione',
  superficie: 'Superficie',
  committente: 'Committente',
  progetto_architettonico: 'Progetto architettonico',
  direzione_lavori: 'Direzione lavori',
  strutture: 'Strutture',
  impianti: 'Impianti',
  impresa: 'Impresa',
  tema_progettuale: 'Tema progettuale',
};

/** Ordine canonico di rendering dei campi meta */
export const metaOrder = [
  'tipologia',
  'localizzazione',
  'superficie',
  'committente',
  'progetto_architettonico',
  'direzione_lavori',
  'strutture',
  'impianti',
  'impresa',
  'tema_progettuale',
] as const;
