'use client'

import Box from '@mui/material/Box'
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
      <Box
        className="lesson-thumb"
        component="span"
        sx={{
          aspectRatio: '16 / 10',
          bgcolor: 'm3.surfaceContainerHigh',
          display: 'block',
          overflow: 'hidden',
          position: 'relative',
          '& img': { transition: 'transform 300ms' },
        }}
      >
        <Image
          alt=""
          data-testid="lesson-thumbnail-image"
          fill
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          ref={checkAlreadyFailed}
          sizes="(min-width: 1200px) 380px, (min-width: 600px) 50vw, 100vw"
          src={url}
          style={{ objectFit: 'cover' }}
        />
      </Box>
    )
  }

  // Không có ảnh hoặc ảnh lỗi: hiển thị chính âm đó cỡ lớn trên nền tonal với vài hình khối trang trí
  return (
    <Box
      aria-hidden="true"
      component="span"
      data-testid="lesson-thumbnail-placeholder"
      sx={{
        alignItems: 'center',
        aspectRatio: '16 / 10',
        bgcolor: 'm3.secondaryContainer',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box component="span" sx={{ bgcolor: 'm3.tertiaryContainer', borderRadius: '50%', height: 96, position: 'absolute', right: -24, top: -24, width: 96 }} />
      <Box component="span" sx={{ bgcolor: 'm3.primaryContainer', borderRadius: '50%', bottom: -40, height: 96, left: -32, position: 'absolute', width: 192 }} />
      <Box
        component="span"
        sx={{ color: 'm3.onSecondaryContainer', fontSize: '4.5rem', fontWeight: 500, position: 'relative' }}
      >
        {sound}
      </Box>
    </Box>
  )
}
