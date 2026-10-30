import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'
import type { Lesson, User } from '../../src/payload-types.js'

// playwright.config.ts chỉ nạp .env.test (database local), dev server dùng cùng env đó.
// Không có giao dịch thật: Admin xác nhận đơn thử nghiệm bằng Local API trong database test.

const BASE_URL = 'http://localhost:3000'
const PASSWORD = 'MatKhau123!'
const EMAILS = { admin: 'e2e-sub-admin@test.local', student: 'e2e-sub-hs@test.local' }
const CONTENT = 'Nội dung trả phí E2E'

const richText = (text: string) => ({
  root: {
    type: 'root',
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
        children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
      },
    ],
  },
})

let payload: Payload
const users = {} as Record<keyof typeof EMAILS, User>
const lessons: Lesson[] = []

const clear = async () => {
  for (const collection of ['audit-logs', 'subscriptions', 'orders', 'plans', 'lessons'] as const) {
    await payload.db.deleteMany({ collection, where: {} })
  }
  await payload.delete({ collection: 'users', where: { email: { in: Object.values(EMAILS) } } })
}

const loginStudent = async (page: Page) => {
  await page.goto(`${BASE_URL}/login/hocsinh`)
  await page.getByLabel('Email').fill(EMAILS.student)
  await page.getByLabel('Mật khẩu').fill(PASSWORD)
  await page.getByRole('main').getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  payload = await getPayload({ config })
  await clear()

  users.admin = await payload.create({
    collection: 'users',
    data: { name: 'Admin E2E', email: EMAILS.admin, password: PASSWORD, role: 'admin', accountStatus: 'active' },
  })
  users.student = await payload.create({
    collection: 'users',
    data: { name: 'Học sinh Gói', email: EMAILS.student, password: PASSWORD, role: 'hocsinh', accountStatus: 'active' },
  })

  for (const [order, sound] of ['r', 'th', 'tr'].entries()) {
    lessons.push(
      await payload.create({
        collection: 'lessons',
        data: {
          sound,
          order,
          steps: Object.fromEntries(
            Array.from({ length: 9 }, (_, index) => [`step${index + 1}`, richText(`${CONTENT} ${sound} ${index + 1}`)]),
          ),
        },
      }),
    )
  }

  await payload.create({
    collection: 'plans',
    data: {
      name: 'Luyện phát âm cơ bản',
      code: 'e2e-co-ban',
      kind: 'bundle',
      price: 399000,
      currency: 'VND',
      durationType: 'months',
      durationMonths: 1,
      lessons: [lessons[0].id, lessons[1].id],
      benefits: [{ text: 'Học không giới hạn trong 1 tháng' }],
      isActive: true,
      sortOrder: 1,
    },
  })
  await payload.create({
    collection: 'plans',
    data: {
      name: 'Âm Tr',
      code: 'e2e-am-tr',
      kind: 'single',
      price: 99000,
      currency: 'VND',
      durationType: 'lifetime',
      lessons: [lessons[2].id],
      isActive: true,
      sortOrder: 2,
    },
  })
})

test.afterAll(clear)

test('khách xem được trang Gói học (giá, thời hạn, bài học) và phải đăng nhập để mua', async ({ page }) => {
  await page.goto(`${BASE_URL}/goi-hoc`)

  const cards = page.getByTestId('plan-card')
  await expect(cards).toHaveCount(2)
  await expect(cards.nth(0)).toContainText('Luyện phát âm cơ bản')
  await expect(cards.nth(0)).toContainText('399.000')
  await expect(cards.nth(0)).toContainText('Thời hạn: 1 tháng')
  await expect(cards.nth(0)).toContainText('Âm r')
  await expect(cards.nth(0)).toContainText('Học không giới hạn trong 1 tháng')
  await expect(cards.nth(1)).toContainText('Không thời hạn')
  await expect(cards.nth(0).getByRole('link', { name: 'Đăng nhập để mua' })).toBeVisible()
})

