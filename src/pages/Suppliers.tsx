import React, { useState, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { countriesData, getCitiesByCountry } from '@/lib/countriesData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Star,
  DollarSign,
  Package,
  Calendar
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  code?: string; // Supplier index for internal reference
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'inactive';
  rating: number;
  totalOrders: number;
  lastOrderDate: Date;
  categories: string[];
  paymentTerms: string;
  deliveryTime: string;
}

const initialSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Lab Equipment Co.',
    code: 'LAB001',
    contactPerson: 'John Smith',
    email: 'john@labequipment.com',
    phone: '+1-555-0101',
    address: '123 Science Ave',
    city: 'Boston',
    country: 'USA',
    status: 'active',
    rating: 4.5,
    totalOrders: 45,
    lastOrderDate: new Date('2024-01-15'),
    categories: ['Equipment', 'Glassware'],
    paymentTerms: 'Net 30',
    deliveryTime: '5-7 days',
  },
  {
    id: '2',
    name: 'Chemical Supplies Inc.',
    code: 'CHEM002',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@chemsupplies.com',
    phone: '+1-555-0102',
    address: '456 Chemical Blvd',
    city: 'Chicago',
    country: 'USA',
    status: 'active',
    rating: 4.2,
    totalOrders: 32,
    lastOrderDate: new Date('2024-01-18'),
    categories: ['Chemicals', 'Reagents'],
    paymentTerms: 'Net 15',
    deliveryTime: '3-5 days',
  }
];

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    // Load suppliers from localStorage on component mount
    const storedSuppliers = localStorage.getItem('nbslims_suppliers');
    if (storedSuppliers) {
      try {
        const parsedSuppliers = JSON.parse(storedSuppliers, (key, value) => {
          // Convert date strings back to Date objects
          if (key === 'lastOrderDate' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
        
        // Validate and fix supplier data to ensure all required fields exist
        return parsedSuppliers.map((supplier: any) => ({
          id: supplier.id || `sup-${Date.now()}-${Math.random()}`,
          name: supplier.name || 'Unknown Supplier',
          code: supplier.code || '',
          contactPerson: supplier.contactPerson || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          city: supplier.city || '',
          country: supplier.country || '',
          status: supplier.status || 'active',
          rating: supplier.rating || 0,
          totalOrders: supplier.totalOrders || 0,
          lastOrderDate: supplier.lastOrderDate || new Date(),
          categories: supplier.categories || [],
          paymentTerms: supplier.paymentTerms || 'Net 30',
          deliveryTime: supplier.deliveryTime || '5-7 days'
        }));
      } catch (error) {
        console.error('Error parsing suppliers from localStorage:', error);
        return initialSuppliers;
      }
    }
    return initialSuppliers;
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Save suppliers to localStorage whenever suppliers state changes
  React.useEffect(() => {
    localStorage.setItem('nbslims_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);
  
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    categories: ''
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddSupplier = useCallback(() => {
    if (!newSupplier.name || !newSupplier.contactPerson || !newSupplier.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateEmail(newSupplier.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const supplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplier.name,
      code: newSupplier.code || newSupplier.name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-3),
      contactPerson: newSupplier.contactPerson,
      email: newSupplier.email,
      phone: newSupplier.phone,
      address: newSupplier.address,
      city: newSupplier.city,
      country: newSupplier.country,
      status: 'active',
      rating: 0,
      totalOrders: 0,
      lastOrderDate: new Date(),
      categories: newSupplier.categories.split(',').map(cat => cat.trim()).filter(cat => cat),
      paymentTerms: 'Net 30', // Default value
      deliveryTime: '5-7 days' // Default value
    };

    setSuppliers(prev => [...prev, supplier]);
    
    // Trigger event to notify other components
    window.dispatchEvent(new CustomEvent('supplierUpdated', { 
      detail: { supplierId: supplier.id, field: 'created', value: supplier }
    }));
    
    setNewSupplier({
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      categories: ''
    });
    setIsAddDialogOpen(false);
    setActiveTab('basic'); // Reset to basic tab
    toast.success('Supplier added successfully');
  }, [newSupplier]);

  const handleEditSupplier = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteSupplier = useCallback((supplierId: string) => {
    setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
    toast.success('Supplier deleted successfully');
  }, []);

  const handleStatusChange = useCallback((supplierId: string, newStatus: 'active' | 'inactive') => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === supplierId ? { ...supplier, status: newStatus } : supplier
    ));
    toast.success('Supplier status updated');
  }, []);



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Suppliers</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={() => {
          // Prevent closing on outside click - only close via explicit actions
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Add a new supplier with contact information and pricing details.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Supplier Index</Label>
                    <Input
                      id="code"
                      value={newSupplier.code}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Enter supplier index (e.g., EXP, G, CHEM)"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={newSupplier.contactPerson}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categories">Categories</Label>
                  <Input
                    id="categories"
                    value={newSupplier.categories}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, categories: e.target.value }))}
                    placeholder="Enter categories (comma separated)"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={newSupplier.country}
                      onValueChange={(value) => {
                        setNewSupplier(prev => ({ ...prev, country: value, city: '' })); // Reset city when country changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countriesData.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Select
                      value={newSupplier.city}
                      onValueChange={(value) => setNewSupplier(prev => ({ ...prev, city: value }))}
                      disabled={!newSupplier.country}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={newSupplier.country ? "Select city" : "Select country first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getCitiesByCountry(newSupplier.country).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setActiveTab('basic');
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddSupplier}>
                Add Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.reduce((sum, s) => sum + s.totalOrders, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1) : '0.0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers List</CardTitle>
          <CardDescription>
            Manage your laboratory suppliers and their information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-lg">{supplier.name}</h3>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status ? supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1) : 'Unknown'}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{(supplier.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={supplier.status}
                      onValueChange={(value: 'active' | 'inactive') => handleStatusChange(supplier.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSupplier(supplier)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSupplier(supplier.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium">Contact:</span>
                      <p className="text-gray-600">{supplier.contactPerson || 'N/A'}</p>
                      <p className="text-gray-600">{supplier.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium">Phone:</span>
                      <p className="text-gray-600">{supplier.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium">Location:</span>
                      <p className="text-gray-600">{supplier.city || 'N/A'}, {supplier.country || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium">Last Order:</span>
                      <p className="text-gray-600">{supplier.lastOrderDate ? formatDate(supplier.lastOrderDate) : 'No orders'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      {supplier.totalOrders || 0} orders
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(supplier.categories || []).map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={() => {
        // Prevent closing on outside click - only close via explicit actions
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information and pricing details.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Company Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingSupplier?.name || ''}
                    onChange={(e) => setEditingSupplier(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Supplier Index</Label>
                  <Input
                    id="edit-code"
                    value={editingSupplier?.code || ''}
                    onChange={(e) => setEditingSupplier(prev => prev ? { ...prev, code: e.target.value } : null)}
                    placeholder="Enter supplier index (e.g., EXP, G, CHEM)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contactPerson">Contact Person *</Label>
                  <Input
                    id="edit-contactPerson"
                    value={editingSupplier?.contactPerson || ''}
                    onChange={(e) => setEditingSupplier(prev => prev ? { ...prev, contactPerson: e.target.value } : null)}
                    placeholder="Enter contact person name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-categories">Categories</Label>
                <Input
                  id="edit-categories"
                  value={editingSupplier?.categories.join(', ') || ''}
                  onChange={(e) => setEditingSupplier(prev => prev ? { ...prev, categories: e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat) } : null)}
                  placeholder="Enter categories (comma separated)"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingSupplier?.email || ''}
                    onChange={(e) => setEditingSupplier(prev => prev ? { ...prev, email: e.target.value } : null)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editingSupplier?.phone || ''}
                    onChange={(e) => setEditingSupplier(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editingSupplier?.address || ''}
                  onChange={(e) => setEditingSupplier(prev => prev ? { ...prev, address: e.target.value } : null)}
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country</Label>
                  <Select
                    value={editingSupplier?.country || ''}
                    onValueChange={(value) => {
                      setEditingSupplier(prev => prev ? { ...prev, country: value, city: '' } : null); // Reset city when country changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countriesData.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Select
                    value={editingSupplier?.city || ''}
                    onValueChange={(value) => setEditingSupplier(prev => prev ? { ...prev, city: value } : null)}
                    disabled={!editingSupplier?.country}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={editingSupplier?.country ? "Select city" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {editingSupplier?.country && getCitiesByCountry(editingSupplier.country).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingSupplier(null);
              setActiveTab('basic');
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingSupplier) {
                setSuppliers(prev => prev.map(supplier => 
                  supplier.id === editingSupplier.id ? editingSupplier : supplier
                ));
                
                // Trigger event to notify other components
                window.dispatchEvent(new CustomEvent('supplierUpdated', { 
                  detail: { supplierId: editingSupplier.id, field: 'updated', value: editingSupplier }
                }));
                
                setIsEditDialogOpen(false);
                setEditingSupplier(null);
                setActiveTab('basic');
                toast.success('Supplier updated successfully');
              }
            }}>
              Update Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}