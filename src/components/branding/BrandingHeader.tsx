import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import { useUrlState } from '@/hooks/useUrlState';
import { Search } from 'lucide-react';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  brand: string;
  onBrandChange: (b: string) => void;
  supplier: string;
  onSupplierChange: (s: string) => void;
  sort: string;
  onSortChange: (s: string) => void;
  view: 'table' | 'cards';
  onViewChange: (v: 'table' | 'cards') => void;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
}

export const BrandingHeader: React.FC<Props> = ({
  query,
  onQueryChange,
  status,
  onStatusChange,
  brand,
  onBrandChange,
  supplier,
  onSupplierChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  pageSize,
  onPageSizeChange,
}) => {
  const { setParam } = useUrlState();
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    setParam('s', debouncedQuery);
  }, [debouncedQuery, setParam]);

  React.useEffect(() => { setParam('status', status); }, [status, setParam]);
  React.useEffect(() => { setParam('brand', brand); }, [brand, setParam]);
  React.useEffect(() => { setParam('supplier', supplier); }, [supplier, setParam]);
  React.useEffect(() => { setParam('sort', sort); }, [sort, setParam]);
  React.useEffect(() => { setParam('view', view); }, [view, setParam]);
  React.useEffect(() => { setParam('pageSize', pageSize); }, [pageSize, setParam]);

  return (
    <div className="mx-auto max-w-[1400px] p-4 lg:p-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search by name, patch, code, sample, supplier, or status…"
              className="pl-8"
              aria-label="Global search"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Not branded">Not branded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Brand</Label>
          <Input value={brand} onChange={(e) => onBrandChange(e.target.value)} placeholder="e.g., ADF" />
        </div>
        <div className="md:col-span-2">
          <Label>Supplier</Label>
          <Input value={supplier} onChange={(e) => onSupplierChange(e.target.value)} placeholder="Supplier" />
        </div>
        <div className="md:col-span-2">
          <Label>Sort</Label>
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt:desc">Updated (newest)</SelectItem>
              <SelectItem value="updatedAt:asc">Updated (oldest)</SelectItem>
              <SelectItem value="itemName:asc">Name (A→Z)</SelectItem>
              <SelectItem value="itemName:desc">Name (Z→A)</SelectItem>
              <SelectItem value="priceCurrent:desc">Price (high→low)</SelectItem>
              <SelectItem value="priceCurrent:asc">Price (low→high)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-12 flex gap-2">
          <div className="flex items-center gap-2">
            <Label>View</Label>
            <Button variant={view === 'table' ? 'default' : 'outline'} size="sm" onClick={() => onViewChange('table')}>Table</Button>
            <Button variant={view === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => onViewChange('cards')}>Cards</Button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Label>Page size</Label>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => {
              onQueryChange(''); onStatusChange(''); onBrandChange(''); onSupplierChange(''); onSortChange('updatedAt:desc');
            }}>Clear filters</Button>
          </div>
        </div>
      </div>
    </div>
  );
};


