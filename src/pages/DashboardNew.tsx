import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  Package, 
  TestTube,
  ShoppingCart,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw,
  FlaskConical,
  Building2,
  Plus,
  Edit,
  Eye,
  Trash2,
  Beaker,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { TestingSuggestions } from '@/components/TestingSuggestions';
import { notificationService } from '@/services/notificationService';
import { Test, Sample } from '@/lib/types';
import { formatTo12Hour } from '@/lib/dateUtils';
import { useBarcode } from '@/lib/useBarcode';
import { resolveScanToPreparationRoute } from '@/services/scanResolver.client';
import { parseQR } from '@/lib/parseQR';
import { handleScanNavigation } from '@/lib/handleScanNavigation';
import { ls } from '@/lib/safeLS';

// Mock recent actions data
const mockRecentActions = {
  samples: [
    { id: '1', action: 'Created', item: 'Sodium Chloride Sample', user: 'John Doe', time: '2 minutes ago', type: 'sample', status: 'Pending' },
    { id: '2', action: 'Updated', item: 'Hydrochloric Acid - #123', user: 'Jane Smith', time: '15 minutes ago', type: 'sample', status: 'Testing' },
    { id: '3', action: 'Status Changed', item: 'Potassium Hydroxide - #124', user: 'Mike Johnson', time: '1 hour ago', type: 'sample', status: 'Accepted' },
    { id: '4', action: 'Created', item: 'Ethanol Sample', user: 'Sarah Wilson', time: '2 hours ago', type: 'sample', status: 'Pending' }
  ],
  tests: [
    { id: '1', action: 'Created', item: 'Personal Use Test - Sample #123', user: 'John Doe', time: '5 minutes ago', type: 'test', result: 'Accepted' },
    { id: '2', action: 'Completed', item: 'Industrial Test - Sample #120', user: 'Jane Smith', time: '30 minutes ago', type: 'test', result: 'Approved' },
    { id: '3', action: 'Result Updated', item: 'Personal Use Test - Sample #118', user: 'Mike Johnson', time: '1 hour ago', type: 'test', result: 'Rejected' },
    { id: '4', action: 'Created', item: 'Industrial Test - Sample #125', user: 'Sarah Wilson', time: '3 hours ago', type: 'test', result: 'Retest' }
  ],
  suppliers: [
    { id: '1', action: 'Updated', item: 'Lab Equipment Co.', user: 'John Doe', time: '10 minutes ago', type: 'supplier', status: 'Active' },
    { id: '2', action: 'Created', item: 'New Chemical Supplier', user: 'Jane Smith', time: '1 hour ago', type: 'supplier', status: 'Active' },
    { id: '3', action: 'Status Changed', item: 'Scientific Materials Ltd.', user: 'Mike Johnson', time: '2 hours ago', type: 'supplier', status: 'Inactive' }
  ],
  requests: [
    { id: '1', action: 'Created', item: 'Sodium Chloride Request', user: 'John Doe', time: '20 minutes ago', type: 'request', status: 'Requested' },
    { id: '2', action: 'Status Updated', item: 'Hydrochloric Acid Request', user: 'Jane Smith', time: '45 minutes ago', type: 'request', status: 'Sent to Ordering' },
    { id: '3', action: 'Converted to Order', item: 'Potassium Hydroxide Request', user: 'Mike Johnson', time: '1 hour ago', type: 'request', status: 'Ordered' }
  ]
};

