import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'
import type { User, Worksheet } from '../../src/payload-types.js'

// playwright.config.ts chỉ nạp .env.test (database local), dev server dùng cùng env đó

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
let worksheet: Worksheet

const worksheetData = {
  title: 'Phiếu E2E',
  instructions: 'Hướng dẫn phiếu E2E.\nDòng thứ hai của hướng dẫn.',
  questions: [
    { key: 'muc-tieu', label: 'Mục tiêu của buổi', required: true },
    { key: 'ghi-chu', label: 'Ghi chú thêm', required: false },
    { key: 'ket-qua', label: 'Kết quả đạt được', required: true },
  ],
}

const asUser = (user: User) => ({ ...user, collection: 'users' as const })

const clearData = async () => {
  // Bài nộp không xóa được qua API (đúng thiết kế): dọn trực tiếp trong database test
  await payload.db.deleteMany({ collection: SLUG, where: {} })
  await payload.db.deleteMany({ collection: 'worksheets', where: {} })
}

const submissionsOf = (user: User) =>
  payload.find({
    collection: SLUG,
    depth: 0,
    pagination: false,
    sort: '-submittedAt',
    where: { teacher: { equals: user.id } },
  })

const loginTeacher = async (page: Page, email = EMAILS.teacherA) => {
  await page.goto(`${BASE_URL}/login/giaovien`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu').fill(PASSWORD)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(`${BASE_URL}/giaovien/dashboard`)
}

// Đăng nhập bằng API (cookie dùng chung với page) cho các vai trò không có trang đăng nhập riêng ở đây
const loginByApi = async (page: Page, email: string) => {
  const response = await page.request.post(`${BASE_URL}/api/users/login`, {
    data: { email, password: PASSWORD },
  })
  expect(response.ok()).toBe(true)
}

const answerField = (page: Page, label: string) => page.getByLabel(label, { exact: false })

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
  await payload.update({
    collection: 'users',
    id: users.teacherA.id,
    data: { accountStatus: 'active' },
  })
  worksheet = await payload.create({ collection: 'worksheets', data: worksheetData })
})

test.afterAll(async () => {
  await clearData()
  await payload.delete({ collection: 'users', where: { email: { in: Object.values(EMAILS) } } })
})

