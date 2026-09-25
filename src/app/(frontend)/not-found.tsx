import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="container py-28">
      <h1 className="mb-2 text-4xl font-semibold">404</h1>
      <p className="mb-6 text-muted-foreground">Không tìm thấy trang bạn yêu cầu.</p>
      <Button asChild>
        <Link href="/">Về trang chủ</Link>
      </Button>
    </main>
  )
}
