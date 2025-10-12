import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Settings
} from 'lucide-react';
import { Sample, SampleStatus } from '@/lib/types';
import { sampleService } from '@/services/sampleService';
import { auditService } from '@/lib/auditService';

interface SampleManagementProps {
  onSampleSelect?: (sample: Sample) => void;
}

export const SampleManagement: React.FC<SampleManagementProps> = ({ onSampleSelect }) => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SampleStatus | 'all'>('all');
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<SampleStatus>('Untested');
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    loadSamples();
  }, []);

  useEffect(() => {
    filterSamples();
  }, [samples, searchQuery, statusFilter]);

  const loadSamples = async () => {
    setLoading(true);
    try {
      const allSamples = await sampleService.getAllSamples();
      setSamples(allSamples);
    } catch (error) {
      console.error('Error loading samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSamples = () => {
    let filtered = samples;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sample =>
        sample.itemNameEN.toLowerCase().includes(query) ||
        sample.itemNameAR.toLowerCase().includes(query) ||
        sample.sampleNo.toString().includes(query) ||
        sample.batchNumber.toLowerCase().includes(query) ||
        sample.patchNumber?.toLowerCase().includes(query) ||
        sample.supplierCode?.toLowerCase().includes(query) ||
        sample.barcode?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sample => sample.status === statusFilter);
    }

    setFilteredSamples(filtered);
  };

  const handleStatusChange = async (sample: Sample, newStatus: SampleStatus, notes?: string) => {
    try {
      await sampleService.updateSample(sample.id, { 
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Log the status change
      await auditService.logActivity(
        'UPDATE', 
        'sample', 
        sample.id, 
        `Changed status from ${sample.status} to ${newStatus}`,
        { 
          oldStatus: sample.status, 
          newStatus, 
          notes 
        }
      );

      await loadSamples();
      setShowStatusDialog(false);
      setSelectedSample(null);
    } catch (error) {
      console.error('Error updating sample status:', error);
    }
  };

  const openStatusDialog = (sample: Sample) => {
    setSelectedSample(sample);
    setNewStatus(sample.status);
    setStatusNotes('');
    setShowStatusDialog(true);
  };

  const getStatusColor = (status: SampleStatus) => {
    switch (status) {
      case 'Untested':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Testing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: SampleStatus) => {
    switch (status) {
      case 'Untested':
        return <AlertCircle className="h-4 w-4" />;
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Testing':
        return <Settings className="h-4 w-4" />;
      case 'Accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusDescription = (status: SampleStatus) => {
    switch (status) {
      case 'Untested':
        return 'Sample created but not yet tested';
      case 'Pending':
        return 'Sample is waiting for testing';
      case 'Testing':
        return 'Sample is currently being tested';
      case 'Accepted':
        return 'Sample has passed all tests';
      case 'Rejected':
        return 'Sample has failed testing';
      default:
        return '';
    }
  };

  const getNextStatusOptions = (currentStatus: SampleStatus): SampleStatus[] => {
    switch (currentStatus) {
      case 'Untested':
        return ['Pending', 'Testing', 'Accepted', 'Rejected'];
      case 'Pending':
        return ['Testing', 'Accepted', 'Rejected'];
      case 'Testing':
        return ['Accepted', 'Rejected', 'Pending'];
      case 'Accepted':
        return ['Testing', 'Rejected'];
      case 'Rejected':
        return ['Testing', 'Pending'];
      default:
        return ['Pending', 'Testing', 'Accepted', 'Rejected'];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sample Management</h2>
          <p className="text-gray-600">Manage sample status and testing workflow</p>
        </div>
        <Button onClick={loadSamples} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Samples</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, number, batch, patch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SampleStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Untested">Untested</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Testing">Testing</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredSamples.length} of {samples.length} samples
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Samples Table */}
      <Card>
        <CardHeader>
          <CardTitle>Samples List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample #</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Patch #</TableHead>
                  <TableHead>Supplier Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.map((sample) => (
                  <TableRow key={sample.id}>
                    <TableCell className="font-mono font-semibold">
                      #{sample.sampleNo}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sample.itemNameEN}</div>
                        <div className="text-sm text-gray-500" dir="rtl">
                          {sample.itemNameAR}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {sample.batchNumber}
                    </TableCell>
                    <TableCell className="font-mono">
                      {sample.patchNumber || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {sample.supplierCode || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sample.status)}
                        <Badge className={getStatusColor(sample.status)}>
                          {sample.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {sample.purpose}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(sample.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSampleSelect?.(sample)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStatusDialog(sample)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Sample Status</DialogTitle>
            <DialogDescription>
              Update the status for Sample #{selectedSample?.sampleNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSample && (
            <div className="space-y-4">
              <div>
                <Label>Current Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(selectedSample.status)}
                  <Badge className={getStatusColor(selectedSample.status)}>
                    {selectedSample.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getStatusDescription(selectedSample.status)}
                </p>
              </div>

              <div>
                <Label htmlFor="new-status">New Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as SampleStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getNextStatusOptions(selectedSample.status).map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          {status}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 mt-1">
                  {getStatusDescription(newStatus)}
                </p>
              </div>

              <div>
                <Label htmlFor="status-notes">Notes (Optional)</Label>
                <Textarea
                  id="status-notes"
                  placeholder="Add notes about the status change..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowStatusDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedSample, newStatus, statusNotes)}
                  disabled={newStatus === selectedSample.status}
                >
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
