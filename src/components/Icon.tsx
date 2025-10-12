import React from 'react';
import { useIcons } from '@/contexts/IconContext';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, className = '', style = {} }) => {
  const { currentPack, getIcon } = useIcons();
  const IconComponent = getIcon(name);

  // Apply pack-specific styling
  const getPackStyle = (): React.CSSProperties => {
    const baseStyle = { width: size, height: size, ...style };

    switch (currentPack.style) {
      case 'fluent':
        return {
          ...baseStyle,
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
          color: '#0078D4'
        };
      
      case 'iphone':
        return {
          ...baseStyle,
          borderRadius: '20%',
          padding: '2px',
          background: 'linear-gradient(135deg, #007AFF 0%, #005BBB 100%)',
          color: 'white',
          filter: 'drop-shadow(0 2px 4px rgba(0, 122, 255, 0.3))'
        };
      
      case 'glassy':
        return {
          ...baseStyle,
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '4px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        };
      
      case 'modern':
        return {
          ...baseStyle,
          strokeWidth: 1.5,
          filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.05))',
          color: '#1F2937'
        };
      
      default:
        return baseStyle;
    }
  };

  return (
    <IconComponent
      size={size}
      className={className}
      style={getPackStyle()}
    />
  );
};

export default Icon;