test.describe('Giáo viên nộp phiếu', () => {
  test('mở → điền → nộp → chi tiết đọc lại từ database; tải lại không tạo thêm bài', async ({ page }) => {
    await loginTeacher(page)

    await page.getByRole('link', { name: 'Phiếu', exact: true }).click()
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/phieu`)
    const card = page.getByTestId('worksheet-card').filter({ hasText: 'Phiếu E2E' })
    await expect(card).toContainText('Hướng dẫn phiếu E2E.')
    await screenshot(page, '01-danh-sach-phieu')

    await card.getByRole('link', { name: /Mở phiếu/ }).click()
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/phieu/${worksheet.id}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Phiếu E2E' })).toBeVisible()

    // Câu hỏi hiển thị đúng thứ tự của worksheet
    await expect(page.locator('textarea')).toHaveCount(3)
    await expect(page.locator('textarea').nth(0)).toHaveAttribute('data-question-key', 'muc-tieu')
    await expect(page.locator('textarea').nth(2)).toHaveAttribute('data-question-key', 'ket-qua')

    await answerField(page, 'Mục tiêu của buổi').fill('  Ôn âm Tr và Ch  ')
    await answerField(page, 'Kết quả đạt được').fill('Học sinh đọc đúng 8/10 từ.\nCần ôn thêm âm Ch.')
    await screenshot(page, '02-dien-phieu')

    await page.getByRole('button', { name: 'Nộp phiếu' }).click()

    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/giaovien/bai-da-nop/\\d+\\?vua-nop=1$`))
    await expect(page.getByTestId('submission-success')).toContainText('Đã nộp phiếu thành công')

    const { docs } = await submissionsOf(users.teacherA)
    expect(docs).toHaveLength(1)
    const [saved] = docs
    expect(page.url()).toContain(`/giaovien/bai-da-nop/${saved.id}`)
    expect(saved.teacher).toBe(users.teacherA.id)
    expect(saved.answers?.map(({ questionKey, value }) => ({ questionKey, value }))).toEqual([
      { questionKey: 'muc-tieu', value: 'Ôn âm Tr và Ch' },
      { questionKey: 'ket-qua', value: 'Học sinh đọc đúng 8/10 từ.\nCần ôn thêm âm Ch.' },
    ])

    const checkDetail = async () => {
      await expect(page.getByTestId('submission-title')).toHaveText('Phiếu E2E')
      await expect(page.getByTestId('submission-teacher')).toHaveText('Giáo viên A')
      await expect(page.getByTestId('submission-time').locator('time')).toHaveAttribute(
        'datetime',
        saved.submittedAt,
      )
      const items = page.getByTestId('submission-answers').locator('li')
      await expect(items.nth(0)).toContainText('Ôn âm Tr và Ch')
      await expect(items.nth(1)).toContainText('Không trả lời')
      await expect(items.nth(2)).toContainText('Cần ôn thêm âm Ch.')
    }

    await checkDetail()
    await screenshot(page, '03-chi-tiet-vua-nop')

    // Tải lại và mở trực tiếp URL: vẫn đúng dữ liệu, không có POST lại
    await page.reload()
    await checkDetail()
    await page.goto(`${BASE_URL}/giaovien/bai-da-nop/${saved.id}`)
    await checkDetail()
    await expect(page.getByTestId('submission-success')).toHaveCount(0)
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(1)

    // Không có nút sửa/xóa
    await expect(page.getByRole('button', { name: /Sửa|Xóa/ })).toHaveCount(0)

    await page.getByRole('link', { name: 'Bài đã nộp', exact: true }).first().click()
    await expect(page.getByTestId('submission-card')).toHaveCount(1)
    await expect(page.getByTestId('submission-card')).toContainText('Phiếu E2E')
    await screenshot(page, '04-bai-da-nop')
  })

  test('bấm Nộp liên tiếp chỉ tạo một bài nộp', async ({ page }) => {
    await loginTeacher(page)
    await page.goto(`${BASE_URL}/giaovien/phieu/${worksheet.id}`)

    await answerField(page, 'Mục tiêu của buổi').fill('A')
    await answerField(page, 'Kết quả đạt được').fill('B')
    await page.getByRole('button', { name: 'Nộp phiếu' }).dblclick()

    await expect(page).toHaveURL(/\/giaovien\/bai-da-nop\/\d+/)
    // Chờ thêm để một request thứ hai (nếu có) kịp tới server
    await page.waitForTimeout(1500)
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(1)
  })

  test('thiếu câu bắt buộc hoặc chỉ có khoảng trắng: báo lỗi, giữ nội dung đã nhập, không lưu', async ({
    page,
  }) => {
    await loginTeacher(page)
    await page.goto(`${BASE_URL}/giaovien/phieu/${worksheet.id}`)

    await answerField(page, 'Mục tiêu của buổi').fill('   ')
    await answerField(page, 'Ghi chú thêm').fill('Ghi chú cần giữ lại')
    await page.getByRole('button', { name: 'Nộp phiếu' }).click()

    await expect(page.getByTestId('worksheet-form-error')).toContainText('Còn 2 câu cần kiểm tra lại')
    await expect(page.getByText('Vui lòng trả lời câu này.')).toHaveCount(2)
    await expect(answerField(page, 'Mục tiêu của buổi')).toBeFocused()
    await expect(answerField(page, 'Mục tiêu của buổi')).toHaveAttribute('aria-invalid', 'true')
    await expect(answerField(page, 'Ghi chú thêm')).toHaveValue('Ghi chú cần giữ lại')
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/phieu/${worksheet.id}`)
    await screenshot(page, '05-loi-bat-buoc')

    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(0)
  })

  test('phiên đăng nhập hết hạn: báo rõ, giữ nội dung; đăng nhập lại rồi nộp được', async ({ page }) => {
    await loginTeacher(page)
    await page.goto(`${BASE_URL}/giaovien/phieu/${worksheet.id}`)

    await answerField(page, 'Mục tiêu của buổi').fill('Nội dung trước khi hết phiên')
    await answerField(page, 'Kết quả đạt được').fill('Kết quả trước khi hết phiên')

    await page.context().clearCookies()
    await page.getByRole('button', { name: 'Nộp phiếu' }).click()

    await expect(page.getByTestId('worksheet-form-error')).toContainText('Phiên đăng nhập đã hết hạn')
    await expect(page.getByRole('link', { name: 'Đăng nhập lại trong thẻ mới' })).toBeVisible()
    await expect(answerField(page, 'Mục tiêu của buổi')).toHaveValue('Nội dung trước khi hết phiên')
    await expect(page.getByRole('button', { name: 'Nộp phiếu' })).toBeEnabled()
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(0)

    // Đăng nhập lại (cookie dùng chung cho cả context) rồi bấm Nộp lần nữa
    await loginByApi(page, EMAILS.teacherA)
    await page.getByRole('button', { name: 'Nộp phiếu' }).click()
    await expect(page).toHaveURL(/\/giaovien\/bai-da-nop\/\d+\?vua-nop=1$/)
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(1)
  })

  test('Giáo viên bị chuyển sang pending khi đang điền: báo không có quyền, giữ nội dung, không lưu', async ({
    page,
  }) => {
    await loginTeacher(page)
    await page.goto(`${BASE_URL}/giaovien/phieu/${worksheet.id}`)
    await answerField(page, 'Mục tiêu của buổi').fill('Nội dung của giáo viên bị khóa')
    await answerField(page, 'Kết quả đạt được').fill('x')

    await payload.update({ collection: 'users', id: users.teacherA.id, data: { accountStatus: 'pending' } })

    await page.getByRole('button', { name: 'Nộp phiếu' }).click()
    await expect(page.getByTestId('worksheet-form-error')).toContainText('không được nộp phiếu')
    await expect(answerField(page, 'Mục tiêu của buổi')).toHaveValue('Nội dung của giáo viên bị khóa')
    expect((await submissionsOf(users.teacherA)).totalDocs).toBe(0)

    // Tải lại trang với token cũ: bị đưa về trang đăng nhập
    await page.goto(`${BASE_URL}/giaovien/bai-da-nop`)
    await expect(page).toHaveURL(`${BASE_URL}/login/giaovien`)
  })

  test('sửa worksheet gốc không làm đổi nội dung bài đã nộp', async ({ page }) => {
    const submission = await payload.create({
      collection: SLUG,
      overrideAccess: false,
      user: asUser(users.teacherA),
      data: {
        worksheet: worksheet.id,
        answers: [
          { questionKey: 'muc-tieu', value: 'Trả lời cũ' },
          { questionKey: 'ket-qua', value: 'Kết quả cũ' },
        ],
      } as never,
    })

    await payload.update({
      collection: 'worksheets',
      id: worksheet.id,
      data: {
        title: 'Phiếu E2E (đã sửa)',
        instructions: 'Hướng dẫn mới',
        questions: [{ key: 'cau-moi', label: 'Câu hỏi mới', required: true }],
      },
    })

    await loginTeacher(page)
    await page.goto(`${BASE_URL}/giaovien/bai-da-nop/${submission.id}`)

    await expect(page.getByTestId('submission-title')).toHaveText('Phiếu E2E')
    await expect(page.getByText('Hướng dẫn phiếu E2E.')).toBeVisible()
    await expect(page.getByText('Mục tiêu của buổi')).toBeVisible()
    await expect(page.getByText('Trả lời cũ')).toBeVisible()
    await expect(page.getByText('Câu hỏi mới')).toHaveCount(0)
    await expect(page.getByText('Phiếu E2E (đã sửa)')).toHaveCount(0)
  })
})

test.describe('Phân quyền', () => {
  test('Giáo viên A không xem được bài của B qua danh sách hay URL trực tiếp', async ({ page }) => {
    const submissionB = await payload.create({
      collection: SLUG,
      overrideAccess: false,
      user: asUser(users.teacherB),
      data: {
        worksheet: worksheet.id,
        answers: [
          { questionKey: 'muc-tieu', value: 'BÍ-MẬT-CỦA-B' },
          { questionKey: 'ket-qua', value: 'x' },
        ],
      } as never,
    })

    await loginTeacher(page)

    await page.goto(`${BASE_URL}/giaovien/bai-da-nop`)
    await expect(page.getByTestId('submission-list-empty')).toBeVisible()
    await expect(page.getByText('BÍ-MẬT-CỦA-B')).toHaveCount(0)
    await screenshot(page, '06-bai-da-nop-trong')

    // Dòng ?page lớn vẫn chỉ là trang trống
    await page.goto(`${BASE_URL}/giaovien/bai-da-nop?page=2`)
    await expect(page.getByText('BÍ-MẬT-CỦA-B')).toHaveCount(0)

    // loading.tsx bật streaming nên notFound() trả HTTP 200 kèm trang 404 (hành vi của Next.js);
    // điều cần kiểm tra là trang không chứa dữ liệu của B
    await page.goto(`${BASE_URL}/giaovien/bai-da-nop/${submissionB.id}`)
    await expect(page.getByText('Không tìm thấy trang bạn yêu cầu.')).toBeVisible()
    await expect(page.getByText('BÍ-MẬT-CỦA-B')).toHaveCount(0)

    // REST với cookie của A cũng không trả bài của B
    const api = await page.request.get(`${BASE_URL}/api/${SLUG}/${submissionB.id}`)
    expect(api.ok()).toBe(false)
    expect(await api.text()).not.toContain('BÍ-MẬT-CỦA-B')
  })

  test('khách, học sinh và Admin không vào được khu vực phiếu của Giáo viên', async ({ page }) => {
    for (const path of ['/giaovien/phieu', `/giaovien/phieu/${worksheet.id}`, '/giaovien/bai-da-nop']) {
      await page.goto(`${BASE_URL}${path}`)
      await expect(page).toHaveURL(`${BASE_URL}/login/giaovien`)
    }

    await loginByApi(page, EMAILS.student)
    await page.goto(`${BASE_URL}/giaovien/phieu/${worksheet.id}`)
    await expect(page).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)
    await expect(page.getByText('Mục tiêu của buổi')).toHaveCount(0)

    await page.context().clearCookies()
    await loginByApi(page, EMAILS.admin)
    await page.goto(`${BASE_URL}/giaovien/bai-da-nop`)
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/admin`))
  })
})

