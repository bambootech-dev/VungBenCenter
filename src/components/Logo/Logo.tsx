import { cn } from '@/utilities/ui'
import React from 'react'

interface Props {
  className?: string
}

export const Logo = ({ className }: Props) => {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
      >
        VB
      </span>
      <span>Vững Bền Center</span>
    </span>
  )
}
