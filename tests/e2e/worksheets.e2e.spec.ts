import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'
import type { User } from '../../src/payload-types.js'

// playwright.config.ts chỉ nạp .env.test (database local), dev server dùng cùng env đó.
// Dữ liệu test là giá trị trung tính, không lấy từ ảnh mẫu trong docs/.

const BASE_URL = 'http://localhost:3000'
const PASSWORD = 'MatKhau123!'
const SLUG = 'worksheet-submissions'

const EMAILS = {
  admin: 'e2e-ws-admin@test.local',
  teacherA: 'e2e-ws-gv-a@test.local',
  teacherB: 'e2e-ws-gv-b@test.local',
  student: 'e2e-ws-hs@test.local',
}

// Ảnh chụp màn hình để rà giao diện (chỉ khi đặt biến môi trường)
const SCREENSHOT_DIR = process.env.E2E_SCREENSHOT_DIR

const screenshot = async (page: Page, name: string) => {
  if (SCREENSHOT_DIR) {
    await page.screenshot({ fullPage: true, path: `${SCREENSHOT_DIR}/${name}.png` })
  }
}

let payload: Payload
const users = {} as Record<keyof typeof EMAILS, User>

const asUser = (user: User) => ({ ...user, collection: 'users' as const })

const clearData = async () => {
  // Bài nộp không xóa được qua API (đúng thiết kế): dọn trực tiếp trong database test
  await payload.db.deleteMany({ collection: SLUG, where: {} })
  await payload.db.deleteMany({ collection: 'worksheets', where: {} })
}

const submissionsOf = (user: User) =>
  payload.find({ collection: SLUG, depth: 0, pagination: false, where: { teacher: { equals: user.id } } })

const loginTeacher = async (page: Page, email = EMAILS.teacherA) => {
  await page.goto(`${BASE_URL}/login/giaovien`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu').fill(PASSWORD)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(`${BASE_URL}/giaovien/dashboard`)
}

const loginByApi = async (page: Page, email: string) => {
  const response = await page.request.post(`${BASE_URL}/api/users/login`, { data: { email, password: PASSWORD } })
  expect(response.ok()).toBe(true)
}

const openTemplate = async (page: Page, title: RegExp) => {
  await page.goto(`${BASE_URL}/giaovien/phieu`)
  await page.getByRole('link', { name: 'Tạo phiếu' }).click()
  await expect(page).toHaveURL(`${BASE_URL}/giaovien/phieu/moi`)
  await page.getByRole('link', { name: title }).click()
}

const createSubmission = (teacher: User, data: Record<string, unknown>, templateCode = 'phieu-am-muc-tieu') =>
  payload.create({
    collection: SLUG,
    overrideAccess: false,
    user: asUser(teacher),
    data: { templateCode, data } as never,
  })

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  payload = await getPayload({ config })

  await clearData()
  await payload.delete({ collection: 'users', where: { email: { in: Object.values(EMAILS) } } })

  const roles = {
    admin: ['admin', 'Admin E2E'],
    teacherA: ['giaovien', 'Giáo viên A'],
    teacherB: ['giaovien', 'Giáo viên B'],
    student: ['hocsinh', 'Học sinh E2E'],
  } as const

  for (const [key, [role, name]] of Object.entries(roles) as [keyof typeof EMAILS, (typeof roles)[keyof typeof roles]][]) {
    users[key] = await payload.create({
      collection: 'users',
      data: { name, email: EMAILS[key], password: PASSWORD, role, accountStatus: 'active' },
    })
  }
})

test.beforeEach(async () => {
  await clearData()
  await payload.update({ collection: 'users', id: users.teacherA.id, data: { accountStatus: 'active' } })
})

test.afterAll(async () => {
  await clearData()
  await payload.delete({ collection: 'users', where: { email: { in: Object.values(EMAILS) } } })
})

