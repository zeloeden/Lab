import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, Clock, CheckCircle, ShoppingCart, DollarSign, Calendar } from 'lucide-react';

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  supplier?: string;
  status: 'requested' | 'to-be-ordered' | 'ordered';
  priority: 'low' | 'medium' | 'high';
  requestedBy: string;
  requestedAt: Date;
  updatedAt: Date;
  notes: string;
  justification: string;
  department: string;
  approvedBy?: string;
  approvedAt?: Date;
  orderedAt?: Date;
  expectedDelivery?: Date;
}

const initialRequests: PurchaseRequest[] = [
  {
    id: 'req-001',
    requestNumber: 'REQ-2024-001',
    itemName: 'Laboratory pH Meter',
    description: 'Digital pH meter with calibration solutions',
    quantity: 2,
    unit: 'units',
    estimatedCost: 450.00,
    supplier: 'Scientific Equipment Ltd.',
    status: 'ordered',
    priority: 'high',
    requestedBy: 'Dr. Sarah Johnson',
    requestedAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-18'),
    notes: 'Urgent replacement for broken equipment',
    justification: 'Current pH meter is malfunctioning, affecting daily testing operations',
    department: 'Quality Control',
    approvedBy: 'Lab Manager',
    approvedAt: new Date('2024-01-16'),
    orderedAt: new Date('2024-01-18'),
    expectedDelivery: new Date('2024-01-25')
  },
  {
    id: 'req-002',
    requestNumber: 'REQ-2024-002',
    itemName: 'Chemical Reagents Set',
    description: 'Standard reagents for water quality testing',
    quantity: 1,
    unit: 'set',
    estimatedCost: 275.50,
    supplier: 'ChemSupply Co.',
    status: 'to-be-ordered',
    priority: 'medium',
    requestedBy: 'Mike Davis',
    requestedAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-19'),
    notes: 'Monthly reagent replenishment',
    justification: 'Running low on essential reagents for routine testing',
    department: 'Laboratory',
    approvedBy: 'Lab Manager',
    approvedAt: new Date('2024-01-19')
  },
  {
    id: 'req-003',
    requestNumber: 'REQ-2024-003',
    itemName: 'Safety Equipment',
    description: 'Lab coats, safety goggles, and gloves',
    quantity: 50,
    unit: 'pieces',
    estimatedCost: 180.00,
    status: 'requested',
    priority: 'medium',
    requestedBy: 'Anna Wilson',
    requestedAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    notes: 'Quarterly safety equipment order',
    justification: 'Maintaining adequate safety equipment inventory',
    department: 'Safety'
  }
];

