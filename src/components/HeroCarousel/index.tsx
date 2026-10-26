'use client'

import type Carousel from 'bootstrap/js/dist/carousel'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

export type HeroSlide = {
  cta: { href: string; label: string }
  image: string
  text: string
  title: string
}

const INTERVAL = 6000

/**
 * Carousel đầu trang chủ (giống banner xoay của NG Science).
 * Tự chuyển ảnh trừ khi người dùng chọn giảm chuyển động; luôn có nút Tạm dừng/Tiếp tục (WCAG 2.2.2).
 */
export const HeroCarousel = ({ id, slides }: { id: string; slides: HeroSlide[] }) => {
  const ref = useRef<HTMLDivElement>(null)
  const instance = useRef<Carousel | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    let disposed = false
    const autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Chỉ nạp plugin carousel của Bootstrap ở trình duyệt (kèm data-api cho nút trước/sau và chấm chỉ mục)
    void import('bootstrap/js/dist/carousel').then(({ default: BsCarousel }) => {
      if (disposed || !ref.current) return

      instance.current = BsCarousel.getOrCreateInstance(ref.current, {
        interval: INTERVAL,
        pause: 'hover',
        ride: autoplay ? 'carousel' : false,
      })
      if (autoplay) instance.current.cycle()
      setPlaying(autoplay)
    })

    return () => {
      disposed = true
      instance.current?.dispose()
      instance.current = null
    }
  }, [])

  const togglePlaying = () => {
    if (playing) {
      instance.current?.pause()
    } else {
      instance.current?.cycle()
    }
    setPlaying(!playing)
  }

  return (
    <section aria-label="Giới thiệu" aria-roledescription="carousel" className="hero-carousel position-relative">
      <div className="carousel slide" id={id} ref={ref}>
        <div className="carousel-indicators">
          {slides.map((slide, index) => (
            <button
              aria-current={index === 0 ? 'true' : undefined}
              aria-label={`Ảnh ${index + 1}: ${slide.title}`}
              className={clsx(index === 0 && 'active')}
              data-bs-slide-to={index}
              data-bs-target={`#${id}`}
              key={slide.image}
              type="button"
            />
          ))}
        </div>

        <div aria-live={playing ? 'off' : 'polite'} className="carousel-inner">
          {slides.map((slide, index) => (
            <div
              aria-label={`${index + 1} / ${slides.length}`}
              aria-roledescription="slide"
              className={clsx('carousel-item', index === 0 && 'active')}
              key={slide.image}
              role="group"
            >
              <div className="hero-slide position-relative">
                <Image
                  alt=""
                  className="object-fit-cover"
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  src={slide.image}
                />
                {/* Ảnh stock tạm thời, không phải ảnh của trung tâm */}
                <span className="badge bg-dark bg-opacity-75 fw-semibold position-absolute bottom-0 end-0 m-2 z-2 pe-none">
                  Ảnh minh họa
                </span>
              </div>
              <div className="carousel-caption text-start">
                <div className="hero-caption bg-dark bg-opacity-75 rounded-3 p-3 p-md-4">
                  <p className="h2 text-white mb-2">{slide.title}</p>
                  <p className="d-none d-sm-block mb-3">{slide.text}</p>
                  <Link className="btn btn-accent" href={slide.cta.href}>
                    {slide.cta.label}
                    <i aria-hidden="true" className="bi bi-arrow-right ms-2" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-control-prev" data-bs-slide="prev" data-bs-target={`#${id}`} type="button">
          <span aria-hidden="true" className="carousel-control-prev-icon" />
          <span className="visually-hidden">Ảnh trước</span>
        </button>
        <button className="carousel-control-next" data-bs-slide="next" data-bs-target={`#${id}`} type="button">
          <span aria-hidden="true" className="carousel-control-next-icon" />
          <span className="visually-hidden">Ảnh sau</span>
        </button>
      </div>

      <button
        aria-label={playing ? 'Tạm dừng tự chuyển ảnh' : 'Tiếp tục tự chuyển ảnh'}
        className="btn btn-dark btn-sm hero-carousel-toggle position-absolute"
        onClick={togglePlaying}
        type="button"
      >
        <i aria-hidden="true" className={clsx('bi', playing ? 'bi-pause-fill' : 'bi-play-fill')} />
      </button>
    </section>
  )
}