test.describe('Tạo phiếu theo mẫu có sẵn (không cần Admin chuẩn bị)', () => {
  test('Phiếu theo dõi ca: + Tạo phiếu → điền → nộp → chi tiết đọc lại từ database', async ({ page }) => {
    // Không có worksheet nào do Admin tạo
    expect((await payload.count({ collection: 'worksheets' })).totalDocs).toBe(0)

    await loginTeacher(page)
    await page.getByRole('link', { name: 'Phiếu', exact: true }).click()
    await expect(page.getByTestId('recent-submissions-empty')).toBeVisible()
    await screenshot(page, '01-trang-phieu')

    await page.getByRole('link', { name: 'Tạo phiếu' }).click()
    await expect(page.getByTestId('template-card')).toHaveCount(2)
    await screenshot(page, '02-chon-mau')

    await page.getByRole('link', { name: /Điền Dữ liệu quá trình can thiệp tổng hợp/ }).click()
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/phieu/moi/phieu-theo-doi-ca`)

    // Mở form không tạo bài nộp
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(0)

    // Đúng phần, nhãn và kiểu ô của mẫu
    await expect(page.getByRole('heading', { name: 'Thông tin ca can thiệp' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Bảng dữ liệu' })).toBeVisible()
    await expect(page.getByTestId('account-field')).toHaveText('Giáo viên A')
    await expect(page.getByLabel('Ngày CT')).toHaveAttribute('type', 'date')
    await expect(page.getByLabel('Từ (giờ)')).toHaveAttribute('type', 'time')
    const table = page.getByTestId('form-table-mucTieu')
    await expect(table.getByRole('columnheader', { name: 'Số cơ hội / Cách trẻ thực hiện' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: '% đúng' })).toBeVisible()

    // Nhãn "Trẻ" cũng nằm trong "Cách trẻ thực hiện" của bảng: khớp từ đầu nhãn
    await page.getByLabel(/^Trẻ/).fill('Trẻ thử nghiệm E2E')
    await page.getByLabel('Ngày CT').fill('2026-10-20')
    await page.getByLabel('Từ (giờ)').fill('08:00')
    await page.getByLabel('Đến (giờ)').fill('09:30')
    await page.getByLabel('Dòng 1 – Số bài học').fill('1')
    await page.getByLabel('Dòng 1 – Cấp độ').fill('2')
    await page.getByLabel('Dòng 1 – Mục tiêu cụ thể').fill('Mục tiêu thử nghiệm một')
    await page.getByLabel('Dòng 1 – Số cơ hội / Cách trẻ thực hiện 1', { exact: true }).fill('+')
    await page.getByLabel('Dòng 1 – Số cơ hội / Cách trẻ thực hiện 2', { exact: true }).fill('-')
    await page.getByLabel('Dòng 1 – % đúng').fill('50')

    await page.getByRole('button', { name: 'Thêm dòng' }).click()
    await expect(page.getByLabel('Dòng 2 – Số bài học')).toBeFocused()
    await page.getByLabel('Dòng 2 – Mục tiêu cụ thể').fill('Mục tiêu thử nghiệm hai')
    await page.getByLabel('Dòng 2 – % đúng').fill('100')
    await screenshot(page, '03-dien-phieu-ca')

    await page.getByRole('button', { name: 'Nộp phiếu' }).click()
    await expect(page).toHaveURL(/\/giaovien\/bai-da-nop\/\d+\?vua-nop=1$/)
    await expect(page.getByTestId('submission-success')).toBeVisible()

    const { docs } = await submissionsOf(users.teacherA)
    expect(docs).toHaveLength(1)
    const [saved] = docs
    expect(saved.templateCode).toBe('phieu-theo-doi-ca')
    expect(saved.data).toMatchObject({ tre: 'Trẻ thử nghiệm E2E', ngayCT: '2026-10-20', tuGio: '08:00', denGio: '09:30' })
    const rows = (saved.data as { mucTieu: Record<string, unknown>[] }).mucTieu
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ soBaiHoc: '1', capDo: '2', co1: '+', co2: '-', phanTramDung: 50 })

    const checkDetail = async () => {
      await expect(page.getByTestId('submission-title')).toHaveText('Dữ liệu quá trình can thiệp tổng hợp: Phiếu theo dõi ca')
      await expect(page.getByTestId('submission-teacher')).toHaveText('Giáo viên A')
      await expect(page.getByTestId('submission-time').locator('time')).toHaveAttribute('datetime', saved.submittedAt)
      const values = page.getByTestId('template-values')
      await expect(values.locator('[data-field="tre"] dd')).toHaveText('Trẻ thử nghiệm E2E')
      await expect(values.locator('[data-field="ngayCT"] dd')).toHaveText('20/10/2026')
      await expect(values.locator('[data-field="tuGio"] dd')).toHaveText('08:00')
      const tableView = page.getByTestId('table-mucTieu')
      await expect(tableView.locator('tbody tr')).toHaveCount(2)
      await expect(tableView.locator('tbody tr').first()).toContainText('Mục tiêu thử nghiệm một')
      await expect(tableView.locator('tbody tr').first()).toContainText('50%')
    }

    await checkDetail()
    await screenshot(page, '04-chi-tiet-ca')

    // Tải lại / mở trực tiếp: vẫn đúng, không gửi lại bài
    await page.reload()
    await checkDetail()
    await page.goto(`${BASE_URL}/giaovien/bai-da-nop/${saved.id}`)
    await checkDetail()
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(1)
    await expect(page.getByRole('button', { name: /Sửa|Xóa/ })).toHaveCount(0)

    await page.getByRole('link', { name: 'Phiếu', exact: true }).click()
    await expect(page.getByTestId('recent-submissions')).toContainText('Trẻ: Trẻ thử nghiệm E2E')
  })

  test('Phiếu âm mục tiêu: 15 buổi, Tháng/Năm, ghi chú và biểu đồ ở chi tiết', async ({ page }) => {
    await loginTeacher(page)
    await openTemplate(page, /Điền Phiếu theo dõi dữ liệu quá trình can thiệp âm mục tiêu/)

    await expect(page.getByTestId('account-field')).toHaveText('Giáo viên A')
    await expect(page.getByTestId('form-table-buoi').locator('tbody tr')).toHaveCount(15)
    await expect(page.getByRole('rowheader', { name: 'Buổi 15' })).toBeVisible()

    await page.getByLabel('Tên trẻ').fill('Trẻ thử nghiệm E2E')
    await page.getByLabel('Âm mục tiêu').fill('Tr')
    await page.getByLabel('Tháng', { exact: true }).selectOption('10')
    await page.getByLabel('Năm', { exact: true }).fill('2026')
    await page.getByLabel('Buổi 1 – Ngày').fill('3')
    await page.getByLabel('Buổi 1 – Tỉ lệ đúng').fill('40')
    await page.getByLabel('Buổi 2 – Ngày').fill('5')
    await page.getByLabel('Buổi 2 – Tỉ lệ đúng').fill('70')
    await page.getByRole('textbox', { name: 'Ghi chú' }).fill('Ghi chú thử nghiệm.\nDòng hai.')
    await screenshot(page, '05-dien-phieu-am')

    await page.getByRole('button', { name: 'Nộp phiếu' }).click()
    await expect(page).toHaveURL(/\/giaovien\/bai-da-nop\/\d+\?vua-nop=1$/)

    const [saved] = (await submissionsOf(users.teacherA)).docs
    const data = saved.data as { buoi: Record<string, unknown>[]; thangNam: string; ghiChu: string }
    expect(data.thangNam).toBe('2026-10')
    expect(data.buoi).toHaveLength(15)
    expect(data.buoi.slice(0, 3)).toEqual([{ ngay: 3, phanTram: 40 }, { ngay: 5, phanTram: 70 }, { ngay: null, phanTram: null }])
    expect(data.ghiChu).toBe('Ghi chú thử nghiệm.\nDòng hai.')

    const values = page.getByTestId('template-values')
    await expect(values.locator('[data-field="thangNam"] dd')).toHaveText('10/2026')
    await expect(page.getByRole('img', { name: /Buổi 1: 40%, Buổi 2: 70%/ })).toBeVisible()
    await expect(page.getByTestId('table-buoi').locator('tbody tr')).toHaveCount(15)
    await screenshot(page, '06-chi-tiet-am')
  })

  test('thiếu trường bắt buộc / số sai: báo lỗi, giữ nội dung, không lưu; bấm Nộp liên tiếp chỉ tạo một bài', async ({
    page,
  }) => {
    await loginTeacher(page)
    await openTemplate(page, /Điền Phiếu theo dõi dữ liệu quá trình can thiệp âm mục tiêu/)

    await page.getByLabel('Tên trẻ').fill('   ')
    await page.getByLabel('Buổi 1 – Tỉ lệ đúng').fill('120')
    await page.getByRole('textbox', { name: 'Ghi chú' }).fill('Nội dung cần giữ lại')
    await page.getByRole('button', { name: 'Nộp phiếu' }).click()

    await expect(page.getByTestId('worksheet-form-error')).toContainText('ô cần kiểm tra lại')
    await expect(page.getByText('Vui lòng nhập Tên trẻ.')).toBeVisible()
    await expect(page.getByText('Buổi 1 – Tỉ lệ đúng: Phải từ 0 đến 100.')).toBeVisible()
    await expect(page.getByLabel('Tên trẻ')).toBeFocused()
    await expect(page.getByLabel('Tên trẻ')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('textbox', { name: 'Ghi chú' })).toHaveValue('Nội dung cần giữ lại')
    await screenshot(page, '07-loi-validation')
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(0)

    await page.getByLabel('Tên trẻ').fill('Trẻ thử nghiệm')
    await page.getByLabel('Âm mục tiêu').fill('Ch')
    await page.getByLabel('Tháng', { exact: true }).selectOption('09')
    await page.getByLabel('Năm', { exact: true }).fill('2026')
    await page.getByLabel('Buổi 1 – Tỉ lệ đúng').fill('80')
    await page.getByRole('button', { name: 'Nộp phiếu' }).dblclick()

    await expect(page).toHaveURL(/\/giaovien\/bai-da-nop\/\d+/)
    await page.waitForTimeout(1500)
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(1)
  })

  test('phiên hết hạn: báo rõ, giữ nội dung; đăng nhập lại rồi nộp được', async ({ page }) => {
    await loginTeacher(page)
    await openTemplate(page, /Điền Phiếu theo dõi dữ liệu quá trình can thiệp âm mục tiêu/)
    await page.getByLabel('Tên trẻ').fill('Trẻ thử nghiệm')
    await page.getByLabel('Âm mục tiêu').fill('S')
    await page.getByLabel('Tháng', { exact: true }).selectOption('08')
    await page.getByLabel('Năm', { exact: true }).fill('2026')

    await page.context().clearCookies()
    await page.getByRole('button', { name: 'Nộp phiếu' }).click()
    await expect(page.getByTestId('worksheet-form-error')).toContainText('Phiên đăng nhập đã hết hạn')
    await expect(page.getByLabel('Tên trẻ')).toHaveValue('Trẻ thử nghiệm')
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(0)

    await loginByApi(page, EMAILS.teacherA)
    await page.getByRole('button', { name: 'Nộp phiếu' }).click()
    await expect(page).toHaveURL(/\/giaovien\/bai-da-nop\/\d+\?vua-nop=1$/)
  })
})

test.describe('Phân quyền và bài cũ', () => {
  test('Giáo viên A không xem được phiếu của B; Admin xem được cả hai trong /admin', async ({ page }) => {
    const base = { amMucTieu: 'Tr', thangNam: '2026-10', buoi: [{ ngay: 1, phanTram: 30 }] }
    await createSubmission(users.teacherA, { ...base, tenTre: 'TRE-CUA-A' })
    const submissionB = await createSubmission(users.teacherB, { ...base, tenTre: 'TRE-CUA-B' })

    await loginTeacher(page)
    await page.goto(`${BASE_URL}/giaovien/bai-da-nop`)
    await expect(page.getByTestId('submission-card')).toHaveCount(1)
    await expect(page.getByText('TRE-CUA-B')).toHaveCount(0)

    await page.goto(`${BASE_URL}/giaovien/bai-da-nop/${submissionB.id}`)
    await expect(page.getByText('Không tìm thấy trang bạn yêu cầu.')).toBeVisible()
    await expect(page.getByText('TRE-CUA-B')).toHaveCount(0)

    await page.context().clearCookies()
    await loginByApi(page, EMAILS.admin)
    await page.goto(`${BASE_URL}/admin/collections/${SLUG}`)
    await expect(page.locator('table tbody tr')).toHaveCount(2)
    await expect(page.locator('table')).toContainText('Giáo viên A')
    await expect(page.locator('table')).toContainText('Giáo viên B')
    await expect(page.getByRole('link', { name: /Create New|Tạo mới/i })).toHaveCount(0)
    await screenshot(page, '08-admin-danh-sach')

    await page.goto(`${BASE_URL}/admin/collections/${SLUG}/${submissionB.id}`)
    await expect(page.getByText('TRE-CUA-B')).toBeVisible()
    await expect(page.getByRole('img', { name: /Buổi 1: 30%/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^(Save|Lưu)$/ })).toHaveCount(0)
    await screenshot(page, '09-admin-chi-tiet')
  })

  test('khách và học sinh không vào được khu vực phiếu', async ({ page }) => {
    for (const path of ['/giaovien/phieu', '/giaovien/phieu/moi', '/giaovien/phieu/moi/phieu-theo-doi-ca']) {
      await page.goto(`${BASE_URL}${path}`)
      await expect(page).toHaveURL(`${BASE_URL}/login/giaovien`)
    }

    await loginByApi(page, EMAILS.student)
    await page.goto(`${BASE_URL}/giaovien/phieu/moi/phieu-theo-doi-ca`)
    await expect(page).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)
  })

  test('bài nộp kiểu cũ (worksheet do Admin soạn) vẫn hiển thị đúng', async ({ page }) => {
    const worksheet = await payload.create({
      collection: 'worksheets',
      data: { title: 'Worksheet kiểu cũ', questions: [{ key: 'cau-1', label: 'Câu hỏi kiểu cũ', required: true }] },
    })
    // Ghi thẳng vào database (bỏ qua hook) như dữ liệu tạo trước khi đổi sang mẫu hệ thống
    const legacy = await payload.db.create({
      collection: SLUG,
      data: {
        answers: [{ id: 'e2e-legacy-answer', questionKey: 'cau-1', value: 'Câu trả lời kiểu cũ' }],
        submittedAt: '2026-10-20T08:00:00.000Z',
        teacher: users.teacherA.id,
        title: 'Worksheet kiểu cũ',
        worksheet: worksheet.id,
        worksheetSnapshot: {
          title: 'Worksheet kiểu cũ',
          questions: [{ id: 'e2e-legacy-question', key: 'cau-1', label: 'Câu hỏi kiểu cũ', required: true }],
        },
      },
    })

    await loginTeacher(page)
    await page.goto(`${BASE_URL}/giaovien/bai-da-nop`)
    await expect(page.getByTestId('submission-card')).toContainText('Worksheet kiểu cũ')

    await page.goto(`${BASE_URL}/giaovien/bai-da-nop/${legacy.id}`)
    await expect(page.getByTestId('submission-title')).toHaveText('Worksheet kiểu cũ')
    await expect(page.getByText('Câu hỏi kiểu cũ')).toBeVisible()
    await expect(page.getByText('Câu trả lời kiểu cũ')).toBeVisible()
  })

  test('form trên điện thoại không tràn ngang', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()

    await loginTeacher(page)
    for (const code of ['phieu-theo-doi-ca', 'phieu-am-muc-tieu']) {
      await page.goto(`${BASE_URL}/giaovien/phieu/moi/${code}`)
      await expect(page.getByRole('button', { name: 'Nộp phiếu' })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
      await screenshot(page, `10-mobile-${code}`)
    }

    await context.close()
  })
})
