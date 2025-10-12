import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import GlassTabs from './GlassTabs'
import { Button } from './button'

interface GlassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  status?: {
    label: string
    tone?: 'neutral'|'success'|'warning'|'danger'
  }
  onEdit?: () => void
  onClose?: () => void
  children: React.ReactNode
  className?: string
  maxWidth?: string
}

export default function GlassDialog({
  open,
  onOpenChange,
  title,
  status,
  onEdit,
  onClose,
  children,
  className = '',
  maxWidth = 'max-w-5xl'
}: GlassDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} max-h-[90vh] flex flex-col p-0 ${className}`}>
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <GlassTabs
          title={title}
          status={status}
          rightActions={
            <div className="flex gap-2">
              {onEdit && (
                <Button 
                  onClick={onEdit} 
                  variant="outline" 
                  className="rounded-xl border border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-md px-3.5 py-2 text-sm font-medium hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400"
                >
                  Edit
                </Button>
              )}
              {onClose && (
                <Button 
                  onClick={onClose} 
                  variant="outline" 
                  className="rounded-xl border border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-md px-3.5 py-2 text-sm font-medium hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400"
                >
                  Close
                </Button>
              )}
            </div>
          }
          className="sticky top-0 z-10"
        />
        
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