export const DashboardNew: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState(mockRecentActions);
  const [overdueTests, setOverdueTests] = useState<Test[]>([]);
  const [nearDueTests, setNearDueTests] = useState<Test[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState<string|null>(null);

  useEffect(() => {
    loadDueTests();
    // Debug probe for localStorage parsing
    try {
      const cnt = ls<any[]>('nbslims_formulas', []).length;
      console.log('[dbg] formulas count', cnt);
    } catch (e) {
      console.error('[dbg] formulas parse failed', e);
    }
    const interval = setInterval(loadDueTests, 60000); // Refresh every minute
    
    // Listen for all data updates
    const handleSampleUpdate = () => {
      loadDueTests();
    };
    
    const handleTestUpdate = () => {
      loadDueTests();
    };
    
    const handleSupplierUpdate = () => {
      loadDueTests();
    };
    
    window.addEventListener('sampleUpdated', handleSampleUpdate);
    window.addEventListener('sampleCreated', handleSampleUpdate);
    window.addEventListener('testUpdated', handleTestUpdate);
    window.addEventListener('testCreated', handleTestUpdate);
    window.addEventListener('supplierUpdated', handleSupplierUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('sampleUpdated', handleSampleUpdate);
      window.removeEventListener('sampleCreated', handleSampleUpdate);
      window.removeEventListener('testUpdated', handleTestUpdate);
      window.removeEventListener('testCreated', handleTestUpdate);
      window.removeEventListener('supplierUpdated', handleSupplierUpdate);
    };
  }, []);

  const loadDueTests = () => {
    const overdue = notificationService.getOverdueTests();
    const nearDue = notificationService.getNearDueTests(24); // Next 24 hours
    setOverdueTests(overdue);
    setNearDueTests(nearDue);
    
    // Load samples for display
    const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
    if (storedSamples) {
      setSamples(JSON.parse(storedSamples));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    loadDueTests();
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  async function handleScannedCode(code: string){
    setScanBusy(true); setScanError(null);
    
    // Normalize scan to remove garbage characters
    const { normalizeScan } = await import('@/lib/qr');
    const clean = normalizeScan(code);
    console.debug('[qr] scan raw:', code, 'clean:', clean);
    
    try {
      handleScanNavigation(navigate, clean);
      setScanBusy(false);
      try { scanInputRef.current?.select(); } catch {}
    } catch (err) {
      console.error('[qr] scan failed:', err);
      setScanError('Scan not recognized');
      setScanBusy(false);
      try { scanInputRef.current?.select(); } catch {}
    }
  }
  useBarcode({ onScan: handleScannedCode, target: scanInputRef.current ?? document });

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'sample': return <TestTube className="h-4 w-4" />;
      case 'test': return <FlaskConical className="h-4 w-4" />;
      case 'supplier': return <Building2 className="h-4 w-4" />;
      case 'request': return <Package className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Testing': return 'bg-blue-100 text-blue-800';
      case 'Accepted': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Requested': return 'bg-yellow-100 text-yellow-800';
      case 'Sent to Ordering': return 'bg-blue-100 text-blue-800';
      case 'Ordered': return 'bg-green-100 text-green-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Retest': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Created': return 'text-green-600';
      case 'Updated': return 'text-blue-600';
      case 'Status Changed': return 'text-orange-600';
      case 'Completed': return 'text-green-600';
      case 'Result Updated': return 'text-purple-600';
      case 'Converted to Order': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const StatCard = ({ title, value, change, icon, color = 'blue' }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                <span className="text-sm font-medium">{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RecentActivityCard = ({ title, activities, type }: {
    title: string;
    activities: any[];
    type: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getActionIcon(type)}
          <span>{title}</span>
        </CardTitle>
        <CardDescription>
          Recent {type} activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {getActionIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.item}
                  </p>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs font-medium ${getActionColor(activity.action)}`}>
                    {activity.action}
                  </span>
                  <span className="text-xs text-gray-500">by {activity.user}</span>
                  {activity.status && (
                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                  )}
                  {activity.result && (
                    <Badge className={`text-xs ${getStatusColor(activity.result)}`}>
                      {activity.result}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Recent activities and system overview</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={scanInputRef}
            placeholder="Scan formula QR / barcode…"
            className="w-72 rounded border px-3 py-2"
            onKeyDown={(e)=>{
              if (e.key === 'Enter'){
                e.preventDefault();
                const clean = (e.currentTarget.value||'').replace(/[\r\n\t]/g,'').trim();
                if (clean) handleScannedCode(clean);
              }
            }}
          />
          {scanBusy && <span className="text-sm text-gray-500">Waiting…</span>}
          {scanError && <span className="text-sm text-red-600">{scanError}</span>}
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Samples"
          value="156"
          change={12.5}
          icon={<TestTube className="h-6 w-6 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Untested Samples"
          value="18"
          change={5.2}
          icon={<Clock className="h-6 w-6 text-yellow-600" />}
          color="yellow"
        />
        <StatCard
          title="Active Tests"
          value="23"
          change={-2.1}
          icon={<FlaskConical className="h-6 w-6 text-purple-600" />}
          color="purple"
        />
        <StatCard
          title="Suppliers"
          value="8"
          change={0}
          icon={<Building2 className="h-6 w-6 text-green-600" />}
          color="green"
        />
        <StatCard
          title="Pending Requests"
          value="12"
          change={8.3}
          icon={<Package className="h-6 w-6 text-orange-600" />}
          color="orange"
        />
      </div>

      {/* Due Tests Alert */}
      {(overdueTests.length > 0 || nearDueTests.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Test Due Dates</span>
            </CardTitle>
            <CardDescription>
              Tests requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overdueTests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">Overdue Tests ({overdueTests.length})</h4>
                  <div className="space-y-2">
                    {overdueTests.slice(0, 5).map(test => {
                      const sample = samples.find(s => s.id === test.sampleId);
                      const dueDate = test.dueDate ? new Date(test.dueDate) : null;
                      const hoursOverdue = dueDate ? Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60)) : 0;
                      
                      return (
                        <div key={test.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center space-x-3">
                            <Clock className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-sm font-medium">
                                {sample?.itemNameEN || 'Unknown Sample'} - #{sample?.sampleNo}
                              </p>
                              <p className="text-xs text-gray-600">
                                {test.useType} • Overdue by {hoursOverdue} hour{hoursOverdue !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/test-management?highlight=${test.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      );
                    })}
                    {overdueTests.length > 5 && (
                      <Button 
                        variant="link" 
                        className="text-sm p-0 h-auto"
                        onClick={() => navigate('/test-management?filter=overdue')}
                      >
                        View all {overdueTests.length} overdue tests →
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {nearDueTests.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-orange-800 mb-2">Due Soon ({nearDueTests.length})</h4>
                  <div className="space-y-2">
                    {nearDueTests.slice(0, 3).map(test => {
                      const sample = samples.find(s => s.id === test.sampleId);
                      const dueDate = test.dueDate ? new Date(test.dueDate) : null;
                      const hoursUntilDue = dueDate ? Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60)) : 0;
                      
                      return (
                        <div key={test.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-3">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="text-sm font-medium">
                                {sample?.itemNameEN || 'Unknown Sample'} - #{sample?.sampleNo}
                              </p>
                              <p className="text-xs text-gray-600">
                                {test.useType} • Due in {hoursUntilDue} hour{hoursUntilDue !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/test-management?highlight=${test.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      );
                    })}
                    {nearDueTests.length > 3 && (
                      <Button 
                        variant="link" 
                        className="text-sm p-0 h-auto"
                        onClick={() => navigate('/test-management?filter=near-due')}
                      >
                        View all {nearDueTests.length} upcoming tests →
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Suggestions */}
      <TestingSuggestions />

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard
          title="Recent Samples"
          activities={data.samples}
          type="sample"
        />
        <RecentActivityCard
          title="Recent Tests"
          activities={data.tests}
          type="test"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard
          title="Supplier Updates"
          activities={data.suppliers}
          type="supplier"
        />
        <RecentActivityCard
          title="Request Activities"
          activities={data.requests}
          type="request"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/samples')}
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm">Add Sample</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/test-management')}
            >
              <FlaskConical className="h-6 w-6" />
              <span className="text-sm">Create Test</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/suppliers')}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-sm">Add Supplier</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/requested-items')}
            >
              <Package className="h-6 w-6" />
              <span className="text-sm">New Request</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
