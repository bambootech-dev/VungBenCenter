import Link from 'next/link'
import React from 'react'

import { Logo } from '@/components/Logo/Logo'
import { focusRing } from '@/components/ui/brand'

const linkClass = `rounded font-bold hover:text-lesson-primary-dark hover:underline ${focusRing}`

export const SiteFooter = () => {
  return (
    <footer className="mt-auto border-t-2 border-lesson-border bg-lesson-surface">
      <div className="container flex flex-col gap-3 py-6 text-sm font-semibold text-muted-foreground md:flex-row md:items-center md:justify-between">
        <Logo className="text-foreground" />

        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link className={linkClass} href="/login">
            Đăng nhập
          </Link>
          <Link className={linkClass} href="/register/hocsinh">
            Đăng ký tài khoản người học
          </Link>
          <Link className={linkClass} href="/register/giaovien">
            Đăng ký Giáo viên
          </Link>
        </nav>

        <p>© {new Date().getFullYear()} Vững Bền Center</p>
      </div>
    </footer>
  )
}
