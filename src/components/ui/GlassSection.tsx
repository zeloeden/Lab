import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppearance, Variant } from '@/providers/AppearanceProvider';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Import pattern assets
import brandTiles from '@/assets/patterns/brandTiles.svg';
import brandDense from '@/assets/patterns/brandDense.svg';
import brandRows from '@/assets/patterns/brandRows.svg';

interface GlassSectionProps {
  icon?: React.ReactNode;
  title: string;
  variant?: Variant;
  watermarkSrcLight?: string;
  watermarkSrcDark?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const patternMap = {
  none: null,
  brandTiles,
  brandDense,
  brandRows,
};

const variantGradients = {
  turquoise: {
    header: 'from-cyan-500 via-teal-500 to-cyan-600',
    body: 'from-cyan-500/10 via-teal-500/5 to-transparent',
    border: 'border-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  indigo: {
    header: 'from-indigo-500 via-blue-500 to-indigo-600',
    body: 'from-indigo-500/10 via-blue-500/5 to-transparent',
    border: 'border-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  emerald: {
    header: 'from-emerald-500 via-green-500 to-emerald-600',
    body: 'from-emerald-500/10 via-green-500/5 to-transparent',
    border: 'border-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  sky: {
    header: 'from-sky-500 via-blue-400 to-sky-600',
    body: 'from-sky-500/10 via-blue-400/5 to-transparent',
    border: 'border-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
  },
  neutral: {
    header: 'from-gray-500 via-slate-500 to-gray-600',
    body: 'from-gray-500/10 via-slate-500/5 to-transparent',
    border: 'border-gray-500/20',
    text: 'text-gray-700 dark:text-gray-300',
  },
};

const intensityOpacities = {
  0: 'opacity-0',
  1: 'opacity-[0.15]',
  2: 'opacity-[0.30]',
  3: 'opacity-[0.45]',
};

export const GlassSection: React.FC<GlassSectionProps> = ({
  icon,
  title,
  variant = 'turquoise',
  watermarkSrcLight,
  watermarkSrcDark,
  headerRight,
  children,
  className,
}) => {
  const { theme } = useTheme();
  const { 
    sectionFill, 
    headerPattern, 
    headerPatternIntensity, 
    headerWatermark 
  } = useAppearance();

  const resolvedTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const patternSrc = headerPattern !== 'none' ? patternMap[headerPattern] : null;
  
  // Use provided watermark sources or default logos from public folder
  const defaultWatermarkLight = '/logo.PNG';
  const defaultWatermarkDark = '/logog.png';
  
  const watermarkSrc = resolvedTheme === 'dark' 
    ? (watermarkSrcDark || defaultWatermarkDark) 
    : (watermarkSrcLight || defaultWatermarkLight);

  const variantStyles = variantGradients[variant];
  const intensityClass = intensityOpacities[headerPatternIntensity];

  // Body background based on sectionFill
  const bodyBg = sectionFill === 'vivid'
    ? `bg-gradient-to-br ${variantStyles.body}`
    : 'bg-white/50 dark:bg-gray-900/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className={cn(
        'rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden',
        'transition-all duration-200',
        variantStyles.border,
        className
      )}
    >
      {/* Header */}
      <div 
        className={cn(
          'relative px-6 py-4 bg-gradient-to-r',
          variantStyles.header,
          'text-white'
        )}
      >
        {/* Pattern Overlay */}
        {patternSrc && (
          <div 
            className={cn(
              'absolute inset-0 bg-repeat bg-center pointer-events-none',
              intensityClass
            )}
            style={{
              backgroundImage: `url(${patternSrc})`,
              backgroundSize: '200px 200px',
            }}
          />
        )}

        {/* Watermark - Disabled by default */}
        {headerWatermark && watermarkSrcLight && watermarkSrcDark && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <img 
              src={watermarkSrc} 
              alt="" 
              className="h-8 w-auto object-contain"
            />
          </div>
        )}

        {/* Header Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          {headerRight && (
            <div className="flex items-center gap-2">
              {headerRight}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={cn(
        'p-6',
        bodyBg,
        'border-t border-white/10'
      )}>
        {children}
      </div>
    </motion.div>
  );
};
