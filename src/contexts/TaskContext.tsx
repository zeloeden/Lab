import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  attachments: TaskAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string[];
  assignedBy: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  involvedUsers: string[]; // Users who should receive notifications
}

export interface TaskNotification {
  id: string;
  userId: string;
  taskId: string;
  type: 'task_assigned' | 'task_updated' | 'comment_added' | 'task_completed';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

interface TaskContextType {
  tasks: Task[];
  notifications: TaskNotification[];
  users: Array<{ id: string; name: string; email: string; role: string }>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments' | 'involvedUsers'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addComment: (taskId: string, content: string, attachments?: TaskAttachment[]) => void;
  addAttachment: (taskId: string, attachment: Omit<TaskAttachment, 'id' | 'uploadedAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  getUnreadNotificationsCount: (userId: string) => number;
  getUserNotifications: (userId: string) => TaskNotification[];
  searchUsers: (query: string) => Array<{ id: string; name: string; email: string; role: string }>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Mock users data - in real app this would come from user management
const mockUsers = [
  { id: 'user-admin', name: 'System Administrator', email: 'admin@nbslims.com', role: 'Admin' },
  { id: 'user-lablead', name: 'Laboratory Lead', email: 'lablead@nbslims.com', role: 'Lab Lead' },
  { id: 'user-tech', name: 'Laboratory Technician', email: 'tech@nbslims.com', role: 'Technician' },
  { id: 'user-analyst', name: 'Lab Analyst', email: 'analyst@nbslims.com', role: 'Technician' },
  { id: 'user-supervisor', name: 'Lab Supervisor', email: 'supervisor@nbslims.com', role: 'Lab Lead' }
];

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Complete water quality analysis for Sample #WQ-2024-001',
    description: 'Analyze pH, turbidity, and chemical composition for the water sample received from Site A.',
    notes: 'Priority sample - client requested expedited results',
    priority: 'high',
    status: 'in-progress',
    assignedTo: ['user-tech'],
    assignedBy: 'user-lablead',
    createdBy: 'user-lablead',
    createdAt: new Date('2024-01-20T10:00:00Z'),
    updatedAt: new Date('2024-01-20T10:00:00Z'),
    dueDate: new Date('2024-01-25T17:00:00Z'),
    comments: [],
    attachments: [],
    involvedUsers: ['user-lablead', 'user-tech']
  },
  {
    id: '2',
    title: 'Review test results for pharmaceutical batch PH-2024-045',
    description: 'Quality control review for batch release approval.',
    notes: 'Check against specification limits and regulatory requirements',
    priority: 'medium',
    status: 'pending',
    assignedTo: ['user-analyst'],
    assignedBy: 'user-admin',
    createdBy: 'user-admin',
    createdAt: new Date('2024-01-19T14:30:00Z'),
    updatedAt: new Date('2024-01-19T14:30:00Z'),
    dueDate: new Date('2024-01-26T12:00:00Z'),
    comments: [],
    attachments: [],
    involvedUsers: ['user-admin', 'user-analyst']
  }
];

// Helper functions for localStorage
const STORAGE_KEYS = {
  TASKS: 'nbslims_tasks',
  NOTIFICATIONS: 'nbslims_notifications'
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return JSON.parse(stored, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.TASKS, initialTasks));
  const [notifications, setNotifications] = useState<TaskNotification[]>(() => loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, []));
  const users = mockUsers;

  // Save to localStorage whenever tasks or notifications change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  const createNotification = useCallback((
    userId: string,
    taskId: string,
    type: TaskNotification['type'],
    title: string,
    message: string,
    actionUrl?: string
  ) => {
    const notification: TaskNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      taskId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      actionUrl
    };

    setNotifications(prev => [notification, ...prev]);
    
    // Show toast notification
    toast.info(`New notification: ${title}`);
    
    // Play sound using global sound system
    if ((window as any).playTaskSound) {
      switch (type) {
        case 'task_assigned':
          (window as any).playTaskSound('assigned');
          break;
        case 'task_completed':
          (window as any).playTaskSound('completed');
          break;
        case 'task_updated':
          (window as any).playTaskSound('updated');
          break;
        case 'comment_added':
          (window as any).playCommentSound();
          break;
      }
    }
    
    // In a real app, this would also send email notifications
    console.log(`Email notification sent to user ${userId}: ${title}`);
  }, []);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments' | 'involvedUsers'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      attachments: [],
      involvedUsers: [taskData.createdBy, ...taskData.assignedTo]
    };

    setTasks(prev => [newTask, ...prev]);

    // Send notifications to assigned users
    taskData.assignedTo.forEach(userId => {
      if (userId !== taskData.createdBy) {
        const assignedUser = users.find(u => u.id === userId);
        const createdByUser = users.find(u => u.id === taskData.createdBy);
        
        createNotification(
          userId,
          newTask.id,
          'task_assigned',
          'New Task Assigned',
          `${createdByUser?.name || 'Someone'} assigned you a new task: "${taskData.title}"`,
          `/tasks/${newTask.id}`
        );
      }
    });

    toast.success('Task created successfully');
  }, [users, createNotification]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, ...updates, updatedAt: new Date() };
        
        // If status changed to completed, notify involved users
        if (updates.status === 'completed' && task.status !== 'completed') {
          task.involvedUsers.forEach(userId => {
            if (userId !== updates.assignedBy) {
              createNotification(
                userId,
                taskId,
                'task_completed',
                'Task Completed',
                `Task "${task.title}" has been completed`,
                `/tasks/${taskId}`
              );
            }
          });
        }

        // If assigned users changed, notify new assignees
        if (updates.assignedTo && JSON.stringify(updates.assignedTo) !== JSON.stringify(task.assignedTo)) {
          const newAssignees = updates.assignedTo.filter(userId => !task.assignedTo.includes(userId));
          newAssignees.forEach(userId => {
            const assignedUser = users.find(u => u.id === userId);
            createNotification(
              userId,
              taskId,
              'task_assigned',
              'Task Assigned',
              `You have been assigned to task: "${task.title}"`,
              `/tasks/${taskId}`
            );
          });
        }

        return updatedTask;
      }
      return task;
    }));

    toast.success('Task updated successfully');
  }, [users, createNotification]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast.success('Task deleted successfully');
  }, []);

  const addComment = useCallback((taskId: string, content: string, attachments: TaskAttachment[] = []) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // This would normally get current user from auth context
    const currentUser = users[0]; // Mock current user as admin

    const comment: TaskComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      content,
      attachments,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, comments: [...task.comments, comment], updatedAt: new Date() }
        : task
    ));

    // Notify all involved users except the comment author
    task.involvedUsers.forEach(userId => {
      if (userId !== currentUser.id) {
        createNotification(
          userId,
          taskId,
          'comment_added',
          'New Comment',
          `${currentUser.name} added a comment to task: "${task.title}"`,
          `/tasks/${taskId}`
        );
      }
    });

    toast.success('Comment added successfully');
  }, [tasks, users, createNotification]);

  const addAttachment = useCallback((taskId: string, attachment: Omit<TaskAttachment, 'id' | 'uploadedAt'>) => {
    const newAttachment: TaskAttachment = {
      ...attachment,
      id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date()
    };

    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, attachments: [...task.attachments, newAttachment], updatedAt: new Date() }
        : task
    ));

    toast.success('Attachment added successfully');
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  }, []);

  const getUnreadNotificationsCount = useCallback((userId: string) => {
    return notifications.filter(notif => notif.userId === userId && !notif.read).length;
  }, [notifications]);

  const getUserNotifications = useCallback((userId: string) => {
    return notifications
      .filter(notif => notif.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [notifications]);

  const searchUsers = useCallback((query: string) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
  }, [users]);

  const value: TaskContextType = {
    tasks,
    notifications,
    users,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    addAttachment,
    markNotificationAsRead,
    getUnreadNotificationsCount,
    getUserNotifications,
    searchUsers
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};