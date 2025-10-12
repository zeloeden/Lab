import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, TrendingDown, Activity, Package, TestTube, Users,
  Calendar, Clock, DollarSign, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, Download, Filter, RefreshCw,
  AlertCircle, CheckCircle, XCircle, ArrowUp, ArrowDown
} from 'lucide-react';
import { Sample, Test } from '@/lib/types';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      // Load samples from localStorage
      const storedSamples = localStorage.getItem('nbslims_enhanced_samples');
      if (storedSamples) {
        setSamples(JSON.parse(storedSamples));
      }

      // Load tests from localStorage
      const storedTests = localStorage.getItem('nbslims_tests');
      if (storedTests) {
        setTests(JSON.parse(storedTests));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalSamples: samples.length,
    activeSamples: samples.filter(s => s.status === 'Testing').length,
    completedSamples: samples.filter(s => s.status === 'Accepted' || s.status === 'Rejected').length,
    pendingSamples: samples.filter(s => s.status === 'Pending' || s.status === 'Untested').length,
    totalTests: tests.length,
    passedTests: tests.filter(t => t.status === 'Approved').length,
    failedTests: tests.filter(t => t.status === 'Rejected').length,
    pendingTests: tests.filter(t => t.status === 'Testing' || t.status === 'Untested').length,
  };

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Sample status distribution data
  const statusDistribution = [
    { name: 'Accepted', value: samples.filter(s => s.status === 'Accepted').length, color: '#10b981' },
    { name: 'Rejected', value: samples.filter(s => s.status === 'Rejected').length, color: '#ef4444' },
    { name: 'Testing', value: samples.filter(s => s.status === 'Testing').length, color: '#3b82f6' },
    { name: 'Pending', value: samples.filter(s => s.status === 'Pending').length, color: '#f59e0b' },
    { name: 'Untested', value: samples.filter(s => s.status === 'Untested').length, color: '#6b7280' },
  ];

  // Monthly trend data
  const generateMonthlyTrend = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      samples: Math.floor(Math.random() * 100) + 20,
      tests: Math.floor(Math.random() * 80) + 15,
      approved: Math.floor(Math.random() * 60) + 10,
      rejected: Math.floor(Math.random() * 20) + 5,
    }));
  };

  const monthlyTrend = generateMonthlyTrend();

  // Supplier performance data
  const supplierPerformance = [
    { supplier: 'Supplier A', samples: 45, approved: 40, rejected: 5, successRate: 88.9 },
    { supplier: 'Supplier B', samples: 38, approved: 30, rejected: 8, successRate: 78.9 },
    { supplier: 'Supplier C', samples: 52, approved: 48, rejected: 4, successRate: 92.3 },
    { supplier: 'Supplier D', samples: 29, approved: 22, rejected: 7, successRate: 75.9 },
    { supplier: 'Supplier E', samples: 41, approved: 35, rejected: 6, successRate: 85.4 },
  ];

  // Test type distribution
  const testTypeDistribution = [
    { type: 'Personal Use', value: tests.filter(t => t.useType === 'Personal Use').length },
    { type: 'Industrial', value: tests.filter(t => t.useType === 'Industrial').length },
  ];

  // Priority distribution
  const priorityDistribution = [
    { priority: 'Low', samples: 25, color: '#10b981' },
    { priority: 'Medium', samples: 45, color: '#f59e0b' },
    { priority: 'High', samples: 30, color: '#ef4444' },
    { priority: 'Critical', samples: 15, color: '#991b1b' },
  ];

  // Weekly activity data
  const weeklyActivity = [
    { day: 'Mon', samples: 12, tests: 8 },
    { day: 'Tue', samples: 19, tests: 14 },
    { day: 'Wed', samples: 15, tests: 12 },
    { day: 'Thu', samples: 25, tests: 18 },
    { day: 'Fri', samples: 22, tests: 20 },
    { day: 'Sat', samples: 8, tests: 5 },
    { day: 'Sun', samples: 5, tests: 3 },
  ];

  // Test turnaround time
  const turnaroundTime = [
    { range: '< 24h', count: 45, percentage: 35 },
    { range: '1-3 days', count: 38, percentage: 30 },
    { range: '3-7 days', count: 25, percentage: 20 },
    { range: '> 7 days', count: 19, percentage: 15 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">Comprehensive data analysis and insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardDescription>Total Samples</CardDescription>
                <CardTitle className="text-2xl">{stats.totalSamples}</CardTitle>
              </div>
              <Package className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">+12.5%</span>
              <span className="text-gray-500">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardDescription>Active Tests</CardDescription>
                <CardTitle className="text-2xl">{stats.pendingTests}</CardTitle>
              </div>
              <TestTube className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-blue-500">{stats.passedTests} passed</span>
              <span className="text-gray-500">this period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-2xl">
                  {stats.totalTests > 0 ? ((stats.passedTests / stats.totalTests) * 100).toFixed(1) : 0}%
                </CardTitle>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">+3.2%</span>
              <span className="text-gray-500">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardDescription>Avg. Turnaround</CardDescription>
                <CardTitle className="text-2xl">2.4 days</CardTitle>
              </div>
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span className="text-green-500">-18%</span>
              <span className="text-gray-500">faster processing</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Activity Trend</CardTitle>
                <CardDescription>Samples and tests processed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="samples" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="tests" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Sample Status Distribution</CardTitle>
                <CardDescription>Current status breakdown of all samples</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity Pattern</CardTitle>
              <CardDescription>Daily sample and test processing activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="samples" fill="#3b82f6" />
                  <Bar dataKey="tests" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Supplier Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance Analysis</CardTitle>
              <CardDescription>Success rates and sample volumes by supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={supplierPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplier" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="samples" fill="#3b82f6" name="Total Samples" />
                  <Bar yAxisId="left" dataKey="approved" fill="#10b981" name="Approved" />
                  <Bar yAxisId="left" dataKey="rejected" fill="#ef4444" name="Rejected" />
                  <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#f59e0b" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Turnaround Time Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Turnaround Time</CardTitle>
                <CardDescription>Time taken to complete tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {turnaroundTime.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.range}</span>
                        <span className="font-medium">{item.count} tests ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Sample distribution by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={priorityDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="priority" type="category" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="samples" fill="#3b82f6">
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Test Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Test Types</CardTitle>
                <CardDescription>Distribution by test type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={testTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#3b82f6"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {testTypeDistribution.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-purple-500'}`} />
                        {item.type}
                      </span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sample Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Sample Categories</CardTitle>
                <CardDescription>Top categories processed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Perfume', 'Detergent', 'Reed Diffuser', 'Personal Care', 'Industrial'].map((category, index) => {
                    const value = Math.floor(Math.random() * 50) + 10;
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                              style={{ width: `${value * 1.5}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">{value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Samples by origin country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { country: 'UAE', samples: 45, flag: '🇦🇪' },
                    { country: 'USA', samples: 38, flag: '🇺🇸' },
                    { country: 'UK', samples: 32, flag: '🇬🇧' },
                    { country: 'France', samples: 28, flag: '🇫🇷' },
                    { country: 'Italy', samples: 22, flag: '🇮🇹' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <span>{item.flag}</span>
                        {item.country}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                            style={{ width: `${(item.samples / 45) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">{item.samples}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Comparative Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Year-over-Year Comparison</CardTitle>
              <CardDescription>Performance metrics compared to previous year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="samples" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="tests" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Projected Growth</CardTitle>
              <CardDescription>Expected sample volume for the next quarter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Next Month</p>
                    <p className="text-2xl font-bold text-blue-600">+15%</p>
                    <p className="text-xs text-gray-500">~125 samples</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Q2 2024</p>
                    <p className="text-2xl font-bold text-green-600">+28%</p>
                    <p className="text-xs text-gray-500">~380 samples</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">EOY 2024</p>
                    <p className="text-2xl font-bold text-purple-600">+45%</p>
                    <p className="text-xs text-gray-500">~1,450 samples</p>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Capacity Planning</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Based on current growth trends, consider expanding testing capacity by Q3 2024 to handle projected 45% increase in sample volume.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
