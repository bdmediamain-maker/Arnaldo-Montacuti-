/**
 * Studio Arnaldo Montacuti — informazioni statiche
 * Fonte: montacuti-brief.md §5.5 + montacuti-content-audit.md (pagina Home)
 */

export const studio = {
  nome: 'Studio Arnaldo Montacuti',
  nomeBreve: 'Montacuti',
  citta: 'Cesena',
  indirizzo: {
    via: 'Via A. Saffi 62',
    cap: '47521',
    citta: 'Cesena',
    provincia: 'FC',
    paese: 'Italia',
  },
  contatti: {
    email: 'arch.montacuti@gmail.com',
    telefono: '+39 0547 332425',
    cellulare: '+39 339 405 7683',
  },
  social: {
    // placeholder per asset futuri
  },
  copyright: `© ${new Date().getFullYear()} Studio Arnaldo Montacuti — Architetto`,
} as const;

/**
 * Information Architecture — voci di menu raggruppate
 * Riferimento: montacuti-ui-patterns.md Pattern 1
 * Gruppi distinti per il MenuOverlay fullscreen.
 */
export const menuGroups = [
  {
    eyebrow: 'Esplora i progetti',
    items: [
      { label: 'Tutti i progetti', href: '/progetti' },
      { label: 'Commerciale e terziario', href: '/progetti?categoria=commerciale-terziario' },
      { label: 'Residenziale', href: '/progetti?categoria=residenziale' },
      { label: 'Riqualificazione urbana', href: '/progetti?categoria=riqualificazione-urbana' },
    ],
  },
  {
    eyebrow: 'Studio',
    items: [
      { label: 'Lo studio', href: '/studio' },
      { label: 'Filosofia', href: '/studio#filosofia' },
      { label: 'Collaborazioni', href: '/studio#collaborazioni' },
    ],
  },
  {
    eyebrow: 'Contatti',
    items: [
      { label: 'Inizia un progetto', href: '/contatti#form' },
      { label: 'Studio · Via A. Saffi 62, Cesena', href: '/contatti#info' },
    ],
  },
] as const;

/**
 * Primary nav — voci sempre visibili nell'header
 */
export const primaryNav = [
  { label: 'Progetti', href: '/progetti' },
] as const;
