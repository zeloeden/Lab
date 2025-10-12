import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import GlassSectionHeader from './GlassSectionHeader'

interface GlassCardProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  headerClassName?: string
}

export default function GlassCard({
  icon,
  title,
  subtitle,
  children,
  className = '',
  headerClassName = ''
}: GlassCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className={`p-0 ${headerClassName}`}>
        <GlassSectionHeader
          icon={icon}
          title={title}
          subtitle={subtitle}
        />
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
