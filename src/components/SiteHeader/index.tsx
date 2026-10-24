import Link from 'next/link'
import React from 'react'

import { Logo } from '@/components/Logo/Logo'
import { Button } from '@/components/ui/button'
import { focusRing } from '@/components/ui/brand'

export const SiteHeader = () => {
  return (
    <header className="border-b-2 border-lesson-border bg-lesson-surface">
      <div className="container flex h-16 items-center justify-between">
        <Link aria-label="Vững Bền Center — Trang chủ" className={`rounded-xl ${focusRing}`} href="/">
          <Logo />
        </Link>

        <nav className="flex items-center gap-2">
          {/* Màn hình nhỏ: logo đã dẫn về trang chủ, ẩn nút này để header không tràn ngang */}
          <Button asChild className="hidden sm:inline-flex" size="sm" variant="ghost">
            <Link href="/">Trang chủ</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/bai-hoc">Bài học</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
