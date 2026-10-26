import Link from 'next/link'
import React from 'react'

/** Liên kết "quay lại" phía trên tiêu đề trang. */
export const BackLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <Link
    className="icon-link fw-bold py-2 mb-2 link-underline-opacity-0 link-underline-opacity-100-hover"
    href={href}
  >
    <i aria-hidden="true" className="bi bi-chevron-left" />
    {children}
  </Link>
)
