import { decodeQR } from './qr';

export function handleScanNavigation(nav: (to: string) => void, raw: string) {
  const qr = decodeQR(raw);
  if (!qr) return;

  switch (qr.type) {
    case 'prep':
      nav(`/preparations/${encodeURIComponent(qr.id)}`);
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

