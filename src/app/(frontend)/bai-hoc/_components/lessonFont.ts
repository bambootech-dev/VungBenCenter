import { Nunito } from 'next/font/google'

// Font bo tròn, thân thiện với trẻ nhỏ; dùng cho toàn bộ frontend (đặt ở layout gốc).
// next/font tự host file font lúc build, trình duyệt không gọi tới Google.
export const lessonFont = Nunito({
  display: 'swap',
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700', '800'],
})
