import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionIconProps {
  icon: LucideIcon;
  className?: string;
}

export const SectionIcon: React.FC<SectionIconProps> = ({ icon: Icon, className }) => {
  return (
    <Icon 
      size={18} 
      strokeWidth={1.5} 
      className={cn('text-current', className)} 
    />
  );
};
