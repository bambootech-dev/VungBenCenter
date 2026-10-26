import { Nunito } from 'next/font/google'

// Font bo tròn, thân thiện với trẻ nhỏ cho toàn bộ frontend; Bootstrap đọc qua biến --font-nunito (styles/_variables.scss).
// next/font tự host file font lúc build, trình duyệt không gọi tới Google.
export const nunito = Nunito({
  display: 'swap',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-nunito',
  weight: ['500', '600', '700', '800'],
})
