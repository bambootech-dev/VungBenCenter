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
      <span className="card-img-top d-block ratio ratio-16x10 overflow-hidden bg-primary-subtle">
        <Image
          alt=""
          className="object-fit-cover"
          data-testid="lesson-thumbnail-image"
          fill
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          ref={checkAlreadyFailed}
          sizes="(min-width: 1200px) 360px, (min-width: 576px) 50vw, 100vw"
          src={url}
        />
      </span>
    )
  }

  // Không có ảnh hoặc ảnh lỗi: hiển thị chính âm đó cỡ lớn trên nền gradient nhạt
  return (
    <span
      aria-hidden="true"
      className="card-img-top d-block ratio ratio-16x10 lesson-thumb-placeholder"
      data-testid="lesson-thumbnail-placeholder"
    >
      <span className="d-flex align-items-center justify-content-center display-2 fw-bolder text-primary">
        {sound}
      </span>
    </span>
  )
}
