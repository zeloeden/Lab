import { decodeQR } from './qr';

export function handleScanNavigation(nav: (to: string) => void, raw: string) {
  const qr = decodeQR(raw);
  if (!qr) return;

  switch (qr.type) {
    case 'prep':
      // Preparations are now modal-based. If there's a formula code in extras, redirect to it
      if (qr.extras?.formulaCode) {
        const params = new URLSearchParams({ code: qr.extras.formulaCode, auto: 'start' });
        nav(`/formula-first?${params.toString()}`);
      } else {
        // No formula context - this shouldn't happen with proper QR generation
        console.warn('Prep QR without formula code - cannot open modal');
      }
      break;
    case 'formula': {
      const params = new URLSearchParams({ code: qr.code, auto: 'start' });
      nav(`/formula-first?${params.toString()}`);
      break;
    }
    case 'sample': {
      const params = new URLSearchParams({ search: qr.code });
      nav(`/samples?${params.toString()}`);
      break;
    }
  }
}

