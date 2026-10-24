import Link from 'next/link'
import React from 'react'

import { cardClass } from '@/components/ui/brand'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="lesson-container flex-1 py-20 md:py-28">
      <div className={`${cardClass} mx-auto max-w-xl p-8 text-center`}>
        <h1 className="mb-2 text-5xl font-extrabold text-lesson-primary">404</h1>
        <p className="mb-6 text-lg font-semibold text-muted-foreground">Không tìm thấy trang bạn yêu cầu.</p>
        <Button asChild size="lg">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </main>
  )
}
