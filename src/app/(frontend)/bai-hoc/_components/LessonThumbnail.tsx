'use client'

import Image from 'next/image'
import React, { useCallback, useState } from 'react'

type Props = {
  // Tên âm đã chuẩn hóa ("Th"), hiển thị khi không có ảnh
  sound: string
  // URL của Media; null khi bài chưa có ảnh hoặc thumbnail chưa được populate
  url: string | null
  // Hàng card đầu tiên nằm trong màn hình: tải ảnh ngay (LCP)
  eager?: boolean
}

export const LessonThumbnail = ({ eager = false, sound, url }: Props) => {
  const [failed, setFailed] = useState(false)

  // Ảnh có thể lỗi trước khi React hydrate (onError khi đó không chạy)
  const checkAlreadyFailed = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setFailed(true)
  }, [])

  if (url && !failed) {
    // Ảnh chỉ minh họa: tên bài bên dưới đã là tên của link
    return (
      <span className="relative block aspect-[16/10] overflow-hidden bg-lesson-primary-soft">
        <Image
          alt=""
          className="object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          data-testid="lesson-thumbnail-image"
          fill
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          ref={checkAlreadyFailed}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          src={url}
        />
      </span>
    )
  }

  // Không có ảnh hoặc ảnh lỗi: hiển thị chính âm đó cỡ lớn trên nền gradient xanh nhạt
  return (
    <span
      aria-hidden="true"
      className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-lesson-primary-soft via-lesson-page to-lesson-accent/40"
      data-testid="lesson-thumbnail-placeholder"
    >
      <span className="absolute -right-6 -top-6 size-24 rounded-full bg-lesson-accent/60" />
      <span className="absolute -bottom-10 -left-8 h-24 w-48 rounded-[50%] bg-lesson-border/70" />
      <span className="relative text-7xl font-extrabold text-lesson-primary drop-shadow-[0_3px_0_rgb(255_255_255/0.9)]">
        {sound}
      </span>
    </span>
  )
}
