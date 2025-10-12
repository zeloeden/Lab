import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TestTube, Beaker } from 'lucide-react';

interface TestFormulaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTest: () => void;
  onSelectFormula: () => void;
  sampleName: string;
}

export const TestFormulaDialog: React.FC<TestFormulaDialogProps> = ({
  isOpen,
  onClose,
  onSelectTest,
  onSelectFormula,
  sampleName
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Action</DialogTitle>
          <DialogDescription>
            What would you like to do with <strong>{sampleName}</strong>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Button
            onClick={onSelectTest}
            className="w-full h-16 flex items-center justify-start gap-4 text-left"
            variant="outline"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <TestTube className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">New Test</div>
              <div className="text-sm text-gray-500">Create a test for this sample</div>
            </div>
          </Button>
          
          <Button
            onClick={onSelectFormula}
            className="w-full h-16 flex items-center justify-start gap-4 text-left"
            variant="outline"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
              <Beaker className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium">New Formula</div>
              <div className="text-sm text-gray-500">Create a formula with this sample</div>
            </div>
          </Button>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
