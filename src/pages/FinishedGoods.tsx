import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ListHeader } from '@/components/ListHeader';
import { Eye, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sample } from '@/lib/types';
import { SampleDetail } from '@/components/SampleDetail';
import { SampleForm } from '@/components/SampleForm';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const FinishedGoods: React.FC = () => {
  const { colors } = useTheme();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; code?: string; country?: string }>>([]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('updatedAt:desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<Sample | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleEditClick = (sample: Sample) => {
    setEditingSample(sample);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (updatedSample: Sample) => {
    console.log('handleSaveEdit called with:', updatedSample);
    
    const stored = localStorage.getItem('nbslims_enhanced_samples');
    const all = stored ? JSON.parse(stored) : [];
    console.log('Current samples in storage:', all.length);
    
    // Find the original sample to preserve some fields
    const originalSample = all.find((s: any) => s.id === updatedSample.id);
    console.log('Original sample:', originalSample);
    
    if (!originalSample) {
      console.error('Original sample not found!');
      return;
    }
    
    // Merge the updated sample with the original, preserving important fields
    const mergedSample = {
      ...originalSample,
      ...updatedSample,
      // Preserve these fields from original
      id: originalSample.id,
      sampleNo: originalSample.sampleNo,
      isFinishedGood: true, // Ensure it stays as finished good
      createdAt: originalSample.createdAt,
      // Update these fields from the form
      itemNameEN: updatedSample.itemNameEN,
      itemNameAR: updatedSample.itemNameAR,
      supplierId: updatedSample.supplierId,
      patchNumber: updatedSample.patchNumber || originalSample.patchNumber,
      supplierCode: updatedSample.supplierCode,
      dateOfSample: updatedSample.dateOfSample,
      customIdNo: updatedSample.customIdNo,
      status: updatedSample.status,
      storageLocation: updatedSample.storageLocation,
      pricing: updatedSample.pricing,
      shipment: updatedSample.shipment,
      isRawMaterial: updatedSample.isRawMaterial,
      brandedAs: updatedSample.brandedAs,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Merged sample:', mergedSample);
    
    const updated = all.map((s: any) => s.id === updatedSample.id ? mergedSample : s);
    localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updated));
    
    // Update local state
    const finishedGoods = updated.filter((s: any) => s.isFinishedGood === true);
    console.log('Updated finished goods:', finishedGoods.length);
    setSamples(finishedGoods);
    setIsEditOpen(false);
    setEditingSample(null);
    
    toast.success('Product updated successfully!');
    console.log('Save completed successfully');
  };

  useEffect(() => {
    const stored = localStorage.getItem('nbslims_enhanced_samples');
    const all = stored ? JSON.parse(stored) : [];
    // Show both finished goods and formula products
    const goods = all.filter((s: any) => s.isFinishedGood === true || s.isFormulaProduct === true);
    setSamples(goods);
  }, []);

  useEffect(() => {
    // Load suppliers from localStorage
    const storedSuppliers = localStorage.getItem('nbslims_suppliers');
    if (storedSuppliers) {
      const parsedSuppliers = JSON.parse(storedSuppliers);
      setSuppliers(parsedSuppliers);
    } else {
      // Default suppliers if none exist
      setSuppliers([
        { id: 'internal', name: 'Internal', code: 'INT' },
        { id: 'external', name: 'External Supplier', code: 'EXT' }
      ]);
    }
  }, []);

  const exportTemplateCSV = () => {
    const header = [
      'customIdNo',
      'itemNameEN',
      'supplierId',
      'supplierCode',
      'status',
      'sourceFormulaId',
      'rackNumber',
      'position',
      'patchNumber',
      'createdAt'
    ].join(',');
    const blob = new Blob([header + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finished_goods_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDataCSV = () => {
    const header = [
      'customIdNo','itemNameEN','supplierId','supplierCode','status','sourceFormulaId','rackNumber','position','patchNumber','createdAt'
    ];
    const rows = samples.map(s => [
      JSON.stringify(s.customIdNo || ''),
      JSON.stringify(s.itemNameEN || ''),
      JSON.stringify(s.supplierId || ''),
      JSON.stringify((s as any).supplierCode || ''),
      JSON.stringify(s.status || ''),
      JSON.stringify((s as any).sourceFormulaId || ''),
      JSON.stringify(s.storageLocation?.rackNumber || ''),
      JSON.stringify(String(s.storageLocation?.position ?? '')),
      JSON.stringify(s.patchNumber || ''),
      JSON.stringify((s.createdAt ? new Date(s.createdAt as any).toISOString() : ''))
    ].join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finished_goods.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.replace(/^\"|\"$/g, ''));
    return lines.slice(1).map(line => {
      const cells = line.match(/(?:^|,)("(?:[^"]+|"")*"|[^,]*)/g)?.map(c => c.replace(/^,/, '')) || [];
      const obj: any = {};
      headers.forEach((h, i) => {
        let v = (cells[i] || '').trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
        obj[h] = v;
      });
      return obj;
    });
  };

  const importCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const rows = parseCSV(text);
        const stored = localStorage.getItem('nbslims_enhanced_samples');
        const list: any[] = stored ? JSON.parse(stored) : [];
        let maxPosition = 0;
        let maxCounter = 0;
        rows.forEach((r, idx) => {
          const now = new Date();
          const sample: any = {
            id: `fg-${Date.now()}-${idx}`,
            sampleNo: Date.now() + idx,
            itemNameEN: r.itemNameEN || 'Finished Good',
            supplierId: r.supplierId || 'internal',
            supplierCode: r.supplierCode || undefined,
            patchNumber: r.patchNumber || '',
            status: r.status || 'Accepted',
            approved: true,
            dateOfSample: now,
            customIdNo: r.customIdNo || undefined,
            storageLocation: { rackNumber: r.rackNumber || 'FG', position: parseInt(r.position || '0') || 0 },
            pricing: { basePrice: 0, currency: 'USD', scalingPrices: [] },
            isFinishedGood: true,
            sourceFormulaId: r.sourceFormulaId || undefined,
            createdAt: r.createdAt ? new Date(r.createdAt) : now,
            updatedAt: now,
            createdBy: 'import',
            updatedBy: 'import'
          };
          list.push(sample);
          if (sample.storageLocation?.position && sample.storageLocation.position > maxPosition) maxPosition = sample.storageLocation.position;
          const m = String(sample.customIdNo || '').match(/(\d+)$/);
          if (m) maxCounter = Math.max(maxCounter, parseInt(m[1]));
        });
        localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(list));
        // update continuity
        try {
          const { getFinishedGoodsState, saveFinishedGoodsState } = require('@/lib/utils');
          const state = getFinishedGoodsState();
          saveFinishedGoodsState({ ...state, lastPosition: Math.max(state.lastPosition, maxPosition), lastCodeCounter: Math.max(state.lastCodeCounter, maxCounter) });
        } catch {}
        // refresh
        setSamples(list.filter((s: any) => s.isFinishedGood === true));
        alert('Import completed');
      } catch (e) {
        console.error('Import error', e);
        alert('Failed to import CSV');
      }
    };
    reader.readAsText(file);
  };

  const filtered = samples.filter(s =>
    (q ? (s.itemNameEN?.toLowerCase().includes(q.toLowerCase()) || String(s.sampleNo).includes(q)) : true)
  );
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-gray-600">Finished goods and formula products generated from approved formulas</p>
      </div>

      <ListHeader
        q={q}
        onQChange={setQ}
        sort={sort}
        onSortChange={setSort}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        total={total}
        placeholder="Search finished goods..."
      />

      <Card className="hover:shadow-md transition-shadow data-[state=open]:animate-in data-[state=open]:fade-in-0">
        <CardHeader>
          <CardTitle>Products ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" onClick={exportTemplateCSV}>Export Template (CSV)</Button>
            <Button variant="outline" onClick={exportDataCSV}>Export Data (CSV)</Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCSV(f);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Import (CSV)</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source Formula</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
              <TableRow key={s.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono">{s.customIdNo || s.sampleNo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.itemNameEN}</span>
                      <Badge className={
                        s.isFormulaProduct 
                          ? "bg-blue-100 text-blue-800 border-blue-200" 
                          : "bg-purple-100 text-purple-800 border-purple-200"
                      }>
                        {s.isFormulaProduct ? "Formula Product" : "Finished Good"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      s.status === 'Accepted' ? 'bg-green-100 text-green-800'
                        : s.status === 'Rejected' ? 'bg-red-100 text-red-800'
                        : s.status === 'Testing' ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{s.sourceFormulaId || '-'}</TableCell>
                  <TableCell>{s.createdAt ? new Date(s.createdAt as any).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(s); setIsViewOpen(true); }} title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(s)} title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Product Details */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <SampleDetail sample={selected} onClose={() => setIsViewOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {editingSample && (
            <SampleForm
              sample={editingSample}
              suppliers={suppliers}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinishedGoods;


