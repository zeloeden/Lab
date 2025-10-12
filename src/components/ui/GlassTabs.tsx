import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
// Using public assets instead of imports
const logoTurq = '/src/assets/logo.PNG'   // التركواز
const logoGold = '/src/assets/logog.png'  // الذهبي

type Tab = { 
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean 
}

interface GlassTabsProps {
  title?: string
  status?: { 
    label: string
    tone?: 'neutral'|'success'|'warning'|'danger' 
  }
  tabs?: Tab[]
  activeTabId?: string
  onTabChange?: (id: string) => void
  rightActions?: React.ReactNode
  className?: string
}

const toneMap: Record<NonNullable<GlassTabsProps['status']>['tone']|'neutral', string> = {
  neutral: 'bg-slate-500/10 text-slate-700 dark:text-slate-200 border border-white/15',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  danger:  'bg-rose-500/10 text-rose-600 dark:text-rose-300',
}

export default function GlassTabs({
  title,
  status,
  tabs,
  activeTabId,
  onTabChange,
  rightActions,
  className,
}: GlassTabsProps) {
  return (
    <div className={clsx(
      'relative glass-panel glass-gradient-overlay ring-1 ring-white/10 px-5 sm:px-6 py-3 sm:py-3.5',
      'rounded-2xl',
      className,
    )}>
      {/* Watermark removed */}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {title && (
            <h2 className="truncate text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h2>
          )}
          {status?.label && (
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur',
                toneMap[status.tone ?? 'neutral']
              )}
            >
              {status.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">{rightActions}</div>
      </div>

      {tabs && tabs.length > 0 && (
        <div className="mt-2.5 px-1 flex gap-2 overflow-x-auto" role="tablist" aria-label="Sections">
          {tabs.map(t => {
            const active = t.id === activeTabId
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${t.id}`}
                disabled={t.disabled}
                onClick={() => onTabChange?.(t.id)}
                className={clsx(
                  'relative select-none px-3.5 py-2 rounded-xl text-sm font-medium',
                  'text-slate-700 dark:text-slate-200',
                  'hover:bg-white/10 border border-transparent hover:border-white/15',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                  t.disabled && 'opacity-50 pointer-events-none',
                  active && 'ring-1 ring-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] bg-white/10'
                )}
              >
                <span className="flex items-center gap-2">
                  {t.icon}{t.label}
                </span>
                <AnimatePresence>
                  {active && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute left-2 right-2 -bottom-[2px] h-0.5 rounded-full bg-gradient-to-r from-teal-400/80 via-sky-400/80 to-indigo-500/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
