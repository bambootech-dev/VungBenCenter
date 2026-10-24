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
| Học sinh / Phụ huynh (`hocsinh`) | `/register/hocsinh` — kích hoạt ngay | `/login/hocsinh` | `/hocsinh/dashboard` |

- Trang chủ `/` và trang chọn vai trò `/login`.
- Trong MVP, Học sinh và Phụ huynh sử dụng chung loại tài khoản người học, được lưu bằng role `hocsinh`.
  Giao diện ghi "Học sinh / Phụ huynh"; không có role `phuhuynh` hay dashboard Phụ huynh riêng.
- Admin duyệt Giáo viên bằng cách đổi **Trạng thái tài khoản** thành "Đã kích hoạt" trong `/admin` → Users.
- Chỉ Admin vào được Payload Admin. Giáo viên / Học sinh chỉ đọc và sửa tài khoản của chính mình, không đổi được vai trò hay trạng thái.
- Collection trong Payload: **Users**, **Media** (ảnh; ai cũng xem được, chỉ Admin tải lên/sửa/xóa),
  **Lessons** (bài học âm), **Worksheets** (worksheet kiểu cũ) và **Worksheet Submissions** (phiếu đã nộp).
- Bài học: `/bai-hoc` (danh sách theo `order`) và `/bai-hoc/[id]?step=1..9` (đúng 9 bước, mỗi bước là
  một Rich Text). Chỉ tài khoản đã đăng nhập và đang **active** đọc được (giao diện, REST, GraphQL);
  chỉ Admin thêm/sửa/xóa. Trường `sound` chỉ lưu tên âm ("Th"), giao diện tự hiển thị "Âm Th".
- Phiếu: **mẫu có sẵn do hệ thống định nghĩa** trong `src/worksheetTemplates/` (mã + phiên bản), hiện có
  "Phiếu theo dõi ca" và "Phiếu theo dõi âm mục tiêu" theo 2 mẫu phiếu giấy của trung tâm. Admin không cần tạo phiếu.
- Bài nộp (`worksheet-submissions`): chỉ Giáo viên **active** tạo được, với `templateCode` và `data` (giá trị đã điền).
  Server kiểm tra dữ liệu theo mẫu và tự gán giáo viên, thời gian nộp, tên phiếu và bản chụp mẫu lúc nộp.
  Giáo viên chỉ đọc bài của mình, Admin đọc tất cả; không ai sửa/xóa được.
- Collection `worksheets` (worksheet do Admin soạn) chỉ còn để đọc các bài nộp kiểu cũ; không tạo bài mới theo nó.
- Giao diện Giáo viên: `/giaovien/phieu` (nút "+ Tạo phiếu"), `/giaovien/phieu/moi` (chọn mẫu),
  `/giaovien/phieu/moi/[mã mẫu]` (điền và nộp), `/giaovien/bai-da-nop` và `/giaovien/bai-da-nop/[id]`
  (xem lại bài của chính mình, chỉ đọc). Admin xem bài của mọi Giáo viên trong `/admin` → Phiếu đã nộp.

Chi tiết bảo mật và quy trình tạo Admin đầu tiên: xem [SECURITY.md](./SECURITY.md).

## Cài đặt

Yêu cầu: Node.js ≥ 20.9, npm, Docker (PostgreSQL local).

```bash
npm ci

# Một container Postgres local chứa cả database dev và test
docker run -d --name vbc-test-db -e POSTGRES_USER=vbc -e POSTGRES_PASSWORD=<mật-khẩu-local> \
  -e POSTGRES_DB=vbc_test -p 127.0.0.1:54329:5432 postgres:16-alpine
docker exec vbc-test-db psql -U vbc -d postgres -c "CREATE DATABASE vbc_dev"

cp .env.example .env.development.local     # dev: vbc_dev
cp .env.test.example .env.test             # test: vbc_test
npm run db:check                           # [dev-db] host=127.0.0.1 port=54329 database=vbc_dev
npm run dev                                # http://localhost:3000
```

Lần đầu chạy với database trống: mở `/admin` để tạo Admin đầu tiên.

## Database: dev, test, production

| Môi trường | Database | Nguồn cấu hình |
|---|---|---|
| Development (`next dev`, Payload CLI) | `127.0.0.1:54329/vbc_dev` | `.env.development.local` |
| Integration / E2E (Vitest, Playwright) | `127.0.0.1:54329/vbc_test` | `.env.test` |
| Build production trên máy | Postgres local (`vbc_dev`) | `.env.production.local` |
| Production (Supabase) | Supabase | **Chỉ** biến môi trường của nơi deploy |

Các file trên đều bị git-ignore và `.dockerignore`. `npm run dev` tự đồng bộ schema (chế độ push của
Payload) vào database đang cấu hình, nên dev và test không bao giờ được trỏ tới Supabase.

**Guard bắt buộc.** `src/payload.config.ts` gọi `assertSafeDatabase()` trước khi tạo `postgresAdapter`,
nên mọi đường chạy (`next dev`, `npx next dev`, `next build`, Payload CLI, migration, Vitest, Playwright)
đều dừng trước khi kết nối nếu `DATABASE_URL` không hợp lệ:

- Development chỉ nhận `vbc_dev`, test chỉ nhận `vbc_test`, trên `localhost` / `127.0.0.1` / `::1`.
  `ALLOW_REMOTE_DATABASE` bị bỏ qua ở hai môi trường này.
- Production (`NODE_ENV=production`) nhận database local, hoặc database remote khi có
  `ALLOW_REMOTE_DATABASE=true`.
- URL thiếu, sai định dạng hoặc có query ghi đè host/database (`?host=`, `?dbname=`…) đều bị chặn.
- Thông báo lỗi chỉ ghi host, port, tên database — không bao giờ có username, password hay connection string.

