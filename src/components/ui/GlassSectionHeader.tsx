import * as React from 'react'
import clsx from 'clsx'

interface GlassSectionHeaderProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  className?: string
}

export default function GlassSectionHeader({
  icon,
  title,
  subtitle,
  className
}: GlassSectionHeaderProps) {
  return (
    <div className={clsx(
      'relative glass-panel glass-gradient-overlay ring-1 ring-white/10 px-5 sm:px-6 py-3 sm:py-3.5',
      'rounded-2xl mb-4',
      className,
    )}>
      {/* Watermark removed */}

      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex-shrink-0 text-slate-600 dark:text-slate-300">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