test('học sinh đặt mua → đơn chờ thanh toán (chưa mở bài) → Admin xác nhận → vào học được', async ({ page }) => {
  await loginStudent(page)

  // Chưa có quyền: bài bị khóa, card dẫn tới các gói có bài đó
  await page.goto(`${BASE_URL}/bai-hoc`)
  const firstCard = page.getByTestId('lesson-card').first()
  await expect(firstCard).toHaveAttribute('data-unlocked', 'false')
  await firstCard.click()
  await expect(page).toHaveURL(`${BASE_URL}/goi-hoc?bai=${lessons[0].id}`)
  await expect(page.getByTestId('plan-card')).toHaveCount(1)

  await page.getByRole('button', { name: 'Đặt mua Luyện phát âm cơ bản' }).click()
  await expect(page).toHaveURL(/\/hocsinh\/dashboard\?don-hang=\d+/)
  await expect(page.getByTestId('my-orders')).toContainText('Chờ thanh toán')
  await expect(page.getByTestId('unlocked-empty')).toBeVisible()

  // Đặt lại cùng gói: dùng lại đơn đang chờ, không tạo đơn trùng
  await page.goto(`${BASE_URL}/goi-hoc`)
  await page.getByRole('button', { name: 'Đặt mua Luyện phát âm cơ bản' }).click()
  await expect(page).toHaveURL(/\/hocsinh\/dashboard\?don-hang=\d+/)
  const { docs: orders } = await payload.find({ collection: 'orders', where: { user: { equals: users.student.id } } })
  expect(orders).toHaveLength(1)
  expect(orders[0].status).toBe('pending')

  // Đơn chờ thanh toán chưa mở quyền, kể cả mở URL trực tiếp
  await page.goto(`${BASE_URL}/bai-hoc/${lessons[0].id}`)
  await expect(page.getByTestId('lesson-locked')).toBeVisible()
  await expect(page.getByText(CONTENT)).toHaveCount(0)

  // Admin xác nhận đã nhận tiền
  await payload.update({
    collection: 'orders',
    id: orders[0].id,
    overrideAccess: false,
    user: { ...users.admin, collection: 'users' },
    data: { status: 'paid', paymentMethod: 'bank_transfer', transactionRef: 'E2E-THU-NGHIEM' },
  })

  await page.goto(`${BASE_URL}/bai-hoc`)
  await expect(page.locator('[data-testid="lesson-card"][data-unlocked="true"]')).toHaveCount(2)
  await expect(page.locator('[data-testid="lesson-card"][data-unlocked="false"]')).toHaveCount(1)

  await page.getByRole('button', { name: /Đã mở khóa/ }).click()
  await expect(page.getByTestId('lesson-card')).toHaveCount(2)

  await page.getByTestId('lesson-card').first().click()
  await expect(page.getByTestId('step-content')).toContainText(`${CONTENT} r 1`)

  // Bài không có trong gói vẫn khóa
  await page.goto(`${BASE_URL}/bai-hoc/${lessons[2].id}`)
  await expect(page.getByTestId('lesson-locked')).toBeVisible()

  await page.goto(`${BASE_URL}/hocsinh/dashboard`)
  await expect(page.getByTestId('unlocked-lessons')).toContainText('Âm r')
  await expect(page.getByTestId('my-subscriptions')).toContainText('Đang hiệu lực')
  await expect(page.getByTestId('my-orders')).toContainText('Đã thanh toán')
})

test('Admin quản lý gói, đơn, quyền học và nhật ký trong Payload Admin; học sinh thì không', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/login`)
  await page.fill('#field-email', EMAILS.admin)
  await page.fill('#field-password', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/admin`)

  for (const [slug, text] of [
    ['plans', 'Luyện phát âm cơ bản'],
    ['orders', EMAILS.student],
    ['subscriptions', EMAILS.student],
    ['audit-logs', 'Đơn mua'],
  ] as const) {
    await page.goto(`${BASE_URL}/admin/collections/${slug}`)
    await expect(page.locator('table')).toContainText(text)
  }

  await page.context().clearCookies()
  await loginStudent(page)
  for (const slug of ['orders', 'subscriptions', 'audit-logs']) {
    await page.goto(`${BASE_URL}/admin/collections/${slug}`)
    await expect(page.locator('table')).toHaveCount(0)
  }
})
