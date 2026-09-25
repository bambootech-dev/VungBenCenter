import Link from 'next/link'
import React from 'react'

import { Logo } from '@/components/Logo/Logo'
import { Button } from '@/components/ui/button'

export const SiteHeader = () => {
  return (
    <header className="border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Vững Bền Center — Trang chủ">
          <Logo />
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/">Trang chủ</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