`npm run db:check` / `npm run db:check:test` in database mà dev / test sẽ dùng (không kết nối).
`test:int` và `test:e2e` tự chạy `db:check:test` trước.

**Không đặt `ALLOW_REMOTE_DATABASE=true`** trong `.env`, `.env.local`, `.env.development.local`,
`.env.test` hay bất kỳ file nào được commit — chỉ cấu hình trong môi trường deploy production.

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
  payload.config.ts        Cấu hình Payload (Users, Media, Lessons, Worksheets, WorksheetSubmissions, Postgres)
  collections/Users/       Vai trò, trạng thái, phân quyền, hook khởi tạo Admin
  collections/Media.ts     Ảnh tải lên
  collections/Lessons/     Bài học âm: 9 bước Rich Text cố định, phân quyền đọc theo accountStatus
  collections/Worksheets/  Worksheet kiểu cũ (chỉ để đọc bài nộp trước đây)
  collections/WorksheetSubmissions/  Bài nộp: dữ liệu theo mẫu + bản chụp mẫu (và bài kiểu cũ), không sửa/xóa
  worksheetTemplates/      Định nghĩa mẫu phiếu, kiểm tra dữ liệu, đọc bản chụp
  migrations/              Migration Postgres (xem mục "Migration")
  actions/registerAccount.ts  Server Action đăng ký công khai
  app/(frontend)/          Trang chủ, đăng nhập, đăng ký, dashboard, bài học (/bai-hoc)
  app/(payload)/           Payload Admin và API (/admin, /api)
  components/              SiteHeader, SiteFooter, RoleLogin, RoleRegister, ui/*
tests/
  int/                     Integration test (Vitest)
  e2e/                     Test trình duyệt (Playwright)
```

## Triển khai (Vercel hoặc nền tảng hỗ trợ Next.js)

Chưa triển khai. Những việc cần làm trước khi deploy:

1. **Biến môi trường** (chỉ trên nền tảng deploy, cho cả bước build và lúc chạy): `DATABASE_URL` (với Supabase
   nên dùng connection pooler), `ALLOW_REMOTE_DATABASE=true`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`.
2. **Lưu trữ ảnh**: Media hiện lưu vào `public/media` trên ổ đĩa, không tồn tại lâu dài trên Vercel.
   Cần thêm storage adapter (ví dụ `@payloadcms/storage-vercel-blob` hoặc `@payloadcms/storage-s3` với Supabase Storage).
3. **Migration**: production không tự đồng bộ schema và ứng dụng không tự chạy migration khi khởi động
   (không dùng `prodMigrations`). Migration chỉ chạy thủ công theo mục "Migration" bên dưới.
4. **Admin đầu tiên**: tạo ở môi trường riêng tư trước khi mở website công khai.

## Migration

Migration nằm trong `src/migrations/`:

| Migration | Nội dung |
|---|---|
| `20261007_163610_baseline` | Schema đã có trước iteration Bài học (users, media, folders, preferences, …) |
| `20261007_163617_lessons` | Chỉ tạo bảng `lessons` và cột `payload_locked_documents_rels.lessons_id` |
| `20261021_174608_worksheets` | Chỉ tạo bảng `worksheets`, `worksheets_questions` và cột `payload_locked_documents_rels.worksheets_id` |
| `20261021_180934_worksheet_submissions` | Chỉ tạo bảng `worksheet_submissions`, `worksheet_submissions_answers`, `worksheet_submissions_snapshot_questions` và cột `payload_locked_documents_rels.worksheet_submissions_id` |
| `20261023_075749_worksheet_templates` | Thêm cột phiếu theo mẫu (`title`, `template_code`, `template_version`, `template_snapshot`, `data`), nới NOT NULL của cột bài kiểu cũ, điền `title` cho bài cũ; không xóa dữ liệu |

**Không chạy baseline trên database đã có bảng** (ví dụ database production từng được đồng bộ bằng
`npm run dev`): `CREATE TABLE` sẽ lỗi. Với database như vậy, người có quyền production làm theo thứ tự,
trong môi trường production (Payload CLI cần `NODE_ENV=production ALLOW_REMOTE_DATABASE=true` và
`DATABASE_URL` của production, không lấy từ file env trên máy dev):

1. Sao lưu database.
2. Đối chiếu schema hiện tại với baseline (các bảng/cột trong `20261007_163610_baseline.ts`).
3. Đánh dấu baseline là đã chạy, **không** thực thi nó:
   `INSERT INTO payload_migrations (name, batch, updated_at, created_at) VALUES ('20261007_163610_baseline', 1, now(), now());`
4. Chạy `NODE_ENV=production ALLOW_REMOTE_DATABASE=true npx payload migrate:status`: baseline phải là `Ran: Yes`, chỉ `20261007_163617_lessons` là `No`.
5. Chỉ sau đó mới chạy migration Lessons: `NODE_ENV=production ALLOW_REMOTE_DATABASE=true npx payload migrate`. Nếu database từng chạy ở chế độ dev (push), Payload hỏi
   "It looks like you've run Payload in dev mode… Would you like to proceed?". Chỉ trả lời `y` khi bước 2
   và 4 đã đúng: Payload bỏ qua bản ghi `dev` và chỉ chạy các migration chưa chạy (ở đây là `lessons`).

Database trống (ví dụ database test local mới tạo) thì chạy `npx payload migrate` bình thường.
Sau khi đổi collection: `npx payload migrate:create <tên>` trên database local (`vbc_dev`), không bao giờ trên production.

`Dockerfile` chỉ dùng khi không deploy lên Vercel; khi đó cần bật `output: 'standalone'` trong `next.config.ts`.
