import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileImage, FileCode2, X } from 'lucide-react';

export function PasteOptionsDialog({
  open, onPick, onCancel,
}:{
  open: boolean;
  onPick: (choice: 'svg'|'image') => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o)=>{ if(!o) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paste Options</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your clipboard has both a vector (SVG) and a bitmap image. How would you like to paste?
          </p>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={()=>onPick('svg')}>
              <FileCode2 className="h-4 w-4 mr-2" />
              Paste as Editable Vector (SVG)
            </Button>
            <Button variant="outline" className="flex-1" onClick={()=>onPick('image')}>
              <FileImage className="h-4 w-4 mr-2" />
              Paste as Image
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onCancel}><X className="h-4 w-4 mr-2" />Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
