import { cn } from '@/utilities/ui'
import React from 'react'

interface Props {
  className?: string
}

export const Logo = ({ className }: Props) => {
  return (
    <span className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight text-lesson-primary-dark', className)}>
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground shadow-[0_4px_10px_-4px_rgb(21_128_61/0.7)]"
      >
        VB
      </span>
      <span>Vững Bền Center</span>
    </span>
  )
}
