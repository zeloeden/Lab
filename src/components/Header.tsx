import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from './UserAvatar';
import { NotificationBell } from './NotificationBell';
import { Icon } from '@/components/Icon';
import { LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScaleStatusChip } from './ScaleStatusChip';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/settings');
  };

  const handleThemeToggle = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />;
    }
    return actualTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">NBS LIMS</h1>
          <Badge variant="outline" className="text-xs">
            Laboratory Information Management System
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Scale status chip */}
          <ScaleStatusChip />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleThemeToggle}
            className="p-2"
            title={`Current theme: ${theme} (${actualTheme})`}
          >
            {getThemeIcon()}
          </Button>
          
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* User Profile Section */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
            </div>
            
            <UserAvatar 
              user={user} 
              size="md" 
              onClick={handleProfileClick}
              className="ring-2 ring-offset-2 ring-transparent hover:ring-blue-200 transition-all"
            />
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleProfileClick}
                className="p-2"
              >
                <Icon name="settings" size={16} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};