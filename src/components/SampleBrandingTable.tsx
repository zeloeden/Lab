import React from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, ColumnDef, flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Tag, TestTube } from 'lucide-react';

interface Row {
  id: string;
  sampleNo: string;
  itemName: string;
  status: string;
  brandedAs?: string | null;
  priceCurrent?: number;
  priceChangePct?: number;
  updatedAt: string;
}

interface Props {
  rows: Row[];
  isLoading?: boolean;
  onBrand: (id: string) => void;
  virtualize?: boolean;
}

export const SampleBrandingTable: React.FC<Props> = ({ rows, isLoading, onBrand, virtualize }) => {
  const columns = React.useMemo<ColumnDef<Row>[]>(() => [
    { header: 'Sample No', accessorKey: 'sampleNo' },
    { header: 'Item Name', accessorKey: 'itemName' },
    { header: 'Status', accessorKey: 'status', cell: ({ getValue }) => (
      <Badge variant={String(getValue()) === 'Accepted' ? 'default' : 'secondary'}>{String(getValue())}</Badge>
    ) },
    { header: 'Branded As', accessorKey: 'brandedAs', cell: ({ getValue }) => getValue() || <span className="text-gray-400">Not branded</span> },
    { header: 'Price', accessorKey: 'priceCurrent', cell: ({ row }) => (
      <div className="text-sm">
        {typeof row.original.priceCurrent === 'number' ? `$${row.original.priceCurrent}` : <span className="text-gray-400">—</span>}
        {typeof row.original.priceChangePct === 'number' && (
          <div className={row.original.priceChangePct >= 0 ? 'text-green-600' : 'text-red-600'}>
            {row.original.priceChangePct >= 0 ? '+' : ''}{row.original.priceChangePct.toFixed(1)}%
          </div>
        )}
      </div>
    ) },
    { header: 'Updated', accessorKey: 'updatedAt', cell: ({ getValue }) => new Date(String(getValue())).toLocaleString() },
    { header: 'Actions', id: 'actions', cell: ({ row }) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onBrand(row.original.id)}>
          {row.original.brandedAs ? (<><Edit className="h-3 w-3 mr-1" /> Edit</>) : (<><Tag className="h-3 w-3 mr-1" /> Brand</>)}
        </Button>
      </div>
    ) },
  ], [onBrand]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const useVirtual = !!virtualize;

  return (
    <div className="rounded-2xl border bg-card">
      <div ref={tableContainerRef} className={useVirtual ? 'max-h-[600px] overflow-auto' : ''}>
        <Table>
          <TableHeader>
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id} className="sticky top-0 bg-background z-10">
              {hg.headers.map(h => (
                <TableHead key={h.id}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
          </TableHeader>
          <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div className="h-8 bg-muted/50 animate-pulse rounded" />
              </TableCell>
            </TableRow>
          )}
          {!isLoading && table.getRowModel().rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-sm text-gray-500 py-6">
                No results. Try adjusting filters.
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (useVirtual
            ? rowVirtualizer.getVirtualItems().map(vi => {
                const r = table.getRowModel().rows[vi.index];
                return (
                  <TableRow key={r.id} className="hover:bg-muted/50">
                    {r.getVisibleCells().map(c => (
                      <TableCell key={c.id}>{flexRender(c.column.columnDef.cell ?? c.column.columnDef.header, c.getContext())}</TableCell>
                    ))}
                  </TableRow>
                );
              })
            : table.getRowModel().rows.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/50">
                  {r.getVisibleCells().map(c => (
                    <TableCell key={c.id}>{flexRender(c.column.columnDef.cell ?? c.column.columnDef.header, c.getContext())}</TableCell>
                  ))}
                </TableRow>
              )))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};


