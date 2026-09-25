import Link from 'next/link'
import React from 'react'

import { Logo } from '@/components/Logo/Logo'

export const SiteFooter = () => {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <Logo className="text-foreground" />

        <nav className="flex flex-wrap gap-4">
          <Link className="hover:text-foreground" href="/login">
            Đăng nhập
          </Link>
          <Link className="hover:text-foreground" href="/register/hocsinh">
            Đăng ký Học sinh
          </Link>
          <Link className="hover:text-foreground" href="/register/giaovien">
            Đăng ký Giáo viên
          </Link>
        </nav>

        <p>© {new Date().getFullYear()} Vững Bền Center</p>
      </div>
    </footer>
  )
}
