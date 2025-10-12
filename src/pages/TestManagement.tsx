import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Icon } from '@/components/Icon';
import { 
  TestTube, 
  Beaker, 
  FlaskConical, 
  CheckCircle, 
  Trash2, 
  Percent, 
  Filter, 
  Search, 
  Clock, 
  AlertCircle, 
  Tag,
  Microscope,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Eye
} from 'lucide-react';
import { 
  Test, 
  PersonalUseTest, 
  FormulaEntry, 
  TestResult, 
  TestStatus,
  FormulaStatus,
  Sample
} from '@/lib/types';
import { notificationService } from '@/services/notificationService';
import { formatTo12Hour, formatForDateTimeInput } from '@/lib/dateUtils';
import { customDataService } from '@/services/customDataService';
import { getFieldOptions } from '@/lib/customFieldsUtils';

// Mock services
const testService = {
  getAllTests: async () => {
    const stored = localStorage.getItem('nbslims_tests');
    if (!stored) return [];
    
    // Parse and convert date strings back to Date objects
    const tests = JSON.parse(stored);
    return tests.map((test: any) => ({
      ...test,
      date: test.date ? new Date(test.date) : new Date(),
      dueDate: test.dueDate ? new Date(test.dueDate) : undefined,
      createdAt: test.createdAt ? new Date(test.createdAt) : new Date(),
      updatedAt: test.updatedAt ? new Date(test.updatedAt) : new Date(),
      personalUseData: test.personalUseData ? {
        ...test.personalUseData,
        date: test.personalUseData.date ? new Date(test.personalUseData.date) : undefined
      } : undefined,
      brandedAs: test.brandedAs ? {
        ...test.brandedAs,
        createdAt: test.brandedAs.createdAt ? new Date(test.brandedAs.createdAt) : new Date(),
        updatedAt: test.brandedAs.updatedAt ? new Date(test.brandedAs.updatedAt) : new Date()
      } : undefined
    }));
  },
  createTest: async (data: any) => {
    const tests = await testService.getAllTests();
    const newTest = {
      ...data,
      id: `test-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updated = [newTest, ...tests];
    localStorage.setItem('nbslims_tests', JSON.stringify(updated));
    return newTest;
  },
  updateTest: async (id: string, data: any) => {
    const tests = await testService.getAllTests();
    const updated = tests.map((t: any) => t.id === id ? { ...t, ...data, updatedAt: new Date() } : t);
    localStorage.setItem('nbslims_tests', JSON.stringify(updated));
    return updated.find((t: any) => t.id === id);
  }
};

const sampleService = {
  getAllSamples: async () => {
    const stored = localStorage.getItem('nbslims_enhanced_samples');
    return stored ? JSON.parse(stored) : [];
  }
};

export const TestManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  const [tests, setTests] = useState<Test[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [useTypeFilter, setUseTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoSelectSampleId, setAutoSelectSampleId] = useState<string | null>(null);

  // Form state for both create and edit
  const [formData, setFormData] = useState({
    sampleId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Untested' as TestStatus,
    // Optional notes fields kept
    topNote: '',
    baseNote: '',
    personalNotes: '',
    personalResult: 'Accepted' as TestResult
  });

  useEffect(() => {
    loadData();
    // Request notification permission
    notificationService.requestNotificationPermission();
    
    // Listen for custom data updates
    const handleCustomDataUpdate = () => {
      // Force re-render to update brand options
      setFormData(prev => ({ ...prev }));
    };
    
    window.addEventListener('customDataUpdated', handleCustomDataUpdate);
    return () => {
      window.removeEventListener('customDataUpdated', handleCustomDataUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [testsData, samplesData] = await Promise.all([
        testService.getAllTests(),
        sampleService.getAllSamples()
      ]);
      
      setTests(testsData);
      setSamples(samplesData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTests = useCallback((updatedTests: Test[]) => {
    setTests(updatedTests);
    localStorage.setItem('nbslims_tests', JSON.stringify(updatedTests));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      sampleId: '',
      useType: 'Personal Use',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'Untested',
      topNote: '',
      baseNote: '',
      personalNotes: '',
      personalResult: 'Accepted',
    });
  }, []);

  const handleCreateTest = async () => {
    if (!formData.sampleId) {
      toast.error('Please select a sample');
      return;
    }

    // No special required fields by type now

    try {
      const testData: any = {
        sampleId: formData.sampleId,
        date: new Date(formData.date),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        status: 'Untested' as TestStatus,
        approved: false,
        createdBy: user?.id || 'unknown',
        updatedBy: user?.id || 'unknown'
      };
      testData.personalUseData = {
        topNote: formData.topNote,
        baseNote: formData.baseNote,
        notes: formData.personalNotes,
        date: new Date(formData.date),
        result: formData.personalResult
      };
      testData.result = formData.personalResult;

      // Create test and immediately mark as completed per spec
      const newTest = await testService.createTest(testData);
      newTest.status = 'Completed';
      // Flip sample status to Tested
      try {
        const stored = localStorage.getItem('nbslims_enhanced_samples');
        const samplesData = stored ? JSON.parse(stored) : [];
        const updatedSamples = samplesData.map((s:any)=> s.id === formData.sampleId ? { ...s, status: 'Tested', updatedAt: new Date() } : s);
        localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updatedSamples));
        window.dispatchEvent(new CustomEvent('sampleUpdated', { detail: { sampleId: formData.sampleId, field: 'status', value: 'Tested' } }));
        // Telemetry events
        try {
          const s = updatedSamples.find((x:any)=> x.id===formData.sampleId);
          const { telemetry } = await import('@/lib/telemetry');
          telemetry.emit('tests.created', { sampleId: formData.sampleId, source: s?.source, traceability: s?.traceability });
          telemetry.emit('tests.completed', { sampleId: formData.sampleId, source: s?.source, traceability: s?.traceability, result: newTest.result || 'N/A' });
        } catch {}
      } catch {}
      const updatedTests = [newTest, ...tests];
      saveTests(updatedTests);
      
      // Trigger events to notify other components
      window.dispatchEvent(new CustomEvent('testCreated', { 
        detail: { testId: newTest.id, sampleId: formData.sampleId, status: formData.status }
      }));
      
      // Schedule notification if due date is set
      if (newTest.dueDate) {
        notificationService.scheduleTestNotification(newTest);
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Test created successfully');
    } catch (error) {
      toast.error('Failed to create test');
      console.error('Error creating test:', error);
    }
  };

  const handleEditClick = useCallback((test: Test) => {
    setSelectedTest(test);
    // Ensure test.date is a Date object
    const testDate = test.date instanceof Date ? test.date : new Date(test.date);
    
    setFormData({
      sampleId: test.sampleId,
      date: testDate.toISOString().split('T')[0],
      dueDate: test.dueDate ? formatForDateTimeInput(test.dueDate instanceof Date ? test.dueDate : new Date(test.dueDate)) : '',
      status: test.status || 'Untested',
      topNote: test.personalUseData?.topNote || '',
      baseNote: test.personalUseData?.baseNote || '',
      personalNotes: test.personalUseData?.notes || '',
      personalResult: test.personalUseData?.result || 'Accepted',
    });
    setIsEditDialogOpen(true);
  }, []);

  useEffect(() => {
    // Check if we need to highlight a specific test from URL
    const urlParams = new URLSearchParams(window.location.search);
    const highlightTestId = urlParams.get('highlight');
    
    if (highlightTestId && tests.length > 0) {
      const testToHighlight = tests.find(t => t.id === highlightTestId);
      if (testToHighlight) {
        handleEditClick(testToHighlight);
        // Remove the highlight parameter from URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [tests.length, handleEditClick]);

  useEffect(() => {
    // Check if we need to create a test for a specific sample
    const urlParams = new URLSearchParams(window.location.search);
    const createForSampleId = urlParams.get('createFor');
    
    if (createForSampleId && samples.length > 0) {
      // Find the sample to verify it exists
      const sample = samples.find(s => s.id === createForSampleId);
      if (sample) {
        setAutoSelectSampleId(createForSampleId);
        setActiveTab('management'); // Switch to management tab
        setIsCreateDialogOpen(true);
      }
      
      // Remove the createFor parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [samples.length]);

  // Handle auto-selection when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen && autoSelectSampleId) {
      setFormData(prev => ({ ...prev, sampleId: autoSelectSampleId }));
      setAutoSelectSampleId(null); // Clear the auto-select flag
    }
  }, [isCreateDialogOpen, autoSelectSampleId]);

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      const updatedTests = tests.filter(t => t.id !== testId);
      saveTests(updatedTests);
      
      // Cancel notification for deleted test
      notificationService.cancelTestNotification(testId);
      
      toast.success('Test deleted successfully');
    } catch (error) {
      toast.error('Failed to delete test');
      console.error('Error deleting test:', error);
    }
  };

  const handleViewTest = useCallback((test: Test) => {
    setSelectedTest(test);
    setIsViewDialogOpen(true);
  }, []);

  const handleApproveTest = async (testId: string) => {
    try {
      const updatedTests = tests.map(t => 
        t.id === testId 
          ? { ...t, result: 'Accepted' as TestResult, approved: true, updatedAt: new Date() }
          : t
      );
      saveTests(updatedTests);
      
      // Trigger events to notify other components
      const test = tests.find(t => t.id === testId);
      if (test) {
        window.dispatchEvent(new CustomEvent('testUpdated', { 
          detail: { testId: testId, field: 'approved', value: true }
        }));
        // Persist sample status to localStorage
        const stored = localStorage.getItem('nbslims_enhanced_samples');
        if (stored) {
          const samplesData = JSON.parse(stored);
          const updatedSamples = samplesData.map((s: any) => s.id === test.sampleId ? { ...s, status: 'Accepted', updatedAt: new Date() } : s);
          localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updatedSamples));
          window.dispatchEvent(new CustomEvent('sampleUpdated', { 
            detail: { sampleId: test.sampleId, field: 'status', value: 'Accepted' }
          }));
        }
      }
      
      toast.success('Test approved successfully');
    } catch (error) {
      toast.error('Failed to approve test');
      console.error('Error approving test:', error);
    }
  };

  const handleRejectTest = async (testId: string) => {
    try {
      const updatedTests = tests.map(t => 
        t.id === testId 
          ? { ...t, result: 'Rejected' as TestResult, approved: false, updatedAt: new Date() }
          : t
      );
      saveTests(updatedTests);
      
      // Trigger events to notify other components
      const test = tests.find(t => t.id === testId);
      if (test) {
        window.dispatchEvent(new CustomEvent('testUpdated', { 
          detail: { testId: testId, field: 'approved', value: false }
        }));
        const stored = localStorage.getItem('nbslims_enhanced_samples');
        if (stored) {
          const samplesData = JSON.parse(stored);
          const updatedSamples = samplesData.map((s: any) => s.id === test.sampleId ? { ...s, status: 'Rejected', updatedAt: new Date() } : s);
          localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updatedSamples));
          window.dispatchEvent(new CustomEvent('sampleUpdated', { 
            detail: { sampleId: test.sampleId, field: 'status', value: 'Rejected' }
          }));
        }
      }
      
      toast.success('Test rejected successfully');
    } catch (error) {
      toast.error('Failed to reject test');
      console.error('Error rejecting test:', error);
    }
  };

  const handleUpdateTest = async () => {
    if (!selectedTest || !formData.sampleId) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const updateData: any = {
        sampleId: formData.sampleId,
        useType: formData.useType,
        date: new Date(formData.date),
        status: formData.status,
        updatedBy: user?.id || 'unknown'
      };

      if (formData.useType === 'Personal Use') {
        updateData.personalUseData = {
          topNote: formData.topNote,
          baseNote: formData.baseNote,
          notes: formData.personalNotes,
          date: new Date(formData.date),
          result: formData.personalResult
        };
        updateData.result = formData.personalResult;
        updateData.industrialData = undefined;
      }

      const updatedTests = tests.map(t => 
        t.id === selectedTest.id 
          ? { ...t, ...updateData }
          : t
      );
      
      saveTests(updatedTests);
      
      // Trigger events to notify other components
      window.dispatchEvent(new CustomEvent('testUpdated', { 
        detail: { testId: selectedTest.id, field: 'status', value: formData.status }
      }));
      
      // Persist status changes onto the sample
      if (formData.status === 'Approved' || formData.status === 'Rejected' || formData.status === 'Testing' || formData.status === 'Untested') {
        const stored = localStorage.getItem('nbslims_enhanced_samples');
        if (stored) {
          const samplesData = JSON.parse(stored);
          const statusMap: any = {
            Approved: 'Accepted',
            Rejected: 'Rejected',
            Testing: 'Testing',
            Untested: 'Untested'
          };
          const newStatus = statusMap[formData.status] || 'Untested';
          const updatedSamples = samplesData.map((s: any) => s.id === formData.sampleId ? { ...s, status: newStatus, updatedAt: new Date() } : s);
          localStorage.setItem('nbslims_enhanced_samples', JSON.stringify(updatedSamples));
          window.dispatchEvent(new CustomEvent('sampleUpdated', { 
            detail: { sampleId: formData.sampleId, field: 'status', value: newStatus }
          }));
        }
      }
      
      setIsEditDialogOpen(false);
      setSelectedTest(null);
      resetForm();
      toast.success('Test updated successfully');
    } catch (error) {
      toast.error('Failed to update test');
      console.error('Error updating test:', error);
    }
  };

  // Removed legacy industrial formula helpers
  const addFormulaEntry = () => {};

  const updateFormulaEntry = (_index: number, _field: keyof FormulaEntry, _value: any) => {};

  const removeFormulaEntry = (_index: number) => {};

  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const sample = samples.find(s => s.id === test.sampleId);
      const matchesSearch = sample?.itemNameEN.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sample?.itemNameAR?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           test.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
      const matchesUseType = useTypeFilter === 'all' || test.useType === useTypeFilter;
      
      return matchesSearch && matchesStatus && matchesUseType;
    });
  }, [tests, samples, searchTerm, statusFilter, useTypeFilter]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Rework': return 'bg-orange-100 text-orange-800';
      case 'Retest': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getTestStatusBadgeColor = (status: TestStatus) => {
    switch (status) {
      case 'Untested': return 'bg-gray-100 text-gray-800';
      case 'Testing': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Not Approved': return 'bg-red-100 text-red-800';
      case 'Rework': return 'bg-yellow-100 text-yellow-800';
      case 'Retest': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUseTypeIcon = () => <Icon name="tests" size={16} />;

  // Calculate statistics for overview
  const statistics = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    return {
      totalTests: tests.length,
      acceptedTests: tests.filter(t => t.result === 'Accepted').length,
      rejectedTests: tests.filter(t => t.result === 'Rejected').length,
      personalUseTests: tests.length,
      untestedTests: tests.filter(t => t.status === 'Untested').length,
      testingTests: tests.filter(t => t.status === 'Testing').length,
      approvedTests: tests.filter(t => t.status === 'Approved').length,
      overdueTests: tests.filter(t => t.dueDate && new Date(t.dueDate) < now && !t.approved).length,
      dueSoonTests: tests.filter(t => t.dueDate && new Date(t.dueDate) > now && 
                                       new Date(t.dueDate) < tomorrow && !t.approved).length
    };
  }, [tests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <TestTube className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading tests...</p>
        </div>
      </div>
    );
  }

  const renderTestForm = (isEdit = false) => {
    const handleInputChange = (field: string, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <div className="space-y-6">
        {/* Basic Test Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sampleId">Sample *</Label>
              <Select value={formData.sampleId} onValueChange={(value) => handleInputChange('sampleId', value)}>
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
              <Label htmlFor="date">Test Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Due Date</span>
                </div>
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                placeholder="Set due date for test completion"
              />
              {formData.dueDate && (
                <div className="mt-1 space-y-1">
                  <p className="text-xs font-medium text-gray-700">
                    Due: {formatTo12Hour(formData.dueDate)}
                  </p>
                  <p className="text-xs text-gray-600">
                    🔔 Reminder will be sent at {formatTo12Hour(new Date(new Date(formData.dueDate).getTime() - 60 * 60 * 1000))}
                  </p>
                </div>
              )}
            </div>
            <div />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
          </div>

        </div>

      <Separator />

      {/* Test Notes (optional) */}
      {true && (
        <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center space-x-2">
            <Beaker className="h-5 w-5 text-blue-600" />
            <Label className="text-base font-medium text-blue-900">Test Notes</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="topNote">Top Note *</Label>
              <Input
                id="topNote"
                value={formData.topNote}
                onChange={(e) => handleInputChange('topNote', e.target.value)}
                placeholder="Enter top note"
              />
            </div>
            <div>
              <Label htmlFor="baseNote">Base Note *</Label>
              <Input
                id="baseNote"
                value={formData.baseNote}
                onChange={(e) => handleInputChange('baseNote', e.target.value)}
                placeholder="Enter base note"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="personalNotes">Notes</Label>
            <Textarea
              id="personalNotes"
              value={formData.personalNotes}
              onChange={(e) => handleInputChange('personalNotes', e.target.value)}
              placeholder="Additional notes for personal use test"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="personalResult">Result *</Label>
            <Select value={formData.personalResult} onValueChange={(value: TestResult) => handleInputChange('personalResult', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Rework">Rework</SelectItem>
                <SelectItem value="Retest">Retest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Industrial section removed */}
      {false && (
        <div className="space-y-4 border rounded-lg p-4 bg-green-50">
          <div className="flex items-center space-x-2">
            <FlaskConical className="h-5 w-5 text-green-600" />
            <Label className="text-base font-medium text-green-900">Industrial Test Data</Label>
          </div>

          {/* Formula Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Formula</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFormulaEntry}>
                <Icon name="add" size={16} className="mr-2" />
                Add Entry
              </Button>
            </div>

            {([] as any[]).map((entry, index) => (
              <div key={entry.id} className="space-y-4 p-4 border rounded-lg bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sample 1 Percentage (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={entry.percentage}
                      onChange={(e) => updateFormulaEntry(index, 'percentage', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Sample 1</Label>
                    <Select 
                      value={entry.sampleId || ''} 
                      onValueChange={(value) => updateFormulaEntry(index, 'sampleId', value)}
                    >
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
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sample 2 Percentage (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={entry.percentage2 || 0}
                      onChange={(e) => updateFormulaEntry(index, 'percentage2', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Sample 2</Label>
                    <Select 
                      value={entry.sampleId2 || ''} 
                      onValueChange={(value) => updateFormulaEntry(index, 'sampleId2', value)}
                    >
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Result</Label>
                    <Select value={entry.result || 'Accepted'} onValueChange={(value) => updateFormulaEntry(index, 'result', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Rework">Rework</SelectItem>
                        <SelectItem value="Retest">Retest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFormulaEntry(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Entry
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={entry.notes || ''}
                    onChange={(e) => updateFormulaEntry(index, 'notes', e.target.value)}
                    placeholder="Additional notes for this formula entry"
                    rows={2}
                  />
                </div>
              </div>
            ))}

            {true && (
              <div className="text-center py-8 text-gray-500">
                <Percent className="h-8 w-8 mx-auto mb-2" />
                <p>No formula entries added yet</p>
                <p className="text-sm">Click "Add Entry" to start building the formula</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="industrialStatus">Status *</Label>
            <Select value={'Approved'} onValueChange={() => {}}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Retest">Retest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="industrialNotes">Notes</Label>
            <Textarea id="industrialNotes" value={''} onChange={() => {}} placeholder="" rows={3} />
          </div>
        </div>
      )}


      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
            } else {
              setIsCreateDialogOpen(false);
            }
          }}
        >
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdateTest : handleCreateTest}>
          {isEdit ? 'Update Test' : 'Create Test'}
        </Button>
      </div>
    </div>
  );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Test Management</h1>
          <p className="text-gray-600">Comprehensive test analytics and management</p>
        </div>
        {hasPermission('tests', 'create') && activeTab === 'management' && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Icon name="add" size={16} className="mr-2" />
            Add Test
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Microscope className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Tests</p>
                    <p className="text-2xl font-bold">{statistics.totalTests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Accepted</p>
                    <p className="text-2xl font-bold">{statistics.acceptedTests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold">{statistics.rejectedTests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {statistics.totalTests > 0 ? Math.round((statistics.acceptedTests / statistics.totalTests) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Untested</p>
                    <p className="text-2xl font-bold">{statistics.untestedTests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Testing</p>
                    <p className="text-2xl font-bold">{statistics.testingTests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold">{statistics.approvedTests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Type Distribution and Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Type Distribution</CardTitle>
                <CardDescription>Breakdown of tests by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Beaker className="h-5 w-5 text-blue-500" />
                      <span>Personal Use</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{statistics.personalUseTests}</span>
                      <span className="text-sm text-gray-500">
                        ({statistics.totalTests > 0 ? Math.round((statistics.personalUseTests / statistics.totalTests) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Alerts</CardTitle>
                <CardDescription>Tests requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-2 border rounded bg-red-50">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-900">Overdue Tests</span>
                    </div>
                    <span className="font-bold text-red-900">{statistics.overdueTests}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded bg-orange-50">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="text-orange-900">Due Soon</span>
                    </div>
                    <span className="font-bold text-orange-900">{statistics.dueSoonTests}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Test Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Activity</CardTitle>
              <CardDescription>Latest test results and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tests.slice(0, 10).map((test) => {
                  const sample = samples.find(s => s.id === test.sampleId);
                  return (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Beaker className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">{sample?.itemNameEN || 'Unknown Sample'}</p>
                          <p className="text-sm text-gray-500">
                            {test.date ? (test.date instanceof Date ? test.date : new Date(test.date)).toLocaleDateString() : 'N/A'} • {test.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getTestStatusBadgeColor(test.status || 'Untested')}>
                          {test.status || 'Untested'}
                        </Badge>
                        <Badge className={getStatusBadgeColor(test.result)}>
                          {test.result}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TestTube className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold">{statistics.totalTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Beaker className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Personal Use</p>
                <p className="text-2xl font-bold">{statistics.personalUseTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold">{statistics.acceptedTests}</p>
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
                  placeholder="Search tests by sample name or ID..."
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
                <SelectItem value="Untested">Untested</SelectItem>
                <SelectItem value="Testing">Testing</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Not Approved">Not Approved</SelectItem>
                <SelectItem value="Rework">Rework</SelectItem>
                <SelectItem value="Retest">Retest</SelectItem>
              </SelectContent>
            </Select>
            <Select value={useTypeFilter} onValueChange={setUseTypeFilter}>
              <SelectTrigger className="w-48">
                <TestTube className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Personal Use">Personal Use</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tests ({filteredTests.length})</CardTitle>
          <CardDescription>
            Manage laboratory tests with different use types and methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test ID</TableHead>
                <TableHead>Sample</TableHead>
                <TableHead>Use Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.map((test) => {
                const sample = samples.find(s => s.id === test.sampleId);
                return (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sample?.itemNameEN || 'Unknown Sample'}</p>
                        <p className="text-sm text-gray-500">#{sample?.sampleNo || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getUseTypeIcon()}
                        <span>{(() => {
                          const sample = samples.find(s => s.id === test.sampleId);
                          return sample && (sample as any).source === 'FORMULA' ? 'Formula Sample Test' : 'Sample Test';
                        })()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {test.date ? (test.date instanceof Date ? test.date : new Date(test.date)).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {test.dueDate ? (
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const dueDate = test.dueDate instanceof Date ? test.dueDate : new Date(test.dueDate);
                            const now = new Date();
                            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                            return (
                              <>
                                {!test.approved && dueDate < now && (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                )}
                                {!test.approved && dueDate > now && dueDate < tomorrow && (
                                  <Clock className="h-4 w-4 text-orange-600" />
                                )}
                                <span className={`text-sm ${
                                  !test.approved && dueDate < now ? 'text-red-600 font-bold' :
                                  !test.approved && dueDate < tomorrow ? 'text-orange-600 font-medium' :
                                  ''
                                }`}>
                                  {formatTo12Hour(dueDate)}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTestStatusBadgeColor(test.status || 'Untested')}>
                        {test.status || 'Untested'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(test.result)}>
                        {test.result}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {test.useType === 'Personal Use' ? (
                        <div className="text-sm">
                          <p><strong>Top:</strong> {test.personalUseData?.topNote || 'N/A'}</p>
                          <p><strong>Base:</strong> {test.personalUseData?.baseNote || 'N/A'}</p>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p><strong>Formula:</strong> {test.industrialData?.formula.length || 0} entries</p>
                          <p><strong>Status:</strong> {test.industrialData?.status || 'N/A'}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewTest(test)}
                          title="View test details"
                        >
                          <Icon name="eye" size={16} />
                        </Button>
                        {hasPermission('tests', 'update') && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditClick(test)}
                            title="Edit test"
                          >
                            <Icon name="edit" size={16} />
                          </Button>
                        )}
                        {hasPermission('tests', 'delete') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteTest(test.id)}
                            title="Delete test"
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
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Create Test Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{(() => {
              const s = samples.find(x=> x.id === formData.sampleId);
              return s && (s as any).source === 'FORMULA' ? 'New Formula Sample Test' : 'New Sample Test';
            })()}</DialogTitle>
            <DialogDescription>
              Add a new test for the selected sample
            </DialogDescription>
          </DialogHeader>
          {renderTestForm(false)}
        </DialogContent>
      </Dialog>

      {/* Edit Test Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Edit Test</DialogTitle>
            <DialogDescription>
              Update test information and data
            </DialogDescription>
          </DialogHeader>
          {renderTestForm(true)}
        </DialogContent>
      </Dialog>

      {/* View Test Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Test Details</DialogTitle>
            <DialogDescription>
              View test information and results
            </DialogDescription>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Test ID</Label>
                  <p className="text-sm font-medium">{selectedTest.id}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getTestStatusBadgeColor(selectedTest.status || 'Untested')}>
                    {selectedTest.status || 'Untested'}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sample</Label>
                  <p className="text-sm font-medium">
                    {samples.find(s => s.id === selectedTest.sampleId)?.itemNameEN || 'Unknown Sample'}
                  </p>
                </div>
                <div>
                  <Label>Use Type</Label>
                  <p className="text-sm font-medium">{selectedTest.useType}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Test Date</Label>
                  <p className="text-sm font-medium">{new Date(selectedTest.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <p className="text-sm font-medium">
                    {selectedTest.dueDate ? formatTo12Hour(selectedTest.dueDate) : '-'}
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Result</Label>
                <Badge className={getStatusBadgeColor(selectedTest.result)}>
                  {selectedTest.result}
                </Badge>
              </div>
              
              <Separator />
              
              {selectedTest.useType === 'Personal Use' && selectedTest.personalUseData && (
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
                  <h3 className="font-medium text-lg">Personal Use Data</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Top Note</Label>
                      <p className="text-sm">{selectedTest.personalUseData.topNote || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Base Note</Label>
                      <p className="text-sm">{selectedTest.personalUseData.baseNote || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm">{selectedTest.personalUseData.notes || 'N/A'}</p>
                  </div>
                </div>
              )}
              
              {false && selectedTest.industrialData && (
                <div className="space-y-4 border rounded-lg p-4 bg-purple-50">
                  <h3 className="font-medium text-lg">Industrial Data</h3>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusBadgeColor(selectedTest.industrialData.status)}>
                      {selectedTest.industrialData.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Formula ({selectedTest.industrialData.formula.length} entries)</Label>
                    {selectedTest.industrialData.formula.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Sample</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTest.industrialData.formula.map((entry, index) => (
                            <TableRow key={index}>
                              <TableCell>{entry.percentage}%</TableCell>
                              <TableCell>
                                {samples.find(s => s.id === entry.sampleId)?.itemNameEN || 'Unknown'}
                              </TableCell>
                              <TableCell>{entry.notes || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-gray-500">No formula entries</p>
                    )}
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm">{selectedTest.industrialData.notes || 'N/A'}</p>
                  </div>
                </div>
              )}
              
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
