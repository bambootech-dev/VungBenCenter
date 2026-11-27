import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
}

export const Logo = ({ className }: Props) => {
  return (
    <span className={clsx('d-inline-flex align-items-center gap-2 fw-bolder text-primary-emphasis', className)}>
      <span
        aria-hidden="true"
        className="icon-circle icon-circle-sm rounded-3 bg-primary text-white shadow-sm"
      >
        VB
      </span>
      <span>Vững Bền Center</span>
    </span>
  )
}
