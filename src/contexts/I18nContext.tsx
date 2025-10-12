import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface I18nContextType {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Translation dictionary
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.samples': 'Samples',
    'nav.tests': 'Tests',
    'nav.suppliers': 'Suppliers',
    'nav.purchasing': 'Purchasing',
    'nav.tasks': 'Tasks',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    
    // Common
    'common.create': 'Create',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    
    // Sample Management
    'sample.title': 'Sample Management',
    'sample.sampleNo': 'Sample No.',
    'sample.itemNameEN': 'Item Name (EN)',
    'sample.itemNameAR': 'Item Name (AR)',
    'sample.supplier': 'Supplier',
    'sample.batchNumber': 'Batch Number',
    'sample.dateOfSample': 'Date of Sample',
    'sample.purpose': 'Purpose',
    'sample.status': 'Status',
    'sample.approved': 'Approved',
    'sample.storageLocation': 'Storage Location',
    'sample.pricing': 'Pricing',
    
    // Status Values
    'status.pending': 'Pending',
    'status.testing': 'Testing',
    'status.accepted': 'Accepted',
    'status.rejected': 'Rejected',
    
    // Test Management
    'test.personalUse': 'Personal Use',
    'test.industrial': 'Industrial',
    'test.topNote': 'Top Note',
    'test.baseNote': 'Base Note',
    'test.formula': 'Formula',
    'test.approve': 'Approve',
    
    // Purchasing
    'purchasing.requested': 'Requested',
    'purchasing.toBeOrdered': 'To Be Ordered',
    'purchasing.ordered': 'Ordered',
    
    // User Interface
    'ui.lightMode': 'Light Mode',
    'ui.darkMode': 'Dark Mode',
    'ui.english': 'English',
    'ui.arabic': 'العربية',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.samples': 'العينات',
    'nav.tests': 'الاختبارات',
    'nav.suppliers': 'الموردين',
    'nav.purchasing': 'المشتريات',
    'nav.tasks': 'المهام',
    'nav.analytics': 'التحليلات',
    'nav.settings': 'الإعدادات',
    
    // Common
    'common.create': 'إنشاء',
    'common.edit': 'تحرير',
    'common.delete': 'حذف',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات متاحة',
    
    // Sample Management
    'sample.title': 'إدارة العينات',
    'sample.sampleNo': 'رقم العينة',
    'sample.itemNameEN': 'اسم المنتج (إنجليزي)',
    'sample.itemNameAR': 'اسم المنتج (عربي)',
    'sample.supplier': 'المورد',
    'sample.batchNumber': 'رقم الدفعة',
    'sample.dateOfSample': 'تاريخ العينة',
    'sample.purpose': 'الغرض',
    'sample.status': 'الحالة',
    'sample.approved': 'معتمد',
    'sample.storageLocation': 'موقع التخزين',
    'sample.pricing': 'التسعير',
    
    // Status Values
    'status.pending': 'قيد الانتظار',
    'status.testing': 'قيد الاختبار',
    'status.accepted': 'مقبول',
    'status.rejected': 'مرفوض',
    
    // Test Management
    'test.personalUse': 'استخدام شخصي',
    'test.industrial': 'صناعي',
    'test.topNote': 'النوتة العلوية',
    'test.baseNote': 'النوتة الأساسية',
    'test.formula': 'التركيبة',
    'test.approve': 'اعتماد',
    
    // Purchasing
    'purchasing.requested': 'مطلوب',
    'purchasing.toBeOrdered': 'للطلب',
    'purchasing.ordered': 'تم الطلب',
    
    // User Interface
    'ui.lightMode': 'الوضع الفاتح',
    'ui.darkMode': 'الوضع الداكن',
    'ui.english': 'English',
    'ui.arabic': 'العربية',
  }
};

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('nbslims_language') as 'en' | 'ar';
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Update document direction and language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: 'en' | 'ar') => {
    setLanguageState(lang);
    localStorage.setItem('nbslims_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const translation = translations[language][key as keyof typeof translations['en']];
    return translation || fallback || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const value = {
    language,
    setLanguage,
    t,
    dir
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};