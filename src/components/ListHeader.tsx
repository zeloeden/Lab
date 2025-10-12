import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { useUrlSync } from '@/hooks/useUrlState';
import { Search } from 'lucide-react';

interface Props {
  q: string;
  onQChange: (v: string) => void;
  status?: string;
  onStatusChange?: (v: string) => void;
  sort: string;
  onSortChange: (v: string) => void;
  view?: 'table' | 'cards';
  onViewChange?: (v: 'table' | 'cards') => void;
  page: number;
  pageSize: number;
  onPageChange: (n: number) => void;
  onPageSizeChange: (n: number) => void;
  total?: number;
  placeholder?: string;
}

export const ListHeader: React.FC<Props> = ({
  q,
  onQChange,
  status = 'all',
  onStatusChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  total,
  placeholder,
}) => {
  const debouncedQ = useDebounce(q, 300);
  useUrlSync({ q: debouncedQ, status, sort, view, page, pageSize });

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <div className="mx-auto max-w-[1400px] p-4 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              placeholder={placeholder || 'Search...'}
              className="pl-9"
              aria-label="Global search"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {onStatusChange && (
            <div className="min-w-[160px]">
              <Label className="sr-only">Status</Label>
              <Select value={status || 'all'} onValueChange={(v) => onStatusChange(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Not branded">Not branded</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="min-w-[160px]">
            <Label className="sr-only">Sort</Label>
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt:desc">Updated ↓</SelectItem>
                <SelectItem value="updatedAt:asc">Updated ↑</SelectItem>
                <SelectItem value="itemName:asc">Name A–Z</SelectItem>
                <SelectItem value="itemName:desc">Name Z–A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {onViewChange && view && (
            <div className="flex items-center gap-2">
              <Button variant={view === 'table' ? 'default' : 'outline'} onClick={() => onViewChange('table')}>Table</Button>
              <Button variant={view === 'cards' ? 'default' : 'outline'} onClick={() => onViewChange('cards')}>Cards</Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Label className="text-sm">Page</Label>
            <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</Button>
            <div className="text-sm w-16 text-center">{page} / {totalPages}</div>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>

          <div className="min-w-[120px]">
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};


