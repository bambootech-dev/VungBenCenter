# Vững Bền Center

Website và hệ thống tài khoản cho trung tâm học Vững Bền.

- **Payload CMS 3** (trang quản trị tại `/admin`) + **Next.js 16** + **React 19**
- **PostgreSQL** (Supabase hoặc Postgres bất kỳ) qua `@payloadcms/db-postgres`
- **Tailwind CSS 4**, dùng **npm**

## Chức năng

| Vai trò | Đăng ký | Đăng nhập | Khu vực |
|---|---|---|---|
| Quản trị viên (`admin`) | Tài khoản đầu tiên qua `/admin/create-first-user`, sau đó do Admin tạo | `/admin/login` | Payload Admin `/admin` |
| Giáo viên (`giaovien`) | `/register/giaovien` — chờ Admin duyệt | `/login/giaovien` | `/giaovien/dashboard` |
| Học sinh (`hocsinh`) | `/register/hocsinh` — kích hoạt ngay | `/login/hocsinh` | `/hocsinh/dashboard` |

- Trang chủ `/` và trang chọn vai trò `/login`.
- Admin duyệt Giáo viên bằng cách đổi **Trạng thái tài khoản** thành "Đã kích hoạt" trong `/admin` → Users.
- Chỉ Admin vào được Payload Admin. Giáo viên / Học sinh chỉ đọc và sửa tài khoản của chính mình, không đổi được vai trò hay trạng thái.
- Collection trong Payload: **Users** và **Media** (ảnh; ai cũng xem được, chỉ Admin tải lên/sửa/xóa).

Chi tiết bảo mật và quy trình tạo Admin đầu tiên: xem [SECURITY.md](./SECURITY.md).

## Cài đặt

Yêu cầu: Node.js ≥ 20.9, npm, một database PostgreSQL.

```bash
npm ci
cp .env.example .env   # điền DATABASE_URL, PAYLOAD_SECRET, NEXT_PUBLIC_SERVER_URL
npm run dev            # http://localhost:3000
```

Lần đầu chạy với database trống: mở `/admin` để tạo Admin đầu tiên **trước khi** đưa website lên Internet (xem SECURITY.md).

> `npm run dev` tự đồng bộ schema vào database đang cấu hình (chế độ push của Payload).
> Không chạy dev với `DATABASE_URL` của production.

## Lệnh thường dùng

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy môi trường phát triển |
| `npm run build` / `npm start` | Build và chạy production |
| `npm run lint` | ESLint |
| `npm run generate:types` | Sinh lại `src/payload-types.ts` sau khi đổi collection |
| `npm run generate:importmap` | Sinh lại import map của Payload Admin |
| `npm run test:int` | Integration test (cần database test local) |
| `npm run test:e2e` | Test trình duyệt với Playwright |

## Kiểm thử

Integration test xóa dữ liệu bảng `users`, nên chỉ chạy trên database test local
(`127.0.0.1:54329`, database `vbc_test`). Hướng dẫn tạo database test và cơ chế
chặn kết nối nhầm: xem mục "Kiểm thử với database local" trong [SECURITY.md](./SECURITY.md).

## Cấu trúc

```
src/
  payload.config.ts        Cấu hình Payload (Users, Media, Postgres)
  collections/Users/       Vai trò, trạng thái, phân quyền, hook khởi tạo Admin
  collections/Media.ts     Ảnh tải lên
  actions/registerAccount.ts  Server Action đăng ký công khai
  app/(frontend)/          Trang chủ, đăng nhập, đăng ký, dashboard
  app/(payload)/           Payload Admin và API (/admin, /api)
  components/              SiteHeader, SiteFooter, RoleLogin, RoleRegister, ui/*
tests/
  int/                     Integration test (Vitest)
  e2e/                     Test trình duyệt (Playwright)
```

## Triển khai (Vercel hoặc nền tảng hỗ trợ Next.js)

Chưa triển khai. Những việc cần làm trước khi deploy:

1. **Biến môi trường**: `DATABASE_URL` (với Supabase nên dùng connection pooler), `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`.
2. **Lưu trữ ảnh**: Media hiện lưu vào `public/media` trên ổ đĩa, không tồn tại lâu dài trên Vercel.
   Cần thêm storage adapter (ví dụ `@payloadcms/storage-vercel-blob` hoặc `@payloadcms/storage-s3` với Supabase Storage).
3. **Migration**: production không tự đồng bộ schema. Cần tạo migration (`npx payload migrate:create`)
   và chạy `npx payload migrate` khi deploy.
4. **Admin đầu tiên**: tạo ở môi trường riêng tư trước khi mở website công khai.

`Dockerfile` chỉ dùng khi không deploy lên Vercel; khi đó cần bật `output: 'standalone'` trong `next.config.ts`.
