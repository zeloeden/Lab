import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface GroupHeaderProps {
  supplierId: string;
  supplierName: string;
  itemCount: number;
  onCreatePODraft?: () => void;
  onViewSupplier?: () => void;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({
  supplierId,
  supplierName,
  itemCount,
  onCreatePODraft,
  onViewSupplier
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {supplierName}
        </span>
        <Badge variant="secondary" className="text-xs">
          {itemCount}
        </Badge>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreatePODraft}
          className="h-7 px-2 text-xs"
        >
          <FileText className="h-3 w-3 mr-1" />
          Create PO
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewSupplier}>
              View Supplier Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreatePODraft}>
              Create PO Draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
