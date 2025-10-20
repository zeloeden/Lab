import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  Palette,
  Beaker,
  Hash,
  Tag,
  QrCode,
  Barcode
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { barcodeGenerator } from '@/lib/barcodeUtils';
import GlassSectionHeader from '@/components/ui/GlassSectionHeader';
import GlassCard from '@/components/ui/GlassCard';

interface RawMaterial {
  id: string;
  name: string;
  itemNameEN?: string; // Added for consistency with formula lookups
  type: 'raw_material' | 'color';
  colorCode?: string;
  colorName?: string;
  formula?: string;
  supplier?: string;
  price?: number;
  currency?: string; // Added currency field
  unit?: 'g' | 'kg' | 'ml' | 'L';
  notes?: string;
  // QR Code and Barcode fields
  qrCode?: string; // Base64 QR code image
  barcode?: string; // Barcode string
  barcodeImage?: string; // Base64 barcode image
  internalCode?: string; // Auto-generated internal code
  createdAt: string;
  updatedAt: string;
}

export const RawMaterials: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [activeTab, setActiveTab] = useState('materials');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'raw_material' as 'raw_material' | 'color',
    colorCode: '',
    colorName: '',
    formula: '',
    supplier: '',
    price: 0,
    currency: 'USD',
    unit: 'ml' as 'g' | 'kg' | 'ml' | 'L',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem('nbslims_raw_materials');
      const data = stored ? JSON.parse(stored) : [];
      setMaterials(data);
    } catch (error) {
      console.error('Error loading raw materials:', error);
      toast.error('Failed to load raw materials');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate internal code for raw materials
  const generateInternalCode = (): string => {
    const count = materials.length + 1;
    return `RM${count.toString().padStart(3, '0')}`;
  };

  // Generate QR code and barcode for raw material
  const generateRawMaterialQRBarcode = async (material: RawMaterial): Promise<{
    qrCode: string;
    barcode: string;
    barcodeImage: string;
  }> => {
    try {
      // Create QR data object
      const qrDataObject = {
        id: material.id,
        internalCode: material.internalCode,
        name: material.name,
        type: material.type,
        supplier: material.supplier || 'N/A',
        price: material.price || 0,
        currency: material.currency || 'USD',
        unit: material.unit || 'ml',
        createdAt: material.createdAt,
        url: `${window.location.origin}/raw-materials/${material.id}`
      };

      const qrDataString = JSON.stringify(qrDataObject);

      // Generate QR code image
      const qrImageBase64 = await QRCode.toDataURL(qrDataString, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Generate barcode string
      const barcodeString = `RM${material.internalCode?.replace('RM', '') || material.id.slice(-3)}`;

      // Generate barcode image
      const barcodeImage = await barcodeGenerator.generateBarcode(barcodeString, {
        width: 300,
        height: 100,
        format: 'CODE128',
        displayValue: true,
        fontSize: 12
      });

      return {
        qrCode: qrImageBase64,
        barcode: barcodeString,
        barcodeImage
      };
    } catch (error) {
      console.error('Error generating QR/barcode for raw material:', error);
      throw new Error('Failed to generate QR code and barcode');
    }
  };

  const handleCreate = async () => {
    try {
      const internalCode = generateInternalCode();
      const newMaterial: RawMaterial = {
        id: uuidv4(),
        ...formData,
        // Ensure both name and itemNameEN are set for consistent lookup
        itemNameEN: formData.name,
        name: formData.name,
        internalCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Generate QR code and barcode
      try {
        const qrBarcodeResult = await generateRawMaterialQRBarcode(newMaterial);
        newMaterial.qrCode = qrBarcodeResult.qrCode;
        newMaterial.barcode = qrBarcodeResult.barcode;
        newMaterial.barcodeImage = qrBarcodeResult.barcodeImage;
      } catch (error) {
        console.error('Error generating QR code and barcode:', error);
        toast.error('Raw material created but failed to generate QR code and barcode');
      }

      const updatedMaterials = [...materials, newMaterial];
      setMaterials(updatedMaterials);
      localStorage.setItem('nbslims_raw_materials', JSON.stringify(updatedMaterials));
      
      toast.success('Raw material created successfully with QR code and barcode');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating raw material:', error);
      toast.error('Failed to create raw material');
    }
  };

  const handleUpdate = async () => {
    if (!selectedMaterial) return;

    try {
      const updatedMaterials = materials.map(m => 
        m.id === selectedMaterial.id 
          ? { 
              ...m, 
              ...formData, 
              // Ensure both name and itemNameEN are synced
              itemNameEN: formData.name,
              name: formData.name,
              updatedAt: new Date().toISOString() 
            }
          : m
      );
      
      setMaterials(updatedMaterials);
      localStorage.setItem('nbslims_raw_materials', JSON.stringify(updatedMaterials));
      
      toast.success('Raw material updated successfully');
      setIsEditDialogOpen(false);
      setSelectedMaterial(null);
      resetForm();
    } catch (error) {
      console.error('Error updating raw material:', error);
      toast.error('Failed to update raw material');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedMaterials = materials.filter(m => m.id !== id);
      setMaterials(updatedMaterials);
      localStorage.setItem('nbslims_raw_materials', JSON.stringify(updatedMaterials));
      
      toast.success('Raw material deleted successfully');
    } catch (error) {
      console.error('Error deleting raw material:', error);
      toast.error('Failed to delete raw material');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'raw_material',
      colorCode: '',
      colorName: '',
      formula: '',
      supplier: '',
      price: 0,
      currency: 'USD',
      unit: 'ml',
      notes: ''
    });
  };

  const handleEditClick = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setFormData({
      name: material.name,
      type: material.type,
      colorCode: material.colorCode || '',
      colorName: material.colorName || '',
      formula: material.formula || '',
      supplier: material.supplier || '',
      price: material.price || 0,
      currency: material.currency || 'USD',
      unit: material.unit || 'ml',
      notes: material.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setIsViewDialogOpen(true);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = (material.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.colorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || material.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const rawMaterials = filteredMaterials.filter(m => m.type === 'raw_material');
  const colors = filteredMaterials.filter(m => m.type === 'color');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading raw materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raw Materials</h1>
          <p className="text-muted-foreground">
            Manage raw materials and colors for your formulations
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Raw Material
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search materials, colors, or suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="raw_material">Raw Materials</SelectItem>
                  <SelectItem value="color">Colors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">Raw Materials ({rawMaterials.length})</TabsTrigger>
          <TabsTrigger value="colors">Color ({colors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <GlassCard
            icon={<Package className="h-5 w-5" />}
            title="Raw Materials"
            subtitle={`${rawMaterials.length} materials available`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.supplier || 'N/A'}</TableCell>
                    <TableCell>
                      {material.price ? `${material.currency || 'USD'} ${material.price.toFixed(2)}/${material.unit || 'unit'}` : 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{material.notes || 'N/A'}</TableCell>
                    <TableCell>{new Date(material.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClick(material)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {material.qrCode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Open QR code in new window
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(`
                                  <html>
                                    <head><title>QR Code - ${material.name}</title></head>
                                    <body style="text-align: center; padding: 20px;">
                                      <h2>${material.name}</h2>
                                      <img src="${material.qrCode}" alt="QR Code" style="max-width: 300px;">
                                      <p>Internal Code: ${material.internalCode || 'N/A'}</p>
                                      <p>Barcode: ${material.barcode || 'N/A'}</p>
                                    </body>
                                  </html>
                                `);
                              }
                            }}
                            title="View QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                        {material.barcode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Copy barcode to clipboard
                              navigator.clipboard.writeText(material.barcode || '');
                              toast.success('Barcode copied to clipboard');
                            }}
                            title="Copy Barcode"
                          >
                            <Barcode className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(material.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <GlassCard
            icon={<Palette className="h-5 w-5" />}
            title="Color"
            subtitle={`${colors.length} colors available`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color Name</TableHead>
                  <TableHead>Color Code</TableHead>
                  <TableHead>Formula</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colors.map((color) => (
                  <TableRow key={color.id}>
                    <TableCell className="font-medium">{color.colorName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color.colorCode }}
                        />
                        {color.colorCode}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{color.formula || 'N/A'}</TableCell>
                    <TableCell>{color.supplier || 'N/A'}</TableCell>
                    <TableCell>
                      {color.price ? `$${color.price.toFixed(2)}/${color.unit || 'unit'}` : 'N/A'}
                    </TableCell>
                    <TableCell>{new Date(color.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClick(color)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(color)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(color.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent 
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit Raw Material' : 'Create New Raw Material'}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? 'Update the raw material details' : 'Add a new raw material or color to your inventory'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter material name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value: 'raw_material' | 'color') => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'color' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="colorName">Color Name *</Label>
                    <Input
                      id="colorName"
                      value={formData.colorName}
                      onChange={(e) => handleInputChange('colorName', e.target.value)}
                      placeholder="Enter color name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="colorCode">Color Code</Label>
                    <Input
                      id="colorCode"
                      value={formData.colorCode}
                      onChange={(e) => handleInputChange('colorCode', e.target.value)}
                      placeholder="#FF0000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="formula">Color Formula</Label>
                  <Textarea
                    id="formula"
                    value={formData.formula}
                    onChange={(e) => handleInputChange('formula', e.target.value)}
                    placeholder="Enter color formula if available"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <Label htmlFor="price">Price per Unit</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value: string) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="IQD">IQD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value: 'g' | 'kg' | 'ml' | 'L') => handleInputChange('unit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={isEditDialogOpen ? handleUpdate : handleCreate}>
              {isEditDialogOpen ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent 
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Raw Material Details</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-lg">{selectedMaterial.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <Badge variant="outline">
                    {selectedMaterial.type === 'raw_material' ? 'Raw Material' : 'Color'}
                  </Badge>
                </div>
              </div>

              {selectedMaterial.type === 'color' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Color Name</Label>
                      <p className="text-lg">{selectedMaterial.colorName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Color Code</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: selectedMaterial.colorCode }}
                        />
                        <span>{selectedMaterial.colorCode}</span>
                      </div>
                    </div>
                  </div>
                  {selectedMaterial.formula && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Formula</Label>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedMaterial.formula}</p>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Supplier</Label>
                  <p>{selectedMaterial.supplier || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Price</Label>
                  <p>{selectedMaterial.price ? `${selectedMaterial.currency || 'USD'} ${selectedMaterial.price.toFixed(2)}/${selectedMaterial.unit || 'unit'}` : 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <p>{new Date(selectedMaterial.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Internal Code</Label>
                  <p>{selectedMaterial.internalCode || 'N/A'}</p>
                </div>
              </div>

              {/* QR Code and Barcode Section */}
              {(selectedMaterial.qrCode || selectedMaterial.barcode) && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-600 mb-3 block">QR Code & Barcode</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedMaterial.qrCode && (
                      <div className="text-center">
                        <Label className="text-xs text-gray-500 mb-2 block">QR Code</Label>
                        <img 
                          src={selectedMaterial.qrCode} 
                          alt="QR Code" 
                          className="w-24 h-24 mx-auto border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">Scan for details</p>
                      </div>
                    )}
                    {selectedMaterial.barcodeImage && (
                      <div className="text-center">
                        <Label className="text-xs text-gray-500 mb-2 block">Barcode</Label>
                        <img 
                          src={selectedMaterial.barcodeImage} 
                          alt="Barcode" 
                          className="h-16 mx-auto border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">{selectedMaterial.barcode}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedMaterial.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedMaterial.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