test.describe('Admin xem bài nộp', () => {
  test('Admin thấy bài của A và B, lọc được theo giáo viên, mở chi tiết chỉ đọc', async ({ page }) => {
    for (const [teacher, text] of [
      [users.teacherA, 'TRẢ-LỜI-CỦA-A'],
      [users.teacherB, 'TRẢ-LỜI-CỦA-B'],
    ] as const) {
      await payload.create({
        collection: SLUG,
        overrideAccess: false,
        user: asUser(teacher),
        data: {
          worksheet: worksheet.id,
          answers: [
            { questionKey: 'muc-tieu', value: text },
            { questionKey: 'ket-qua', value: 'x' },
          ],
        } as never,
      })
    }

    await loginByApi(page, EMAILS.admin)
    await page.goto(`${BASE_URL}/admin/collections/${SLUG}`)

    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(2)
    await expect(page.locator('table')).toContainText('Giáo viên A')
    await expect(page.locator('table')).toContainText('Giáo viên B')
    await expect(page.locator('table')).toContainText('Phiếu E2E')
    // Admin không có nút tạo bài nộp
    await expect(page.getByRole('link', { name: /Create New|Tạo mới/i })).toHaveCount(0)
    await screenshot(page, '07-admin-danh-sach')

    // Lọc theo giáo viên bằng query where có sẵn của danh sách Payload
    await page.goto(`${BASE_URL}/admin/collections/${SLUG}?where[teacher][equals]=${users.teacherB.id}`)
    await expect(rows).toHaveCount(1)
    await expect(page.locator('table')).toContainText('Giáo viên B')
    await expect(page.locator('table')).not.toContainText('Giáo viên A')

    await rows.first().locator('a').first().click()
    await expect(page).toHaveURL(new RegExp(`/admin/collections/${SLUG}/\\d+`))
    await expect(page.getByText('Mục tiêu của buổi (muc-tieu)')).toBeVisible()
    // Câu trả lời nằm trong ô textarea chỉ đọc
    await expect
      .poll(() => page.locator('textarea').evaluateAll((els) => els.map((el) => (el as HTMLTextAreaElement).value)))
      .toContain('TRẢ-LỜI-CỦA-B')
    await expect(page.getByText('Trả lời câu "muc-tieu"')).toBeVisible()
    // Chỉ đọc: không có nút Lưu / Xóa
    await expect(page.getByRole('button', { name: /^(Save|Lưu)$/ })).toHaveCount(0)
    await screenshot(page, '08-admin-chi-tiet')
  })
})

