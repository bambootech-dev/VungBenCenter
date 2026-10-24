import Link from 'next/link'

import {
  cardClass,
  linkClass,
  pageTitleClass,
  pillClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/components/ui/brand'

const roles = [
  {
    badge: 'GV',
    title: 'Giáo viên',
    description: 'Truy cập khu vực quản lý dành cho Giáo viên.',
    login: { href: '/login/giaovien', label: 'Đăng nhập Giáo viên' },
    register: { href: '/register/giaovien', label: 'Đăng ký Giáo viên' },
    note: 'Tài khoản Giáo viên cần được Admin phê duyệt.',
  },
  {
    // Học sinh / Phụ huynh: dùng chung role hocsinh
    badge: 'HS',
    title: 'Học sinh / Phụ huynh',
    description: 'Truy cập khu vực học tập dành cho Học sinh và Phụ huynh.',
    login: { href: '/login/hocsinh', label: 'Đăng nhập Học sinh / Phụ huynh' },
    register: { href: '/register/hocsinh', label: 'Đăng ký tài khoản người học' },
    note: 'Học sinh / Phụ huynh có thể đăng nhập ngay sau khi đăng ký.',
  },
]

export default function AccountPage() {
  return (
    <main className="flex-1">
      <section className="lesson-container py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className={`${pillClass} mb-4`}>Vững Bền Center</p>
            <h1 className={`${pageTitleClass} mb-3`}>Chào mừng bạn</h1>
            <p className="text-lg font-semibold text-muted-foreground">
              Vui lòng chọn vai trò để đăng nhập hoặc tạo tài khoản.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {roles.map((role) => (
              <article className={`${cardClass} flex flex-col p-6 md:p-8`} key={role.title}>
                <div
                  aria-hidden="true"
                  className="mb-5 flex size-14 items-center justify-center rounded-full bg-lesson-primary-soft text-lg font-extrabold text-lesson-primary-dark"
                >
                  {role.badge}
                </div>

                <h2 className="mb-2 text-2xl font-extrabold text-lesson-primary-dark">{role.title}</h2>
                <p className="mb-6 font-semibold text-muted-foreground">{role.description}</p>

                <div className="mt-auto flex flex-col gap-3">
                  <Link className={primaryButtonClass} href={role.login.href}>
                    {role.login.label}
                  </Link>
                  <Link className={secondaryButtonClass} href={role.register.href}>
                    {role.register.label}
                  </Link>
                </div>

                <p className="mt-4 text-sm font-semibold text-muted-foreground">{role.note}</p>
              </article>
            ))}
          </div>

          <p className="mt-8 text-center font-semibold text-muted-foreground">
            Bạn là quản trị viên?{' '}
            <Link className={linkClass} href="/admin/login">
              Đăng nhập Admin
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
