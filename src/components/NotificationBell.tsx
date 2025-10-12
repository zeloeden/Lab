import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/TaskContext';
import { useSound } from '@/contexts/SoundContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellRing, 
  CheckSquare, 
  MessageSquare, 
  UserPlus, 
  CheckCircle2,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { getUserNotifications, getUnreadNotificationsCount, markNotificationAsRead } = useTask();
  const { settings, updateSettings, playNotificationSound } = useSound();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = user ? getUserNotifications(user.id) : [];
  const unreadCount = user ? getUnreadNotificationsCount(user.id) : 0;

  // Expose sound functions globally for TaskContext
  useEffect(() => {
    (window as any).playTaskSound = (type: 'assigned' | 'completed' | 'updated') => {
      if (settings.taskSounds) {
        switch (type) {
          case 'assigned':
            playNotificationSound();
            break;
          case 'completed':
            playNotificationSound();
            break;
          case 'updated':
            playNotificationSound();
            break;
        }
      }
    };

    (window as any).playCommentSound = () => {
      if (settings.commentSounds) {
        playNotificationSound();
      }
    };

    return () => {
      delete (window as any).playTaskSound;
      delete (window as any).playCommentSound;
    };
  }, [settings.taskSounds, settings.commentSounds, playNotificationSound]);

  // Play sound when new notifications arrive
  useEffect(() => {
    if (settings.notificationSounds && unreadCount > lastNotificationCount && lastNotificationCount > 0) {
      playNotificationSound();
    }
    setLastNotificationCount(unreadCount);
  }, [unreadCount, lastNotificationCount, settings.notificationSounds, playNotificationSound]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSound = useCallback(() => {
    updateSettings({ notificationSounds: !settings.notificationSounds });
  }, [settings.notificationSounds, updateSettings]);

  const handleNotificationClick = useCallback((notification: any) => {
    // Mark as read
    markNotificationAsRead(notification.id);
    
    // Navigate to the relevant page
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('/tasks')) {
        navigate('/tasks');
      } else {
        navigate(notification.actionUrl);
      }
    } else {
      // Default navigation based on notification type
      switch (notification.type) {
        case 'task_assigned':
        case 'task_updated':
        case 'task_completed':
        case 'comment_added':
          navigate('/tasks');
          break;
        default:
          navigate('/dashboard');
      }
    }
    
    setIsOpen(false);
  }, [markNotificationAsRead, navigate]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'task_updated':
        return <CheckSquare className="h-4 w-4 text-orange-500" />;
      case 'task_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const markAllAsRead = useCallback(() => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
    });
  }, [notifications, markNotificationAsRead]);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleSound}
                  className="p-1"
                  title={settings.notificationSounds ? 'Disable notification sounds' : 'Enable notification sounds'}
                >
                  {settings.notificationSounds ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto mt-1"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-96">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${
                          !notification.read ? 'text-gray-700' : 'text-gray-500'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-center text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    navigate('/tasks');
                    setIsOpen(false);
                  }}
                >
                  View all tasks
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};