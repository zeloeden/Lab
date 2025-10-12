import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/TaskContext';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/UserAvatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  CheckSquare,
  Plus,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Send,
  X,
  AtSign,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { PrioritySelector, PriorityValue } from '@/components/PrioritySelector';

export function Tasks() {
  const { user } = useAuth();
  const { 
    tasks, 
    users, 
    addTask, 
    updateTask, 
    deleteTask, 
    addComment, 
    addAttachment,
    searchUsers 
  } = useTask();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    notes: '',
    priority: 'medium' as PriorityValue,
    assignedTo: [] as string[],
    dueDate: ''
  });

  const canAssignTasks = user?.role === 'Admin' || user?.role === 'Lab Lead';

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

  const tasksByStatus = {
    pending: tasks.filter(task => task.status === 'pending'),
    'in-progress': tasks.filter(task => task.status === 'in-progress'),
    completed: tasks.filter(task => task.status === 'completed'),
    overdue: tasks.filter(task => task.status === 'overdue')
  };

  const handleAddTask = useCallback(() => {
    if (!newTask.title.trim() || !newTask.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    if (!canAssignTasks && newTask.assignedTo.length === 0) {
      // If user can't assign tasks, assign to themselves
      newTask.assignedTo = [user?.id || ''];
    }

    addTask({
      ...newTask,
      assignedBy: user?.id || '',
      createdBy: user?.id || '',
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    setNewTask({
      title: '',
      description: '',
      notes: '',
      priority: 'medium' as PriorityValue,
      assignedTo: [],
      dueDate: ''
    });
    setIsAddDialogOpen(false);
  }, [newTask, user, canAssignTasks, addTask]);

  const handleStatusChange = useCallback((taskId: string, newStatus: string) => {
    updateTask(taskId, { status: newStatus as any });
  }, [updateTask]);

  const handleCommentSubmit = useCallback((taskId: string) => {
    if (!commentText.trim()) return;

    addComment(taskId, commentText);
    setCommentText('');
  }, [commentText, addComment]);

  const handleFileUpload = useCallback((taskId: string, files: FileList) => {
    Array.from(files).forEach(file => {
      const attachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedBy: user?.fullName || 'Unknown'
      };
      addAttachment(taskId, attachment);
    });
  }, [user, addAttachment]);

  const handleMentionInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setCommentText(value);

    // Check if user is typing @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setUserSearchQuery(mentionMatch[1]);
      setMentionPosition(cursorPosition - mentionMatch[1].length - 1);
      setShowUserSuggestions(true);
    } else {
      setShowUserSuggestions(false);
    }
  }, []);

  const handleUserSelect = useCallback((selectedUser: any) => {
    const beforeMention = commentText.substring(0, mentionPosition);
    const afterMention = commentText.substring(commentInputRef.current?.selectionStart || 0);
    const newText = `${beforeMention}@${selectedUser.name} ${afterMention}`;
    
    setCommentText(newText);
    setShowUserSuggestions(false);
    setUserSearchQuery('');
    
    // Focus back to textarea
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 0);
  }, [commentText, mentionPosition]);

  const filteredUsers = searchUsers(userSearchQuery);


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const selectedTaskData = selectedTask ? tasks.find(t => t.id === selectedTask) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Task Management</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={() => {
          // Prevent closing on outside click - only close via explicit actions
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Create a new task and assign it to team members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newTask.notes}
                  onChange={(e) => setNewTask(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or instructions"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <PrioritySelector
                    value={newTask.priority as PriorityValue}
                    onChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                    placeholder="Select priority"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              {canAssignTasks && (
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <div className="space-y-2">
                    {users.map(taskUser => (
                      <div key={taskUser.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`assign-${taskUser.id}`}
                          checked={newTask.assignedTo.includes(taskUser.id)}
                          onChange={() => {
                            setNewTask(prev => ({
                              ...prev,
                              assignedTo: prev.assignedTo.includes(taskUser.id)
                                ? prev.assignedTo.filter(id => id !== taskUser.id)
                                : [...prev.assignedTo, taskUser.id]
                            }));
                          }}
                        />
                        <Label htmlFor={`assign-${taskUser.id}`} className="flex items-center space-x-2">
                          <UserAvatar user={{ id: taskUser.id, name: taskUser.name }} size="sm" />
                          <span>{taskUser.name}</span>
                          <Badge variant="outline" className="text-xs">{taskUser.role}</Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTask}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus['in-progress'].length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus.completed.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksByStatus.overdue.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="text-sm font-medium capitalize">
                {status.replace('-', ' ')} ({statusTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => setSelectedTask(task.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                      <PrioritySelector
                        value={task.priority as PriorityValue}
                        onChange={(value) => {
                          // Update task priority (convert critical to high for task compatibility)
                          const taskPriority = value === 'critical' ? 'high' : value as 'low' | 'medium' | 'high';
                          updateTask(task.id, { priority: taskPriority });
                          
                          // Trigger a custom event to notify other components
                          window.dispatchEvent(new CustomEvent('taskUpdated', { 
                            detail: { taskId: task.id, field: 'priority', value: taskPriority }
                          }));
                        }}
                        className="w-24"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{task.assignedTo.length} assigned</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateTime(task.dueDate).split(',')[0]}</span>
                      </div>
                    </div>
                    {task.comments.length > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{task.comments.length} comments</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => {
        // Prevent closing on outside click - only close via explicit actions
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTaskData && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedTaskData.title}</span>
                  <div className="flex items-center space-x-2">
                    <PrioritySelector
                      value={selectedTaskData.priority as PriorityValue}
                      onChange={(value) => {
                        // Update selected task priority (convert critical to high for task compatibility)
                        const taskPriority = value === 'critical' ? 'high' : value as 'low' | 'medium' | 'high';
                        updateTask(selectedTaskData.id, { priority: taskPriority });
                        
                        // Trigger a custom event to notify other components
                        window.dispatchEvent(new CustomEvent('taskUpdated', { 
                          detail: { taskId: selectedTaskData.id, field: 'priority', value: taskPriority }
                        }));
                      }}
                      className="w-32"
                    />
                    <Select
                      value={selectedTaskData.status}
                      onValueChange={(value) => handleStatusChange(selectedTaskData.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Created by {users.find(u => u.id === selectedTaskData.createdBy)?.name} on {formatDateTime(selectedTaskData.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Task Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600">{selectedTaskData.description}</p>
                  </div>
                  
                  {selectedTaskData.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-gray-600">{selectedTaskData.notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Assigned To</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTaskData.assignedTo.map(userId => {
                          const assignedUser = users.find(u => u.id === userId);
                          return assignedUser ? (
                            <div key={userId} className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                              <UserAvatar user={{ id: assignedUser.id, name: assignedUser.name }} size="sm" />
                              <span className="text-sm">{assignedUser.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Due Date</h4>
                      <p className="text-gray-600">{formatDateTime(selectedTaskData.dueDate)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Comments Section */}
                <div className="space-y-4">
                  <h4 className="font-medium">Comments ({selectedTaskData.comments.length})</h4>
                  
                  {/* Comment Input */}
                  <div className="space-y-2 relative">
                    <Textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={handleMentionInput}
                      placeholder="Add a comment... Use @ to mention users"
                      rows={3}
                    />
                    
                    {/* User Suggestions */}
                    {showUserSuggestions && filteredUsers.length > 0 && (
                      <div className="absolute z-10 bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                        {filteredUsers.map(taskUser => (
                          <div
                            key={taskUser.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleUserSelect(taskUser)}
                          >
                            <UserAvatar user={{ id: taskUser.id, name: taskUser.name }} size="sm" />
                            <div>
                              <div className="text-sm font-medium">{taskUser.name}</div>
                              <div className="text-xs text-gray-500">{taskUser.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleFileUpload(selectedTaskData.id, e.target.files);
                            }
                          }}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCommentSubmit(selectedTaskData.id)}
                        disabled={!commentText.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {selectedTaskData.comments.map(comment => (
                      <div key={comment.id} className="flex space-x-3">
                        <UserAvatar user={{ id: comment.userId, name: comment.userName }} size="md" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{comment.userName}</span>
                            <Badge variant="outline" className="text-xs">{comment.userRole}</Badge>
                            <span className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                          {comment.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {comment.attachments.map(attachment => (
                                <div key={attachment.id} className="flex items-center space-x-2 text-xs bg-gray-50 rounded p-2">
                                  <FileText className="h-4 w-4" />
                                  <span>{attachment.name}</span>
                                  <span className="text-gray-500">({formatFileSize(attachment.size)})</span>
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}