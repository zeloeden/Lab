import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  Package,
  Send,
  DollarSign,
  Calendar,
  User,
  Building,
  Kanban,
  List
} from 'lucide-react';
import { 
  RequestedItem, 
  ItemPriority, 
  ItemUnit, 
  RequestState,
  Sample
} from '@/lib/types';
import { RequestedItemsBoard, GroupHeader, useRequestedItemsStore, requestedItemsService } from '@/features/requested';

// using shared requested items service & store

const sampleService = {
  getAllSamples: async () => {
    const stored = localStorage.getItem('nbslims_enhanced_samples');
    return stored ? JSON.parse(stored) : [];
  }
};

const supplierService = {
  getAllSuppliers: async () => {
    const stored = localStorage.getItem('nbslims_suppliers');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default suppliers if none exist
    const defaultSuppliers = [
      { id: 'sup-1', name: 'Chemical Supplies Co.' },
      { id: 'sup-2', name: 'Lab Equipment Ltd.' },
      { id: 'sup-3', name: 'Scientific Materials Inc.' }
    ];
    localStorage.setItem('nbslims_suppliers', JSON.stringify(defaultSuppliers));
    return defaultSuppliers;
  }
};

export const RequestedItems: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { addItem: storeAddItem, updateItem: storeUpdateItem, moveItem: storeMoveItem, deleteItem: storeDeleteItem, setItems: storeSetItems } = useRequestedItemsStore();
  
  const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RequestedItem | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Form state for both create and edit
  const [formData, setFormData] = useState({
    sampleId: '',
    quantity: 1,
    unit: 'ml' as ItemUnit,
    priority: 'medium' as ItemPriority,
    notes: '',
    supplierId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, samplesData, suppliersData] = await Promise.all([
        requestedItemsService.getAllItems(),
        sampleService.getAllSamples(),
        supplierService.getAllSuppliers()
      ]);
      
      setRequestedItems(itemsData);
      storeSetItems(itemsData);
      setSamples(samplesData);
      setSuppliers(suppliersData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const updated = requestedItems.filter(i => i.id !== id);
      saveRequestedItems(updated);
      await requestedItemsService.deleteItem(id);
      storeDeleteItem(id);
      toast.success('Requested item deleted');
    } catch (e) {
      toast.error('Failed to delete item');
    }
  };

  const saveRequestedItems = useCallback((updatedItems: RequestedItem[]) => {
    setRequestedItems(updatedItems);
    localStorage.setItem('nbslims_requested_items', JSON.stringify(updatedItems));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      sampleId: '',
      quantity: 1,
      unit: 'ml',
      priority: 'medium',
      notes: '',
      supplierId: ''
    });
  }, []);

  const handleCreateRequestedItem = async () => {
    if (!formData.sampleId || !formData.supplierId) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const now = new Date();
      const itemPayload: Omit<RequestedItem, 'id'> = {
        sampleId: formData.sampleId,
        supplierId: formData.supplierId,
        quantity: formData.quantity,
        unit: formData.unit,
        priority: formData.priority,
        state: 'requested',
        requestedBy: user?.id || 'unknown',
        requestedAt: now,
        lastUpdatedBy: user?.id || 'unknown',
        lastUpdatedAt: now,
        notes: formData.notes,
        history: [{
          at: now,
          by: user?.id || 'unknown',
          to: 'requested',
          note: 'Item requested'
        }]
      };

      const newItem = await requestedItemsService.createItem(itemPayload);
      const updatedItems = [newItem, ...requestedItems];
      saveRequestedItems(updatedItems);
      storeAddItem(newItem);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Requested item created successfully');
    } catch (error) {
      toast.error('Failed to create requested item');
      console.error('Error creating requested item:', error);
    }
  };

  const handleEditClick = (item: RequestedItem) => {
    setSelectedItem(item);
    setFormData({
      sampleId: item.sampleId || '',
      quantity: item.quantity,
      unit: item.unit,
      priority: item.priority,
      notes: item.notes || '',
      supplierId: item.supplierId
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRequestedItem = async () => {
    if (!selectedItem || !formData.supplierId) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      // Persist
      await requestedItemsService.updateItem(selectedItem.id, {
        sampleId: formData.sampleId || selectedItem.sampleId,
        quantity: formData.quantity,
        unit: formData.unit,
        priority: formData.priority,
        notes: formData.notes,
        supplierId: formData.supplierId,
        lastUpdatedBy: user?.id || 'unknown',
        lastUpdatedAt: new Date()
      });

      const updatedItems = requestedItems.map(item => 
        item.id === selectedItem.id 
          ? { 
              ...item,
              sampleId: formData.sampleId || item.sampleId,
              quantity: formData.quantity,
              unit: formData.unit,
              priority: formData.priority,
              notes: formData.notes,
              supplierId: formData.supplierId,
              lastUpdatedBy: user?.id || 'unknown',
              lastUpdatedAt: new Date()
            }
          : item
      );
      
      saveRequestedItems(updatedItems);
      storeUpdateItem(selectedItem.id, {
        sampleId: formData.sampleId || selectedItem.sampleId,
        quantity: formData.quantity,
        unit: formData.unit,
        priority: formData.priority,
        notes: formData.notes,
        supplierId: formData.supplierId,
        lastUpdatedBy: user?.id || 'unknown',
        lastUpdatedAt: new Date()
      });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      toast.success('Requested item updated successfully');
    } catch (error) {
      toast.error('Failed to update requested item');
      console.error('Error updating requested item:', error);
    }
  };

  const handleStatusChange = (itemId: string, newState: RequestState) => {
    const updatedItems = requestedItems.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            state: newState,
            orderedAt: newState === 'ordered' ? new Date() : item.orderedAt,
            lastUpdatedAt: new Date(),
            lastUpdatedBy: user?.id || 'unknown'
          }
        : item
    );
    saveRequestedItems(updatedItems);
    requestedItemsService.moveItem(itemId, newState, user?.id || 'unknown').catch(() => {});
    storeMoveItem(itemId, newState, user?.id || 'unknown');
    toast.success('Status updated successfully');
  };

  const filteredItems = requestedItems.filter(item => {
    const sample = samples.find(s => s.id === item.sampleId);
    const supplier = suppliers.find(s => s.id === item.supplierId);
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (sample?.itemNameEN || '').toLowerCase().includes(q) ||
      (supplier?.name || '').toLowerCase().includes(q) ||
      (item.notes || '').toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || item.state === (statusFilter as RequestState);
    const matchesPriority = priorityFilter === 'all' || item.priority === (priorityFilter as ItemPriority);

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadgeColor = (state: RequestState) => {
    switch (state) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'to-be-ordered': return 'bg-blue-100 text-blue-800';
      case 'ordered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: ItemPriority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShoppingCart className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading requested items...</p>
        </div>
      </div>
    );
  }

  const renderRequestedItemForm = (isEdit = false) => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sampleId">Sample *</Label>
            <Select value={formData.sampleId} onValueChange={(value) => setFormData(prev => ({ ...prev, sampleId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select sample" />
              </SelectTrigger>
              <SelectContent>
                {samples.map(sample => (
                  <SelectItem key={sample.id} value={sample.id}>
                    {sample.itemNameEN} - #{sample.sampleNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="supplierId">Supplier *</Label>
            <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value as ItemUnit }))}>
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
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as ItemPriority }))}>
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
        </div>

        <div className="grid grid-cols-1 gap-4">

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes or special instructions"
            rows={3}
          />
        </div>
      </div>

      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdateRequestedItem : handleCreateRequestedItem}>
          {isEdit ? 'Update Request' : 'Create Request'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Requested Items</h1>
          <p className="text-gray-600">Manage sample requests and convert them to orders</p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8 px-3"
            >
              <Kanban className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
          
          {hasPermission('purchasing', 'create') && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle>Create New Request</DialogTitle>
                  <DialogDescription>
                    Add a new item request with supplier and pricing information
                  </DialogDescription>
                </DialogHeader>
                {renderRequestedItemForm(false)}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* View Mode Content */}
      {viewMode === 'kanban' ? (
        <div className="h-[calc(100vh-200px)]">
          <RequestedItemsBoard
            samples={samples.map(s => ({ id: s.id, itemNameEN: s.itemNameEN }))}
            suppliers={suppliers}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold">{requestedItems.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Requested</p>
                    <p className="text-2xl font-bold">{requestedItems.filter(i => i.state === 'requested').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">To Be Ordered</p>
                    <p className="text-2xl font-bold">{requestedItems.filter(i => i.state === 'to-be-ordered').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Ordered</p>
                    <p className="text-2xl font-bold">{requestedItems.filter(i => i.state === 'ordered').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search requests by item name, sample, or supplier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="to-be-ordered">To Be Ordered</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-48">
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requested Items ({filteredItems.length})</CardTitle>
              <CardDescription>
                Manage sample requests and track their progression to orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const groups: Record<string, RequestedItem[]> = {};
                for (const item of filteredItems) {
                  const key = item.supplierId || 'unknown';
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(item);
                }
                const canMoveToOrdered = (user?.role === 'Admin' || user?.role === 'Lab Lead');
                const allowedTransitions: Record<RequestState, RequestState[]> = {
                  'requested': ['requested', 'to-be-ordered'],
                  'to-be-ordered': canMoveToOrdered ? ['requested', 'to-be-ordered', 'ordered'] : ['requested', 'to-be-ordered'],
                  'ordered': ['ordered']
                };
                const humanize = (st: RequestState) => st === 'to-be-ordered' ? 'To Be Ordered' : st.charAt(0).toUpperCase() + st.slice(1);

                return (
                  <div className="space-y-6">
                    {Object.entries(groups).map(([supplierId, items]) => {
                      const supplier = suppliers.find((s: any) => s.id === supplierId);
                      return (
                        <div key={supplierId} className="space-y-3">
                          <GroupHeader
                            supplierId={supplierId}
                            supplierName={supplier?.name || 'Unknown Supplier'}
                            itemCount={items.length}
                            onCreatePODraft={() => console.log('Create PO for', supplierId)}
                            onViewSupplier={() => console.log('View supplier', supplierId)}
                          />
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Request ID</TableHead>
                                <TableHead>Sample</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map(item => {
                                const sample = samples.find(s => s.id === item.sampleId);
                                return (
                                  <TableRow key={item.id}>
                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{sample?.itemNameEN || 'Unknown Sample'}</p>
                                        {sample?.sampleNo && (
                                          <p className="text-xs text-gray-500">#{sample.sampleNo}</p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{item.quantity} {item.unit}</TableCell>
                                    <TableCell>
                                      <Badge className={getPriorityBadgeColor(item.priority)}>
                                        {item.priority}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={item.state}
                                        onValueChange={(value) => handleStatusChange(item.id, value as RequestState)}
                                      >
                                        <SelectTrigger className="w-44 capitalize">
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {allowedTransitions[item.state].map(st => (
                                            <SelectItem key={st} value={st}>
                                              {humanize(st)}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-500">
                                      {formatDistanceToNow(new Date(item.lastUpdatedAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        {hasPermission('purchasing', 'update') && (
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleEditClick(item)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        )}
                                        {hasPermission('purchasing', 'delete') && (
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDeleteItem(item.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Requested Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={() => {
        // Prevent closing on outside click - only close via explicit actions
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Requested Item</DialogTitle>
            <DialogDescription>
              Update requested item information
            </DialogDescription>
          </DialogHeader>
          {renderRequestedItemForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  );
};
