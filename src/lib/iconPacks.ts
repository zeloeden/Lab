// Advanced Icon Pack System for NBS LIMS
// Supports multiple icon styles: Fluent UI, iPhone, Glassy, Modern

export interface IconPack {
  id: string;
  name: string;
  description: string;
  style: 'fluent' | 'iphone' | 'glassy' | 'modern' | 'default';
  icons: Record<string, React.ComponentType<any>>;
  preview: string; // Base64 or URL for preview
}

export interface IconMapping {
  // Core navigation icons
  dashboard: string;
  samples: string;
  tests: string;
  suppliers: string;
  purchasing: string;
  tasks: string;
  settings: string;
  
  // Action icons
  add: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  search: string;
  filter: string;
  print: string;
  export: string;
  
  // Status icons
  success: string;
  warning: string;
  error: string;
  info: string;
  pending: string;
  
  // Data icons
  file: string;
  folder: string;
  image: string;
  document: string;
  barcode: string;
  qrcode: string;
  
  // UI icons
  chevronUp: string;
  chevronDown: string;
  chevronLeft: string;
  chevronRight: string;
  close: string;
  menu: string;
  more: string;
  
  // Business icons
  package: string;
  building: string;
  user: string;
  users: string;
  mail: string;
  phone: string;
  calendar: string;
  clock: string;
  location: string;
  
  // Lab specific icons
  flask: string;
  microscope: string;
  scale: string;
  thermometer: string;
  tube: string;
  chemical: string;
}

// Default Lucide icons mapping
export const defaultIconPack: IconPack = {
  id: 'default',
  name: 'Default (Lucide)',
  description: 'Current Lucide React icons',
  style: 'default',
  preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+',
  icons: {} // Will be populated with current Lucide icons
};

// Fluent UI System Icons pack
export const fluentIconPack: IconPack = {
  id: 'fluent',
  name: 'Fluent UI System',
  description: 'Microsoft Fluent UI System Icons - modern and familiar',
  style: 'fluent',
  preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMDA3OEQ0Ii8+Cjwvc3ZnPg==',
  icons: {
    // Core navigation - Fluent style
    dashboard: 'home-20-filled',
    samples: 'beaker-20-filled',
    tests: 'test-tube-20-filled',
    suppliers: 'building-20-filled',
    purchasing: 'shopping-cart-20-filled',
    tasks: 'task-list-20-filled',
    settings: 'settings-20-filled',
    
    // Actions - Fluent style
    add: 'add-circle-20-filled',
    edit: 'edit-20-filled',
    delete: 'delete-20-filled',
    save: 'save-20-filled',
    cancel: 'dismiss-circle-20-filled',
    search: 'search-20-filled',
    filter: 'filter-20-filled',
    print: 'print-20-filled',
    export: 'arrow-export-20-filled'
  }
};

// iPhone-style icons pack
export const iphoneIconPack: IconPack = {
  id: 'iphone',
  name: 'iPhone Style',
  description: 'iOS-inspired rounded and clean icons',
  style: 'iphone',
  preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSIzIiByeD0iNCIgZmlsbD0iIzAwN0FGRiIvPgo8L3N2Zz4=',
  icons: {
    dashboard: 'house.fill',
    samples: 'flask.fill',
    tests: 'testtube.2.fill',
    suppliers: 'building.2.fill',
    purchasing: 'cart.fill',
    tasks: 'checklist',
    settings: 'gear.fill'
  }
};

// Glassy/Glass morphism icons pack
export const glassyIconPack: IconPack = {
  id: 'glassy',
  name: 'Glassy Modern',
  description: 'Glass morphism style with transparency effects',
  style: 'glassy',
  preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0iZ2xhc3MiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuMyk7c3RvcC1vcGFjaXR5OjEiIC8+CjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjEpO3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjgiIGZpbGw9InVybCgjZ2xhc3MpIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==',
  icons: {
    dashboard: 'glass-home',
    samples: 'glass-beaker',
    tests: 'glass-test',
    suppliers: 'glass-building',
    purchasing: 'glass-cart',
    tasks: 'glass-tasks',
    settings: 'glass-settings'
  }
};

// Modern minimalist icons pack
export const modernIconPack: IconPack = {
  id: 'modern',
  name: 'Modern Minimalist',
  description: 'Ultra-modern minimalist design with clean lines',
  style: 'modern',
  preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgM0gyMVYyMUgzVjNaIiBzdHJva2U9IiMxRjJBMzciIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTkgOUgxNVYxNUg5VjlaIiBmaWxsPSIjMUYyQTM3Ii8+Cjwvc3ZnPg==',
  icons: {
    dashboard: 'modern-grid',
    samples: 'modern-sample',
    tests: 'modern-test',
    suppliers: 'modern-supplier',
    purchasing: 'modern-cart',
    tasks: 'modern-list',
    settings: 'modern-cog'
  }
};

export const availableIconPacks: IconPack[] = [
  defaultIconPack,
  fluentIconPack,
  iphoneIconPack,
  glassyIconPack,
  modernIconPack
];

export const getIconPack = (packId: string): IconPack => {
  return availableIconPacks.find(pack => pack.id === packId) || defaultIconPack;
};

export const getCurrentIconPack = (): IconPack => {
  const savedPackId = localStorage.getItem('nbslims_icon_pack') || 'default';
  return getIconPack(savedPackId);
};

export const setIconPack = (packId: string): void => {
  localStorage.setItem('nbslims_icon_pack', packId);
  // Trigger a custom event to notify components of icon pack change
  window.dispatchEvent(new CustomEvent('iconPackChanged', { detail: packId }));
};
