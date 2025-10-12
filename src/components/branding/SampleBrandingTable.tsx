import React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandDrawer } from './BrandDrawer';

export interface UISampleRow {
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
  rows: UISampleRow[];
  onRefresh: () => void;
}

export const SampleBrandingTable: React.FC<Props> = ({ rows, onRefresh }) => {
  const [drawer, setDrawer] = React.useState<{ open: boolean; id?: string; initial?: Partial<UISampleRow> }>({ open: false });
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const columns = React.useMemo<ColumnDef<UISampleRow>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
    },
    { accessorKey: 'sampleNo', header: 'Sample No' },
    { accessorKey: 'itemName', header: 'Item Name' },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => (
      <Badge variant={getValue<string>() === 'Accepted' ? 'default' : 'secondary'}>{getValue<string>()}</Badge>
    ) },
    { accessorKey: 'brandedAs', header: 'Branded As', cell: ({ getValue }) => getValue() || <span className="text-gray-400">Not branded</span> },
    { accessorKey: 'priceCurrent', header: 'Price', cell: ({ row }) => (
      <div className="text-sm">
        {typeof row.original.priceCurrent === 'number' ? `$${row.original.priceCurrent}` : <span className="text-gray-400">—</span>}
        {typeof row.original.priceChangePct === 'number' && (
          <span className={`ml-2 ${row.original.priceChangePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {row.original.priceChangePct >= 0 ? '+' : ''}{row.original.priceChangePct.toFixed(1)}%
          </span>
        )}
      </div>
    ) },
    { accessorKey: 'updatedAt', header: 'Updated', cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString() },
    { id: 'actions', header: 'Actions', cell: ({ row }) => (
      <Button size="sm" variant="outline" onClick={() => setDrawer({ open: true, id: row.original.id, initial: row.original })}>Brand/Edit</Button>
    ) },
  ], []);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
  });

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <div className="relative">
      {selectedCount > 0 && (
        <div className="sticky top-0 z-20 bg-background border-b p-2 flex items-center gap-2">
          <span className="text-sm">{selectedCount} selected</span>
          <Button size="sm" variant="outline">Bulk Brand</Button>
          <Button size="sm" variant="outline">Accept</Button>
          <Button size="sm" variant="destructive">Delete</Button>
        </div>
      )}
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id}>
              {hg.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(r => (
            <TableRow key={r.id} data-state={r.getIsSelected() && 'selected'} className="hover:bg-muted/50">
              {r.getVisibleCells().map(c => (
                <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">No results</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <BrandDrawer
        open={drawer.open}
        onOpenChange={(o) => setDrawer(s => ({ ...s, open: o }))}
        sampleId={drawer.id}
        initial={{ brand: drawer.initial?.brandedAs || '', priceCurrent: drawer.initial?.priceCurrent, status: drawer.initial?.status as any }}
        onSuccess={onRefresh}
      />
    </div>
  );
};


