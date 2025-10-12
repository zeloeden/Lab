import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IconPack, getCurrentIconPack, setIconPack, availableIconPacks } from '@/lib/iconPacks';
import * as LucideIcons from 'lucide-react';

// Import Fluent UI System Icons
// Note: In a real implementation, you would install @fluentui/react-icons
// For now, we'll create mappings to existing Lucide icons with Fluent styling

interface IconContextType {
  currentPack: IconPack;
  availablePacks: IconPack[];
  changeIconPack: (packId: string) => void;
  getIcon: (iconName: string) => React.ComponentType<any>;
}

const IconContext = createContext<IconContextType | undefined>(undefined);

export const useIcons = () => {
  const context = useContext(IconContext);
  if (!context) {
    throw new Error('useIcons must be used within an IconProvider');
  }
  return context;
};

export const IconProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPack, setCurrentPack] = useState<IconPack>(getCurrentIconPack());

  useEffect(() => {
    const handleIconPackChange = (event: CustomEvent) => {
      const newPack = availableIconPacks.find(pack => pack.id === event.detail);
      if (newPack) {
        setCurrentPack(newPack);
      }
    };

    window.addEventListener('iconPackChanged', handleIconPackChange as EventListener);
    return () => {
      window.removeEventListener('iconPackChanged', handleIconPackChange as EventListener);
    };
  }, []);

  const changeIconPack = (packId: string) => {
    setIconPack(packId);
    const newPack = availableIconPacks.find(pack => pack.id === packId);
    if (newPack) {
      setCurrentPack(newPack);
      // Dispatch custom event to notify all components
      window.dispatchEvent(new CustomEvent('iconPackChanged', { detail: packId }));
    }
  };

  const getIcon = (iconName: string): React.ComponentType<any> => {
    const iconMapping: Record<string, any> = {
      // Navigation icons
      dashboard: LucideIcons.LayoutDashboard,
      samples: LucideIcons.FlaskConical,
      tests: LucideIcons.TestTube,
      suppliers: LucideIcons.Building2,
      purchasing: LucideIcons.ShoppingCart,
      tasks: LucideIcons.CheckSquare,
      settings: LucideIcons.Settings,
      
      // Test-specific icons
      'personal-use': LucideIcons.User,
      'industrial': LucideIcons.Factory,
      'test-tube': LucideIcons.TestTube,
      'beaker': LucideIcons.Beaker,
      'flask': LucideIcons.FlaskConical,
      
      // Action icons
      add: LucideIcons.Plus,
      edit: LucideIcons.Edit,
      delete: LucideIcons.Trash2,
      save: LucideIcons.Save,
      cancel: LucideIcons.X,
      search: LucideIcons.Search,
      filter: LucideIcons.Filter,
      print: LucideIcons.Printer,
      export: LucideIcons.Download,
      
      // User icons
      user: LucideIcons.User,
      users: LucideIcons.Users,
      mail: LucideIcons.Mail,
      phone: LucideIcons.Phone,
      
      // Other icons
      calendar: LucideIcons.Calendar,
      package: LucideIcons.Package,
      location: LucideIcons.MapPin,
      eye: LucideIcons.Eye,
      book: LucideIcons.BookOpen,
      clock: LucideIcons.Clock,
      check: LucideIcons.CheckCircle,
      alert: LucideIcons.AlertTriangle,
      plus: LucideIcons.Plus,
      minus: LucideIcons.Minus,
      arrow: LucideIcons.ArrowRight,
      star: LucideIcons.Star,
      target: LucideIcons.Target,
      refresh: LucideIcons.RefreshCw
    };

    return iconMapping[iconName] || LucideIcons.HelpCircle;
  };

  return (
    <IconContext.Provider
      value={{
        currentPack,
        availablePacks: availableIconPacks,
        changeIconPack,
        getIcon
      }}
    >
      {children}
    </IconContext.Provider>
  );
};

// Enhanced Icon component that applies current pack styling
export const Icon: React.FC<{
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ name, size = 20, className = '', style = {} }) => {
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