const loadPurchaseRequests = (): PurchaseRequest[] => {
  try {
    const stored = localStorage.getItem('nbslims_purchase_requests');
    if (stored) {
      return JSON.parse(stored, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    }
  } catch (error) {
    console.error('Error loading purchase requests from localStorage:', error);
  }
  return initialRequests;
};

const savePurchaseRequests = (requests: PurchaseRequest[]) => {
  try {
    localStorage.setItem('nbslims_purchase_requests', JSON.stringify(requests));
  } catch (error) {
    console.error('Error saving purchase requests to localStorage:', error);
  }
};

export function Purchasing() {
  const { user, hasPermission } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>(loadPurchaseRequests);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [newRequest, setNewRequest] = useState({
    itemName: '',
    description: '',
    quantity: 1,
    unit: 'units',
    estimatedCost: 0,
    supplier: '',
    priority: 'medium' as const,
    notes: '',
    justification: '',
    department: ''
  });

  useEffect(() => {
    savePurchaseRequests(requests);
  }, [requests]);

  const canCreateRequest = hasPermission('purchasing', 'create');
  const canUpdateRequest = hasPermission('purchasing', 'update');
  const canDeleteRequest = hasPermission('purchasing', 'delete');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'to-be-ordered': return 'bg-blue-100 text-blue-800';
      case 'ordered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested': return <Clock className="h-4 w-4" />;
      case 'to-be-ordered': return <Package className="h-4 w-4" />;
      case 'ordered': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const resetForm = useCallback(() => {
    setNewRequest({
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'units',
      estimatedCost: 0,
      supplier: '',
      priority: 'medium',
      notes: '',
      justification: '',
      department: ''
    });
  }, []);

  const handleAddRequest = useCallback(() => {
    if (!newRequest.itemName.trim() || !newRequest.justification.trim()) {
      toast.error('Please fill in item name and justification');
      return;
    }

    const request: PurchaseRequest = {
      ...newRequest,
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestNumber: `REQ-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`,
      status: 'requested',
      requestedBy: user?.fullName || 'Unknown User',
      requestedAt: new Date(),
      updatedAt: new Date()
    };

    setRequests(prev => [request, ...prev]);
    resetForm();
    setIsAddDialogOpen(false);
    toast.success('Purchase request created successfully');
  }, [newRequest, requests.length, user, resetForm]);

  const handleStatusChange = useCallback((requestId: string, newStatus: string) => {
    setRequests(prev => prev.map(request => {
      if (request.id === requestId) {
        const updatedRequest = { 
          ...request, 
          status: newStatus as any, 
          updatedAt: new Date() 
        };

        // Set timestamps based on status
        if (newStatus === 'to-be-ordered' && !request.approvedAt) {
          updatedRequest.approvedBy = user?.fullName || 'System';
          updatedRequest.approvedAt = new Date();
        } else if (newStatus === 'ordered' && !request.orderedAt) {
          updatedRequest.orderedAt = new Date();
          updatedRequest.expectedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        }

        return updatedRequest;
      }
      return request;
    }));
    toast.success('Request status updated successfully');
  }, [user]);

  const handleDeleteRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.filter(request => request.id !== requestId));
    toast.success('Purchase request deleted successfully');
  }, []);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate statistics
  const totalRequests = requests.length;
  const requestedCount = requests.filter(r => r.status === 'requested').length;
  const toBeOrderedCount = requests.filter(r => r.status === 'to-be-ordered').length;
  const orderedCount = requests.filter(r => r.status === 'ordered').length;
  const totalEstimatedCost = requests.reduce((sum, r) => sum + r.estimatedCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchasing Management</h1>
          <p className="text-gray-600">Manage purchase requests through the workflow: Requested → To Be Ordered → Ordered</p>
        </div>
        {canCreateRequest && (
          <Dialog open={isAddDialogOpen} onOpenChange={() => {
            // Prevent closing on outside click - only close via explicit actions
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Purchase Request</DialogTitle>
                <DialogDescription>
                  Submit a new purchase request for laboratory supplies and equipment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="itemName">Item Name *</Label>
                    <Input
                      id="itemName"
                      value={newRequest.itemName}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, itemName: e.target.value }))}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newRequest.department}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter department"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter item description"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={newRequest.quantity}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={newRequest.unit} onValueChange={(value) => setNewRequest(prev => ({ ...prev, unit: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="L">Liter</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="sets">Sets</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {hasPermission('purchasing', 'view_costs') && (
                    <div>
                      <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newRequest.estimatedCost}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier">Preferred Supplier</Label>
                    <Input
                      id="supplier"
                      value={newRequest.supplier}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Enter supplier name (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newRequest.priority} onValueChange={(value: any) => setNewRequest(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="justification">Justification *</Label>
                  <Textarea
                    id="justification"
                    value={newRequest.justification}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, justification: e.target.value }))}
                    placeholder="Explain why this purchase is necessary"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={newRequest.notes}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddRequest}>
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{totalRequests}</p>
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
                <p className="text-2xl font-bold">{requestedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">To Be Ordered</p>
                <p className="text-2xl font-bold">{toBeOrderedCount}</p>
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
                <p className="text-2xl font-bold">{orderedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {hasPermission('purchasing', 'view_costs') && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalEstimatedCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests by item name, description, or requester..."
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Requests ({filteredRequests.length})</CardTitle>
          <CardDescription>
            Track purchase requests through the workflow: Requested → To Be Ordered → Ordered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Quantity</TableHead>
                {hasPermission('purchasing', 'view_costs') && <TableHead>Estimated Cost</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.itemName}</p>
                      {request.description && (
                        <p className="text-sm text-gray-500">{request.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{request.quantity} {request.unit}</TableCell>
                  {hasPermission('purchasing', 'view_costs') && (
                    <TableCell>{formatCurrency(request.estimatedCost)}</TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <Badge className={getStatusColor(request.status)}>
                        {request.status === 'to-be-ordered' ? 'To Be Ordered' : 
                         request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.requestedBy}</TableCell>
                  <TableCell>{formatDate(request.requestedAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canUpdateRequest && (
                        <Select
                          value={request.status}
                          onValueChange={(value) => handleStatusChange(request.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="requested">Requested</SelectItem>
                            <SelectItem value="to-be-ordered">To Be Ordered</SelectItem>
                            <SelectItem value="ordered">Ordered</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {canDeleteRequest && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteRequest(request.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}