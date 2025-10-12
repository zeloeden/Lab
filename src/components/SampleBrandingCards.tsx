import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Tag } from 'lucide-react';

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

export const SampleBrandingCards: React.FC<{ rows: Row[]; onBrand: (id: string) => void }>
  = ({ rows, onBrand }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rows.map(r => (
        <Card key={r.id} className="rounded-2xl shadow-sm border bg-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.itemName}</div>
              <Badge variant={r.status === 'Accepted' ? 'default' : 'secondary'}>{r.status}</Badge>
            </div>
            <div className="text-xs text-gray-500">#{r.sampleNo}</div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="text-gray-600">Brand</div>
                <div>{r.brandedAs || <span className="text-gray-400">Not branded</span>}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-600">Price</div>
                <div>
                  {typeof r.priceCurrent === 'number' ? `$${r.priceCurrent}` : <span className="text-gray-400">—</span>}
                  {typeof r.priceChangePct === 'number' && (
                    <span className={`ml-2 ${r.priceChangePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {r.priceChangePct >= 0 ? '+' : ''}{r.priceChangePct.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => onBrand(r.id)}>
                {r.brandedAs ? (<><Edit className="h-3 w-3 mr-1" /> Edit</>) : (<><Tag className="h-3 w-3 mr-1" /> Brand</>)}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


