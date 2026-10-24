import { Roboto } from 'next/font/google'

// Font chuẩn của Material Design; theme MUI đọc qua biến CSS --font-roboto.
// next/font tự host file font lúc build, trình duyệt không gọi tới Google.
export const roboto = Roboto({
  display: 'swap',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
})