test.describe('Trạng thái danh sách', () => {
  test('danh sách trống và phân trang phiếu', async ({ page }) => {
    await clearData()
    await loginTeacher(page)

    await page.goto(`${BASE_URL}/giaovien/phieu`)
    await expect(page.getByTestId('worksheet-list-empty')).toContainText('Chưa có phiếu nào')

    for (let index = 1; index <= 13; index++) {
      await payload.create({
        collection: 'worksheets',
        data: { title: `Phiếu số ${String(index).padStart(2, '0')}`, questions: [{ key: 'a', label: 'A' }] },
      })
    }

    await page.goto(`${BASE_URL}/giaovien/phieu`)
    await expect(page.getByTestId('worksheet-card')).toHaveCount(12)
    await expect(page.getByText('Trang 1 / 2')).toBeVisible()

    await page.getByRole('link', { name: 'Trang sau' }).click()
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/phieu?page=2`)
    await expect(page.getByTestId('worksheet-card')).toHaveCount(1)
    await expect(page.getByTestId('worksheet-card')).toContainText('Phiếu số 01')
  })

  test('giao diện trên điện thoại', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()

    await loginTeacher(page)
    await page.goto(`${BASE_URL}/giaovien/phieu/${worksheet.id}`)
    await expect(page.getByRole('button', { name: 'Nộp phiếu' })).toBeVisible()

    // Không tràn ngang
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)
    await screenshot(page, '09-dien-phieu-mobile')

    await context.close()
  })
})
