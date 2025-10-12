import React, { useState, useEffect } from 'react';
import { RequestedItem, ItemPriority, ItemUnit, RequestState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, ArrowRight, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRequestedItemsStore } from '../store';
import { requestedItemsService } from '../service';

interface DrawerProps {
  item: RequestedItem | null;
  isOpen: boolean;
  onClose: () => void;
  sampleName?: string;
  supplierName?: string;
}

export const ItemDrawer: React.FC<DrawerProps> = ({
  item,
  isOpen,
  onClose,
  sampleName = 'Unknown Sample',
  supplierName = 'Unknown Supplier'
}) => {
  const { updateItem, moveItem } = useRequestedItemsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 0,
    unit: 'ml' as ItemUnit,
    priority: 'medium' as ItemPriority,
    notes: '',
    supplierId: '',
    poNumber: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        quantity: item.quantity,
        unit: item.unit,
        priority: item.priority,
        notes: item.notes || '',
        supplierId: item.supplierId,
        poNumber: item.poNumber || ''
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;

    try {
      const updates = {
        quantity: formData.quantity,
        unit: formData.unit,
        priority: formData.priority,
        notes: formData.notes,
        supplierId: formData.supplierId,
        poNumber: formData.poNumber,
        lastUpdatedBy: 'current-user' // This should come from auth context
      };

      await requestedItemsService.updateItem(item.id, updates);
      updateItem(item.id, updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleMoveToState = async (newState: RequestState) => {
    if (!item) return;

    try {
      await requestedItemsService.moveItem(item.id, newState, 'current-user');
      moveItem(item.id, newState, 'current-user');
    } catch (error) {
      console.error('Error moving item:', error);
    }
  };

  if (!item) return null;

  const canMoveToOrdered = item.state === 'to-be-ordered';
  const canMoveToBeOrdered = item.state === 'requested';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Requested Item Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Sample</Label>
                <p className="text-lg font-semibold">{sampleName}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Supplier</Label>
                <p className="text-lg font-semibold">{supplierName}</p>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Status</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {item.state}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Priority</Label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="capitalize">
                      {item.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Editable Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Item Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      quantity: parseFloat(e.target.value) || 0 
                    }))}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      unit: value as ItemUnit 
                    }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">Milliliter (ml)</SelectItem>
                      <SelectItem value="L">Liter (L)</SelectItem>
                      <SelectItem value="g">Gram (g)</SelectItem>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    priority: value as ItemPriority 
                  }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Additional notes or special instructions"
                  rows={3}
                  disabled={!isEditing}
                />
              </div>

              {item.state === 'ordered' && (
                <div>
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input
                    id="poNumber"
                    value={formData.poNumber}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      poNumber: e.target.value 
                    }))}
                    placeholder="Enter PO number"
                    disabled={!isEditing}
                  />
                </div>
              )}

              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Actions</h3>
              
              <div className="flex gap-2">
                {canMoveToBeOrdered && (
                  <Button
                    variant="outline"
                    onClick={() => handleMoveToState('to-be-ordered')}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Move to To-Be-Ordered
                  </Button>
                )}
                
                {canMoveToOrdered && (
                  <Button
                    variant="outline"
                    onClick={() => handleMoveToState('ordered')}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Mark as Ordered
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* History */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">History</h3>
              
              <div className="space-y-3">
                {item.history.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{entry.by}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500">
                          {formatDistanceToNow(entry.at, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {entry.from ? `Moved from ${entry.from} to ${entry.to}` : `Set to ${entry.to}`}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-gray-500 mt-1">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
