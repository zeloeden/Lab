import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/Icon';
import { prefetchRoute } from '@/lib/prefetchRoute';

interface NavItem {
  key: string;
  path: string;
  iconName: string;
  label: string;
  labelAR: string;
  resource: string;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    key: 'dashboard',
    path: '/dashboard',
    iconName: 'dashboard',
    label: 'Dashboard',
    labelAR: 'لوحة التحكم',
    resource: 'analytics'
  },
  {
    key: 'samples',
    path: '/samples',
    iconName: 'samples',
    label: 'Samples',
    labelAR: 'العينات',
    resource: 'samples'
  },
  {
    key: 'test-management',
    path: '/test-management',
    iconName: 'tests',
    label: 'Tests',
    labelAR: 'الاختبارات',
    resource: 'tests'
  },
  {
    key: 'formulas',
    path: '/formulas',
    iconName: 'beaker',
    label: 'Formulas',
    labelAR: 'التركيبات',
    resource: 'formulas'
  },
  {
    key: 'raw-materials',
    path: '/raw-materials',
    iconName: 'package',
    label: 'Raw Materials',
    labelAR: 'المواد الخام',
    resource: 'raw-materials'
  },
  {
    key: 'finished-goods',
    path: '/finished-goods',
    iconName: 'package',
    label: 'Finished Goods',
    labelAR: 'المنتجات النهائية',
    resource: 'samples'
  },
  {
    key: 'labels',
    path: '/labels',
    iconName: 'print',
    label: 'Labels',
    labelAR: 'الملصقات',
    resource: 'samples'
  },
  {
    key: 'suppliers',
    path: '/suppliers',
    iconName: 'suppliers',
    label: 'Suppliers',
    labelAR: 'الموردين',
    resource: 'suppliers'
  },
  {
    key: 'customers',
    path: '/customers',
    iconName: 'users',
    label: 'Customers',
    labelAR: 'العملاء',
    resource: 'customers'
  },
  {
    key: 'purchasing',
    path: '/purchasing',
    iconName: 'purchasing',
    label: 'Purchasing',
    labelAR: 'المشتريات',
    resource: 'purchasing'
  },
  {
    key: 'requested-items',
    path: '/requested-items',
    iconName: 'package',
    label: 'Requested Items',
    labelAR: 'الطلبات المطلوبة',
    resource: 'purchasing'
  },
  {
    key: 'tasks',
    path: '/tasks',
    iconName: 'tasks',
    label: 'Tasks',
    labelAR: 'المهام',
    resource: 'tasks'
  },
  {
    key: 'analytics',
    path: '/analytics',
    iconName: 'dashboard',
    label: 'Analytics',
    labelAR: 'التحليلات',
    resource: 'analytics'
  },
  {
    key: 'settings',
    path: '/settings',
    iconName: 'settings',
    label: 'Settings',
    labelAR: 'الإعدادات',
    resource: 'settings'
  }
];

export const Navigation: React.FC = () => {
  const { hasPermission } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState('/src/assets/logo.png');

  // Update logo based on theme
  useEffect(() => {
    const updateLogo = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setLogoUrl(isDark ? '/src/assets/logog.png' : '/src/assets/logo.png');
    };

    // Initial check
    updateLogo();

    // Watch for theme changes
    const observer = new MutationObserver(updateLogo);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Get current active item based on current path
  const getActiveItem = () => {
    const currentPath = location.pathname;
    if (currentPath === '/' || currentPath === '/dashboard') return 'dashboard';
    
    const activeItem = navItems.find(item => item.path === currentPath);
    return activeItem?.key || 'dashboard';
  };

  const activeItem = getActiveItem();

  const visibleItems = navItems.filter(item => 
    hasPermission(item.resource, 'read')
  );

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const prefetchForPath = (path: string) => {
    switch (path) {
      case '/samples':
        return prefetchRoute(() => import('@/pages/Samples'));
      case '/test-management':
        return prefetchRoute(() => import('@/pages/TestManagement'));
      case '/formulas':
        return prefetchRoute(() => import('@/pages/Formulas'));
      case '/formula-first':
        return prefetchRoute(() => import('@/pages/FormulaFirst'));
      case '/suppliers':
        return prefetchRoute(() => import('@/pages/Suppliers'));
      case '/purchasing':
        return prefetchRoute(() => import('@/pages/Purchasing'));
      case '/requested-items':
        return prefetchRoute(() => import('@/pages/RequestedItems'));
      case '/tasks':
        return prefetchRoute(() => import('@/pages/Tasks'));
      case '/settings':
        return prefetchRoute(() => import('@/pages/Settings'));
      case '/analytics':
        return prefetchRoute(() => import('@/pages/Analytics'));
      case '/finished-goods':
        return prefetchRoute(() => import('@/pages/FinishedGoods'));
      default:
        return;
    }
  };

  return (
    <nav className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-20 h-13 rounded-lg flex items-center justify-center">
            <img src={logoUrl} alt="NBS LIMS" className="w-20 h-13"/>
          </div>
          <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              NBS LIMS
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('nav.subtitle', 'Laboratory Management')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 py-6 space-y-2">
        {visibleItems.map((item) => (
          <Button
            key={item.key}
            variant={activeItem === item.key ? "default" : "ghost"}
            className={`w-full justify-start h-12 px-4 cursor-pointer transition-all duration-200 ${
              activeItem === item.key 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-md' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => handleNavigation(item.path)}
            onPointerEnter={() => prefetchForPath(item.path)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <Icon name={item.iconName} size={20} />
                <span className="font-medium">
                  {language === 'ar' ? item.labelAR : item.label}
                </span>
              </div>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </div>
          </Button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>NBS LIMS v1.0</p>
          <p>{t('nav.footer', 'Laboratory Information Management System')}</p>
        </div>
      </div>
    </nav>
  );
};