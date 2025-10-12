import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  User, 
  Clock, 
  Search, 
  Filter,
  Download,
  Eye,
  Trash2,
  Edit,
  Plus,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { auditService } from '@/lib/auditService';
import { UserActivity, AuditLog } from '@/lib/types';

interface UserActivityTrackerProps {
  userId?: string;
  showFilters?: boolean;
  limit?: number;
}

export const UserActivityTracker: React.FC<UserActivityTrackerProps> = ({
  userId,
  showFilters = true,
  limit = 50
}) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    action: '',
    entityType: '',
    dateRange: '7d'
  });

  useEffect(() => {
    loadData();
  }, [userId, filter, limit]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [userActivities, userAuditLogs] = await Promise.all([
        auditService.getUserActivities(userId, limit),
        userId ? auditService.getUserAuditLogs(userId, limit) : []
      ]);
      
      setActivities(userActivities);
      setAuditLogs(userAuditLogs);
    } catch (err) {
      setError('Failed to load user activities');
      console.error('Error loading user activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'LOGIN':
        return <Plus className="h-4 w-4" />;
      case 'UPDATE':
      case 'EDIT':
        return <Edit className="h-4 w-4" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4" />;
      case 'APPROVE':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECT':
        return <XCircle className="h-4 w-4" />;
      case 'SEARCH':
        return <Search className="h-4 w-4" />;
      case 'VIEW_REPORT':
        return <Eye className="h-4 w-4" />;
      case 'EXPORT':
        return <Download className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'LOGIN':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
      case 'EDIT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'APPROVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SEARCH':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'VIEW_REPORT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EXPORT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredActivities = activities.filter(activity => {
    if (filter.action && filter.action !== 'all' && activity.action !== filter.action) return false;
    if (filter.entityType && filter.entityType !== 'all' && activity.entityType !== filter.entityType) return false;
    return true;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    if (filter.action && filter.action !== 'all' && log.action !== filter.action) return false;
    if (filter.entityType && filter.entityType !== 'all' && log.entityType !== filter.entityType) return false;
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Activity Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          User Activity Tracking
          {userId && (
            <Badge variant="outline" className="ml-2">
              User ID: {userId}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="action-filter">Action</Label>
                <Select value={filter.action} onValueChange={(value) => setFilter(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="APPROVE">Approve</SelectItem>
                    <SelectItem value="REJECT">Reject</SelectItem>
                    <SelectItem value="SEARCH">Search</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="entity-filter">Entity Type</Label>
                <Select value={filter.entityType} onValueChange={(value) => setFilter(prev => ({ ...prev, entityType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date-filter">Date Range</Label>
                <Select value={filter.dateRange} onValueChange={(value) => setFilter(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activities">
              Activities ({filteredActivities.length})
            </TabsTrigger>
            <TabsTrigger value="audit">
              Audit Logs ({filteredAuditLogs.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="activities" className="mt-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No activities found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getActionIcon(activity.action)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getActionColor(activity.action)}>
                              {activity.action}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {activity.entityType}
                            </span>
                            {activity.entityName && (
                              <span className="text-sm font-medium">
                                {activity.entityName}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.userName} ({activity.userRole})
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(activity.timestamp)}
                            </span>
                            {activity.sessionId && (
                              <span>Session: {activity.sessionId.slice(-8)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="audit" className="mt-4">
            {filteredAuditLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No audit logs found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getActionColor(log.action)}>
                              {log.action}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {log.entityType}
                            </span>
                            {log.severity && (
                              <Badge className={getSeverityColor(log.severity)}>
                                {log.severity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {log.description}
                          </p>
                          {log.affectedFields && log.affectedFields.length > 0 && (
                            <div className="text-xs text-gray-600 mb-2">
                              <span className="font-medium">Changed fields:</span> {log.affectedFields.join(', ')}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.userName} ({log.userRole})
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(log.timestamp)}
                            </span>
                            {log.sessionId && (
                              <span>Session: {log.sessionId.slice(-8)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
