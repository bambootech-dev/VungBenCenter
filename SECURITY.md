# Bảo mật tài khoản — Vững Bền Center

## Vai trò

| Vai trò | Cách tạo | Trạng thái ban đầu | Vào `/admin` |
|---|---|---|---|
| `admin` | Chỉ qua `/admin/create-first-user` (Admin đầu tiên) hoặc do Admin tạo | `active` | Có |
| `giaovien` | Đăng ký công khai `/register/giaovien` | `pending` — Admin phải duyệt | Không |
| `hocsinh` | Đăng ký công khai `/register/hocsinh` | `active` | Không |

## Khởi tạo Admin đầu tiên

Hook `beforeChange` của `Users` chỉ gán `admin` + `active` khi **cả hai** điều kiện đúng:

1. Bảng `users` đang trống.
2. Request là `POST /api/users/first-register` qua REST — endpoint mà trang
   `/admin/create-first-user` của Payload sử dụng.

Đăng ký công khai (`src/actions/registerAccount.ts`) luôn gắn
`context: { registrationSource: 'public-signup' }` phía server. Với dấu hiệu này:

- Khi chưa có User nào, đăng ký bị từ chối: "Hệ thống chưa được khởi tạo. Vui lòng liên hệ Quản trị viên."
- Chỉ chấp nhận `giaovien` (`pending`) hoặc `hocsinh` (`active`); không bao giờ tạo `admin`.

Form "Welcome" của `/admin/create-first-user` có hiển thị ô Vai trò / Trạng thái,
nhưng giá trị chọn ở đó bị bỏ qua: tài khoản đầu tiên luôn là `admin` + `active`.

### Quy trình bắt buộc khi triển khai hệ thống mới

1. Khởi động ứng dụng ở môi trường local hoặc riêng tư (không truy cập được từ Internet).
2. Truy cập `/admin`, tạo Admin đầu tiên.
3. Đăng nhập lại tại `/admin/login` để xác nhận.
4. Chỉ sau đó mới deploy công khai / mở các trang `/register/*`.

Không bao giờ đưa lên Internet một ứng dụng có database chưa có Admin.

## Giới hạn đã biết

**Race condition khi tạo Admin đầu tiên.** Payload kiểm tra "chưa có User" và tạo
User trong cùng transaction nhưng không khóa bảng. Nếu hai request
`/api/users/first-register` đến đồng thời khi database trống, cả hai có thể thành
công và tạo ra **hai Admin** (đã tái hiện trên PostgreSQL local). Đăng ký công khai
không bị ảnh hưởng: nó không bao giờ tạo được Admin trong bất kỳ thứ tự thực thi nào.

Trong MVP, rủi ro này được kiểm soát bằng quy trình ở trên. Hướng xử lý cho phiên
bản sau: khóa `pg_advisory_xact_lock` trong nhánh bootstrap rồi đếm lại, hoặc chỉ
cho phép bootstrap khi có biến môi trường bật tạm thời.

**Sửa `role` / `accountStatus` qua API.** Với người không phải Admin, Payload bỏ qua
các trường này (field-level access) và vẫn trả HTTP 200 cho phần còn lại của yêu
cầu; giá trị trong database không thay đổi.

## Kiểm thử với database local

Integration test xóa bảng `users`, nên chỉ được chạy trên database test local.

```bash
# Postgres local dùng riêng cho test
docker run -d --name vbc-test-db -e POSTGRES_USER=vbc -e POSTGRES_PASSWORD=vbc_test_only \
  -e POSTGRES_DB=vbc_test -p 127.0.0.1:54329:5432 postgres:16-alpine

cp .env.test.example .env.test
npm run test:int
```

- `vitest.setup.ts` chỉ đọc `.env.test` và dừng nếu `DATABASE_URL` không phải
  `127.0.0.1`/`localhost`, cổng `54329`, database `vbc_test`. Vite không đọc `.env`.
- `scripts/with-local-test-db.ts <lệnh>` chạy lệnh bất kỳ (generate, build, dev) với
  database local, và từ chối chạy nếu thư mục có `.env` — Next.js và Payload CLI tự
  nạp file đó. Dùng trong một bản sao dự án không có `.env`.
