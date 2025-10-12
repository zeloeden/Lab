import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  user?: {
    id: string;
    fullName?: string;
    name?: string;
    profilePhoto?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '', 
  onClick 
}) => {
  if (!user) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`} onClick={onClick}>
        <AvatarFallback className="bg-gray-200 text-gray-600">
          ?
        </AvatarFallback>
      </Avatar>
    );
  }

  const displayName = user.fullName || user.name || 'Unknown';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={`${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {user.profilePhoto && (
        <AvatarImage 
          src={user.profilePhoto} 
          alt={`${displayName}'s profile`}
          className="object-cover"
        />
      )}
      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};