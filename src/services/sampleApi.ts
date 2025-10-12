import { parseQuery, includesCI } from '@/lib/searchParse';

export type UISample = {
  id: string;
  sampleNo: string;
  patchNo?: string;
  code?: string;
  itemName: string;
  supplier?: string;
  status: 'Accepted' | 'Pending' | 'Rejected' | 'Not branded';
  brandedAs?: string | null;
  priceCurrent?: number;
  pricePrevious?: number;
  priceChangePct?: number;
  updatedAt: string;
};

export interface SamplesResponse {
  data: UISample[];
  page: number;
  pageSize: number;
  total: number;
}

// In the absence of a backend, adapt data from localStorage to the UI Sample shape
function mapLocalToUi(sample: any): UISample {
  const priceCurrent = sample.brandedAs?.price ?? undefined;
  const pricePrevious = undefined;
  const priceChangePct = priceCurrent && pricePrevious ? ((priceCurrent - pricePrevious) / pricePrevious) * 100 : undefined;
  return {
    id: sample.id,
    sampleNo: String(sample.sampleNo ?? sample.sampleId ?? ''),
    patchNo: sample.patchNumber,
    code: sample.refCode,
    itemName: sample.itemNameEN || sample.itemName || 'Unnamed',
    supplier: sample.supplierId,
    status: (sample.status || 'Untested') === 'Accepted' ? 'Accepted' : (sample.brandedAs ? 'Accepted' : 'Not branded'),
    brandedAs: sample.brandedAs?.brand ?? null,
    priceCurrent,
    pricePrevious,
    priceChangePct,
    updatedAt: new Date(sample.updatedAt || sample.createdAt || Date.now()).toISOString(),
  };
}

export async function getSamples(params: {
  q?: string;
  status?: string;
  supplier?: string;
  brand?: string;
  page?: number;
  pageSize?: number;
  sort?: string; // e.g., 'updatedAt:desc'
}): Promise<SamplesResponse> {
  const {
    q = '',
    status = '',
    supplier = '',
    brand = '',
    page = 1,
    pageSize = 20,
    sort = 'updatedAt:desc',
  } = params || {};

  // Load from localStorage (mocking backend)
  const stored = localStorage.getItem('nbslims_enhanced_samples');
  const all: any[] = stored ? JSON.parse(stored) : [];
  let data = all.map(mapLocalToUi);

  // Unified search
  const { textTerms, exact } = parseQuery(q);
  data = data.filter((s) => {
    // exact operators
    if (exact.name && !includesCI(s.itemName, exact.name)) return false;
    if (exact.patch && !includesCI(s.patchNo, exact.patch)) return false;
    if (exact.code && !includesCI(s.code, exact.code)) return false;
    if (exact.sample && !includesCI(s.sampleNo, exact.sample.replace(/^#/, ''))) return false;
    if (exact.supplier && !includesCI(s.supplier, exact.supplier)) return false;
    if (exact.status && !includesCI(s.status, exact.status)) return false;

    // free text terms across fields
    const hay = `${s.itemName} ${s.sampleNo} ${s.patchNo || ''} ${s.code || ''} ${s.supplier || ''} ${s.status} ${s.brandedAs || ''}`;
    return textTerms.every((t) => includesCI(hay, t));
  });

  // Additional filters
  if (status) {
    const statuses = status.split(',').map((x) => x.trim());
    data = data.filter((s) => statuses.includes(s.status));
  }
  if (supplier) {
    data = data.filter((s) => includesCI(s.supplier, supplier));
  }
  if (brand) {
    data = data.filter((s) => includesCI(s.brandedAs || undefined, brand));
  }

  // Sort
  const [sortKey, sortDirRaw] = sort.split(':');
  const sortDir = sortDirRaw === 'asc' ? 1 : -1;
  data.sort((a: any, b: any) => {
    const av = a[sortKey as keyof UISample];
    const bv = b[sortKey as keyof UISample];
    if (av === bv) return 0;
    return av > bv ? sortDir : -sortDir;
  });

  const total = data.length;
  const start = (page - 1) * pageSize;
  const paged = data.slice(start, start + pageSize);

  return {
    data: paged,
    page,
    pageSize,
    total,
  };
}

export async function patchSample(id: string, payload: Partial<UISample>): Promise<UISample> {
  const stored = localStorage.getItem('nbslims_enhanced_samples');
  const all: any[] = stored ? JSON.parse(stored) : [];
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Sample not found');
  
  // Update the sample with the new data
  const updatedSample = {
    ...all[idx],
    status: payload.status || all[idx].status,
    updatedAt: new Date().toISOString(),
  };

  // Handle branding data
  if (payload.brandedAs !== undefined) {
    if (payload.brandedAs) {
      updatedSample.brandedAs = {
        ...(all[idx].brandedAs || {}),
        brand: payload.brandedAs,
        price: payload.priceCurrent || all[idx].brandedAs?.price,
        brandedBy: all[idx].brandedAs?.brandedBy || 'unknown',
        brandedAt: all[idx].brandedAs?.brandedAt || new Date().toISOString()
      };
    } else {
      updatedSample.brandedAs = undefined;
    }
  }

  all[idx] = updatedSample;
  localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(all));
  return mapLocalToUi(all[idx]);
}


