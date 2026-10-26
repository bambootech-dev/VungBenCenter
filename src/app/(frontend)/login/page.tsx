import Link from 'next/link'

import { RoleCard } from '@/components/RoleCard'

const roles = [
  {
    icon: 'bi-person-workspace',
    title: 'Giáo viên',
    description: 'Truy cập khu vực quản lý dành cho Giáo viên.',
    actions: [
      { href: '/login/giaovien', label: 'Đăng nhập Giáo viên', primary: true },
      { href: '/register/giaovien', label: 'Đăng ký Giáo viên' },
    ],
    note: 'Tài khoản Giáo viên cần được Admin phê duyệt.',
  },
  {
    // Học sinh / Phụ huynh: dùng chung role hocsinh
    icon: 'bi-backpack2',
    title: 'Học sinh / Phụ huynh',
    description: 'Truy cập khu vực học tập dành cho Học sinh và Phụ huynh.',
    actions: [
      { href: '/login/hocsinh', label: 'Đăng nhập Học sinh / Phụ huynh', primary: true },
      { href: '/register/hocsinh', label: 'Đăng ký tài khoản người học' },
    ],
    note: 'Học sinh / Phụ huynh có thể đăng nhập ngay sau khi đăng ký.',
  },
]

export default function AccountPage() {
  return (
    <div className="container py-5">
      <div className="col-lg-8 mx-auto text-center mb-5">
        <p className="badge bg-primary-subtle text-primary-emphasis fs-6 mb-3">Vững Bền Center</p>
        <h1 className="mb-3">Chào mừng bạn</h1>
        <p className="lead text-body-secondary mb-0">Vui lòng chọn vai trò để đăng nhập hoặc tạo tài khoản.</p>
      </div>

      <div className="row row-cols-1 row-cols-md-2 g-4 justify-content-center">
        {roles.map((role) => (
          <div className="col col-lg-5" key={role.title}>
            <RoleCard {...role} />
          </div>
        ))}
      </div>

      <p className="text-center text-body-secondary mt-5 mb-0">
        Bạn là quản trị viên?{' '}
        <Link className="fw-bold" href="/admin/login">
          Đăng nhập Admin
        </Link>
      </p>
    </div>
  )
}
