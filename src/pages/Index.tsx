import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TestTube, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  User,
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react';

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/settings');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Sample data for dashboard
  const stats = {
    totalSamples: 156,
    pendingSamples: 23,
    completedTests: 89,
    pendingOrders: 5
  };

  const recentTasks = [
    {
      id: 1,
      title: 'Complete water quality analysis for Sample #WQ-2024-001',
      priority: 'high',
      dueDate: '2024-01-25',
      status: 'in-progress',
      assignee: 'John Smith'
    },
    {
      id: 2,
      title: 'Review test results for pharmaceutical batch PH-2024-045',
      priority: 'medium',
      dueDate: '2024-01-26',
      status: 'pending',
      assignee: 'Sarah Johnson'
    },
    {
      id: 3,
      title: 'Calibrate pH meter in Lab Room A',
      priority: 'low',
      dueDate: '2024-01-27',
      status: 'completed',
      assignee: 'Mike Davis'
    },
    {
      id: 4,
      title: 'Process soil contamination samples from Site B',
      priority: 'high',
      dueDate: '2024-01-24',
      status: 'overdue',
      assignee: 'Lisa Chen'
    },
    {
      id: 5,
      title: 'Update inventory for chemical reagents',
      priority: 'medium',
      dueDate: '2024-01-28',
      status: 'pending',
      assignee: 'David Wilson'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.fullName}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleProfileClick}
            className="flex items-center space-x-2 hover:bg-gray-50"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            {user?.role}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('/samples')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSamples}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('/samples')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Samples</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSamples}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting analysis
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('/tests')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTests}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate('/purchasing')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used actions for laboratory management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleNavigate('/samples')}
            >
              <TestTube className="h-6 w-6" />
              <span className="text-sm">Add Sample</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleNavigate('/tests')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Run Test</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleNavigate('/purchasing')}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">New Order</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleNavigate('/suppliers')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Add Supplier</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Recent Tasks</span>
          </CardTitle>
          <CardDescription>
            Current laboratory tasks and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(task.status)}
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {task.assignee}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due: {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Samples</CardTitle>
            <CardDescription>
              Latest samples submitted for analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Water Quality Sample #WQ-2024-001</p>
                  <p className="text-sm text-gray-500">Submitted 2 hours ago</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Soil Sample #SS-2024-045</p>
                  <p className="text-sm text-gray-500">Submitted 4 hours ago</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Air Quality Sample #AQ-2024-023</p>
                  <p className="text-sm text-gray-500">Submitted yesterday</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current status of laboratory systems.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Spectrometer Lab A</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Chromatography Lab B</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>pH Meter Station 3</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Finished Goods Quick Link */}
      <div>
        <a href="/finished-goods" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          View Finished Goods
        </a>
      </div>
    </div>
  );
}