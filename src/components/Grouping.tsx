import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

type Row = {
  id: string;
  itemName: string;
  status: string;
  brandedAs?: string | null;
};

type GroupBy = 'none' | 'status' | 'brand' | 'name-token';

function keyFor(row: Row, by: GroupBy): string {
  switch (by) {
    case 'status': return row.status || 'Unknown';
    case 'brand': return row.brandedAs || 'Not branded';
    case 'name-token': return row.itemName.split(' - ')[0] || row.itemName;
    default: return 'All';
  }
}

export const Grouping: React.FC<{
  rows: Row[];
  by: GroupBy;
  render: (rows: Row[]) => React.ReactNode;
}> = ({ rows, by, render }) => {
  if (by === 'none') return <>{render(rows)}</>;
  const groups = rows.reduce<Record<string, Row[]>>((acc, r) => {
    const k = keyFor(r, by);
    (acc[k] ||= []).push(r);
    return acc;
  }, {});
  const entries = Object.entries(groups);
  return (
    <Accordion type="multiple" className="space-y-3">
      {entries.map(([title, items]) => (
        <AccordionItem value={title} key={title} className="border rounded-lg">
          <AccordionTrigger className="px-4 py-2">{title} <span className="ml-2 text-sm text-gray-500">({items.length})</span></AccordionTrigger>
          <AccordionContent className="p-2">
            {render(items)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};


