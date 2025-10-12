import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPdfPageCount, rasterizePdfPageToDataURL } from './pdf';
import type { PDFFileLike } from './pdf';
import { ChevronLeft, ChevronRight, Check, X, Loader2 } from 'lucide-react';

export function PdfPagePickerDialog({
  open,
  file,
  onPick,
  onCancel,
}: {
  open: boolean;
  file: PDFFileLike | null;
  onPick: (page: number) => void;
  onCancel: () => void;
}) {
  const [pageCount, setPageCount] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const safeFile = useMemo(() => file, [file]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!open || !safeFile) return;
      setPreview('');
      setLoading(true);
      try {
        const count = await getPdfPageCount(safeFile);
        if (ignore) return;
        setPageCount(count);
        setPage((p) => Math.min(Math.max(1, p), count));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [open, safeFile]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!open || !safeFile) return;
      setLoading(true);
      try {
        const url = await rasterizePdfPageToDataURL(safeFile, page, 900);
        if (!ignore) setPreview(url);
      } catch {
        if (!ignore) setPreview('');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [open, safeFile, page]);

  if (!open || !safeFile) return null;

  const setPageClamped = (n: number) => setPage(Math.min(Math.max(1, Math.floor(n)), pageCount));

  return (
    <Dialog open={open} onOpenChange={(o)=>{ if(!o) onCancel(); }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select PDF Page</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={()=>setPageClamped(page - 1)} disabled={page<=1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span>Page</span>
              <Input
                className="w-20"
                type="number"
                min={1}
                max={pageCount}
                value={page}
                onChange={(e)=>setPageClamped(Number(e.target.value))}
              />
              <span>of {pageCount}</span>
            </div>
            <Button variant="outline" onClick={()=>setPageClamped(page + 1)} disabled={page>=pageCount}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <Button onClick={()=>onPick(page)} disabled={loading}>
              <Check className="h-4 w-4 mr-2" />
              Use Page {page}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          <div className="border rounded-md bg-muted/20 min-h-[320px] flex items-center justify-center overflow-auto">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Rendering preview…
              </div>
            ) : preview ? (
              <img src={preview} alt={`PDF page ${page}`} className="max-h-[70vh] mx-auto" />
            ) : (
              <div className="text-sm text-muted-foreground">No preview</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
