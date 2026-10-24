import Link from 'next/link'
import React from 'react'

import { secondaryButtonClass } from './teacherUi'

type Props = {
  action?: { href: string; label: string }
  message: string
  testId?: string
}

export const EmptyState = ({ action, message, testId }: Props) => (
  <div
    className="rounded-3xl border-2 border-dashed border-lesson-border bg-lesson-surface/80 p-8 text-center"
    data-testid={testId}
  >
    <p className="text-lg font-bold text-lesson-muted">{message}</p>
    {action && (
      <Link className={`${secondaryButtonClass} mt-5`} href={action.href}>
        {action.label}
      </Link>
    )}
  </div>
)
