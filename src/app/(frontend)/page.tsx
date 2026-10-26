import Link from 'next/link'
import React from 'react'

import { HeroCarousel, type HeroSlide } from '@/components/HeroCarousel'
import { RoleCard } from '@/components/RoleCard'

const roles = [
  {
    icon: 'bi-backpack2',
    title: 'Học sinh / Phụ huynh',
    description: 'Đăng ký và đăng nhập ngay để vào khu vực học tập.',
    actions: [
      { href: '/register/hocsinh', label: 'Đăng ký Học sinh / Phụ huynh', primary: true },
      { href: '/login/hocsinh', label: 'Đăng nhập' },
    ],
  },
  {
    icon: 'bi-person-workspace',
    title: 'Giáo viên',
    description: 'Đăng ký tài khoản; Quản trị viên sẽ phê duyệt trước khi bạn đăng nhập.',
    actions: [
      { href: '/register/giaovien', label: 'Đăng ký Giáo viên', primary: true },
      { href: '/login/giaovien', label: 'Đăng nhập' },
    ],
  },
]

// Ảnh stock CC0 từ Wikimedia Commons (nguồn: docs/ui-migration.md) — tạm thời, thay bằng ảnh thật của trung tâm cùng tên file
const slides: HeroSlide[] = [
  {
    image: '/images/carousel/slide-1.jpg',
    title: 'Luyện phát âm mỗi ngày',
    text: 'Chọn một âm và luyện cùng hình ảnh, ví dụ và bài tập ngắn.',
    cta: { href: '/bai-hoc', label: 'Vào bài học' },
  },
  {
    image: '/images/carousel/slide-2.jpg',
    title: 'Học theo từng bước',
    text: 'Mỗi bài chia thành các bước nhỏ, dễ theo dõi cho cả học sinh và phụ huynh.',
    cta: { href: '/register/hocsinh', label: 'Tạo tài khoản' },
  },
  {
    image: '/images/carousel/slide-3.jpg',
    title: 'Đồng hành cùng Giáo viên',
    text: 'Giáo viên điền và nộp phiếu theo dõi trực tuyến theo mẫu có sẵn.',
    cta: { href: '/login/giaovien', label: 'Đăng nhập Giáo viên' },
  },
]

// Những gì nền tảng đang có — minh họa bằng icon thay cho ảnh
const features = [
  { icon: 'bi-mic-fill', label: 'Luyện phát âm', tone: 'bg-primary-subtle text-primary-emphasis' },
  { icon: 'bi-list-ol', label: 'Bài học theo từng bước', tone: 'bg-accent-subtle text-accent-emphasis' },
  { icon: 'bi-clipboard2-check-fill', label: 'Phiếu theo dõi cho Giáo viên', tone: 'bg-secondary-subtle text-secondary-emphasis' },
  { icon: 'bi-people-fill', label: 'Học sinh, Phụ huynh & Giáo viên', tone: 'bg-info-subtle text-info-emphasis' },
]

export default function HomePage() {
  return (
    <>
      <HeroCarousel id="home-carousel" slides={slides} />

      <section aria-labelledby="hero-title" className="bg-body border-bottom">
        <div className="container py-5">
          <div className="row align-items-center g-4 gx-lg-5 py-lg-4">
            <div className="col-lg-6">
              <p className="badge text-bg-accent fs-6 mb-3">Trung tâm học tập</p>
              <h1 className="display-4 mb-3" id="hero-title">
                Vững Bền Center
              </h1>
              <p className="lead text-body-secondary mb-4">
                Nền tảng dành cho Học sinh / Phụ huynh và Giáo viên của trung tâm.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link className="btn btn-primary btn-lg px-5" href="/login">
                  Đăng nhập
                  <i aria-hidden="true" className="bi bi-arrow-right ms-2" />
                </Link>
                <Link className="btn btn-outline-primary btn-lg" href="/register/hocsinh">
                  Tạo tài khoản
                </Link>
              </div>
            </div>

            <div className="col-lg-6">
              <ul className="row row-cols-2 g-3 list-unstyled mb-0">
                {features.map((feature) => (
                  <li className="col" key={feature.label}>
                    <div className={`h-100 rounded-3 p-4 ${feature.tone}`}>
                      <i aria-hidden="true" className={`bi ${feature.icon} fs-1`} />
                      <p className="fw-bold mt-2 mb-0">{feature.label}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="roles-title" className="container py-5">
        <h2 className="text-center mb-4" id="roles-title">
          Bạn là ai?
        </h2>
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {roles.map((role) => (
            <div className="col" key={role.title}>
              <RoleCard {...role} />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
