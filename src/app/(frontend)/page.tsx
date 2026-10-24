import Link from 'next/link'
import React from 'react'

import { cardClass, pillClass } from '@/components/ui/brand'
import { Button } from '@/components/ui/button'

const roles = [
  {
    title: 'Học sinh / Phụ huynh',
    description: 'Đăng ký và đăng nhập ngay để vào khu vực học tập.',
    register: '/register/hocsinh',
    login: '/login/hocsinh',
  },
  {
    title: 'Giáo viên',
    description: 'Đăng ký tài khoản; Quản trị viên sẽ phê duyệt trước khi bạn đăng nhập.',
    register: '/register/giaovien',
    login: '/login/giaovien',
  },
]

export default function HomePage() {
  return (
    <main className="lesson-container flex-1 py-16 md:py-24">
      <section className="max-w-2xl">
        <p className={`${pillClass} mb-4`}>
          Trung tâm học tập
        </p>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-lesson-primary-dark md:text-5xl">Vững Bền Center</h1>
        <p className="mb-8 text-lg font-semibold text-muted-foreground">
          Nền tảng dành cho Học sinh / Phụ huynh và Giáo viên của trung tâm.
        </p>
        <Button asChild size="lg">
          <Link href="/login">Đăng nhập</Link>
        </Button>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        {roles.map((role) => (
          <article className={`${cardClass} p-6 md:p-8`} key={role.title}>
            <h2 className="mb-2 text-2xl font-extrabold text-lesson-primary-dark">{role.title}</h2>
            <p className="mb-6 font-semibold text-muted-foreground">{role.description}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={role.register}>Đăng ký {role.title}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={role.login}>Đăng nhập</Link>
              </Button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
