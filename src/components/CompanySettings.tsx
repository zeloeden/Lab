import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  Save,
  X
} from 'lucide-react';
import { CompanySettings } from '@/lib/types';
import { companyService } from '@/services/companyService';
import { toast } from 'sonner';

interface CompanySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanySettingsComponent: React.FC<CompanySettingsProps> = ({
  isOpen,
  onClose
}) => {
  const [companies, setCompanies] = useState<CompanySettings[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanySettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    initials: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    }
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setFormData({ name: '', initials: '' });
    setShowForm(true);
  };

  const handleEditCompany = (company: CompanySettings) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      initials: company.initials
    });
    setShowForm(true);
  };

  const handleSaveCompany = async () => {
    if (!formData.name.trim() || !formData.initials.trim()) {
      toast.error('Company name and initials are required');
      return;
    }

    setLoading(true);
    try {
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.id, {
          name: formData.name,
          initials: formData.initials
        });
        toast.success('Company updated successfully');
      } else {
        await companyService.createCompany({
          name: formData.name,
          initials: formData.initials
        });
        toast.success('Company created successfully');
      }
      
      await loadCompanies();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company?')) {
      return;
    }

    try {
      await companyService.deleteCompany(companyId);
      await loadCompanies();
      toast.success('Company deleted successfully');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Settings
          </DialogTitle>
          <DialogDescription>
            Manage company information and initials for sample numbering
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Companies</h3>
            <Button onClick={handleAddCompany}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Initials</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {company.initials}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(company.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCompany(company)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCompany(company.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>

        {/* Company Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? 'Edit Company' : 'Add Company'}
              </DialogTitle>
              <DialogDescription>
                {editingCompany 
                  ? 'Update company information and initials'
                  : 'Add a new company to the system'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="company-initials">Company Initials</Label>
                <Input
                  id="company-initials"
                  value={formData.initials}
                  onChange={(e) => setFormData(prev => ({ ...prev, initials: e.target.value.toUpperCase() }))}
                  placeholder="Enter company initials (e.g., EXP, G)"
                  maxLength={10}
                />
                <p className="text-sm text-gray-500 mt-1">
                  These initials will be used in sample numbering (e.g., EXP001, G002)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCompany} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingCompany ? 'Update' : 'Create'} Company
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

