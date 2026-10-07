import { expect, test, type Page } from '@playwright/test'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

// playwright.config.ts chỉ nạp .env.test (database local), dev server dùng cùng env đó

const BASE_URL = 'http://localhost:3000'
const PASSWORD = 'MatKhau123!'
const STUDENT_EMAIL = 'e2e-hs-lessons@test.local'
const INACTIVE_STUDENT_EMAIL = 'e2e-hs-inactive@test.local'

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
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      },
    ],
  },
})

const stepText = (sound: string, step: number) => `Nội dung âm ${sound} - bước ${step}`

// `input` là giá trị Admin gõ (có thể kèm "Âm "), `sound` là tên âm được lưu
const lessonData = (input: string, sound: string, order: number) => ({
  sound: input,
  order,
  steps: Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => [`step${index + 1}`, richText(stepText(sound, index + 1))]),
  ),
})

const lessonIds: number[] = []

const seed = async () => {
  const payload = await getPayload({ config })

  // Database test local: bắt đầu từ bảng lessons trống để danh sách có thứ tự xác định
  await payload.delete({ collection: 'lessons', where: {} })
  await payload.delete({
    collection: 'users',
    where: { email: { in: [STUDENT_EMAIL, INACTIVE_STUDENT_EMAIL] } },
  })

  for (const [email, accountStatus] of [
    [STUDENT_EMAIL, 'active'],
    [INACTIVE_STUDENT_EMAIL, 'pending'],
  ] as const) {
    await payload.create({
      collection: 'users',
      data: { name: 'Học sinh E2E', email, password: PASSWORD, role: 'hocsinh', accountStatus },
    })
  }

  // Tạo ngược thứ tự để kiểm tra sắp xếp theo order; "Âm Ch" kiểm tra chuẩn hóa tên âm
  for (const [input, sound, order] of [
    ['Âm Ch', 'Ch', 2],
    ['Th', 'Th', 1],
  ] as const) {
    const lesson = await payload.create({
      collection: 'lessons',
      data: lessonData(input, sound, order),
    })
    lessonIds.push(lesson.id)
  }
}

const cleanup = async () => {
  const payload = await getPayload({ config })

  await payload.delete({ collection: 'lessons', where: { id: { in: lessonIds } } })
  await payload.delete({
    collection: 'users',
    where: { email: { in: [STUDENT_EMAIL, INACTIVE_STUDENT_EMAIL] } },
  })
}

const loginAsStudent = async (page: Page, email = STUDENT_EMAIL) => {
  await page.goto(`${BASE_URL}/login/hocsinh`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu').fill(PASSWORD)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.waitForURL(`${BASE_URL}/hocsinh/dashboard`)
}

const stepContent = (page: Page) => page.getByTestId('step-content')

const expectStep = async (page: Page, sound: string, step: number) => {
  await expect(page.getByRole('heading', { name: `Bước ${step} / 9` })).toBeVisible()
  await expect(stepContent(page)).toHaveText(stepText(sound, step))
  await expect(page.getByRole('link', { name: `Bước ${step}`, exact: true })).toHaveAttribute(
    'aria-current',
    'step',
  )
}

// Từ ngữ của các tính năng nằm ngoài phạm vi (có trong mockup nhưng không được làm)
const OUT_OF_SCOPE_TEXT = [
  'Mục tiêu',
  'Tiến độ',
  'hoàn thành',
  'Vần',
  'Ghi âm',
  'Nghe mẫu',
  'Chạm để nói',
  'Chấm điểm',
  'Huy hiệu',
  'Phụ huynh',
  'Tìm âm',
]

const expectNoOutOfScopeFeatures = async (page: Page) => {
  const text = (await page.locator('main').innerText()).toLowerCase()

  for (const phrase of OUT_OF_SCOPE_TEXT) {
    expect(text, `không được có "${phrase}"`).not.toContain(phrase.toLowerCase())
  }

  await expect(page.locator('main audio, main video, main input, main progress')).toHaveCount(0)
}

test.describe('Bài học', () => {
  test.beforeAll(seed)
  test.afterAll(cleanup)

  test('khách vào /bai-hoc bị chuyển tới /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/bai-hoc`)
    await expect(page).toHaveURL(`${BASE_URL}/login`)

    await page.goto(`${BASE_URL}/bai-hoc/${lessonIds[0]}?step=3`)
    await expect(page).toHaveURL(`${BASE_URL}/login`)
    await expect(page.getByText(stepText('Ch', 3))).toHaveCount(0)
  })

  test('học sinh không active bị chuyển về /login', async ({ page }) => {
    // Học sinh bị Admin chuyển sang pending vẫn đăng nhập được, nhưng không được xem bài
    await loginAsStudent(page, INACTIVE_STUDENT_EMAIL)

    await page.goto(`${BASE_URL}/bai-hoc`)
    await expect(page).toHaveURL(`${BASE_URL}/login`)

    await page.goto(`${BASE_URL}/bai-hoc/${lessonIds[1]}`)
    await expect(page).toHaveURL(`${BASE_URL}/login`)
    await expect(page.getByText('Nội dung âm')).toHaveCount(0)
  })

  test('khách gọi API trực tiếp không lấy được nội dung', async ({ request }) => {
    const list = await request.get(`${BASE_URL}/api/lessons`)
    expect(list.status()).toBe(403)
    expect(await list.text()).not.toContain('Nội dung âm')

    const detail = await request.get(`${BASE_URL}/api/lessons/${lessonIds[0]}`)
    expect(detail.status()).toBe(403)
    expect(await detail.text()).not.toContain('Nội dung âm')

    for (const [method, path] of [
      ['POST', '/api/lessons'],
      ['PATCH', `/api/lessons/${lessonIds[0]}`],
      ['DELETE', `/api/lessons/${lessonIds[0]}`],
    ] as const) {
      const response = await request.fetch(`${BASE_URL}${path}`, {
        method,
        data: method === 'DELETE' ? undefined : { sound: 'Xx', order: 9 },
      })
      expect(response.status(), `${method} ${path}`).toBe(403)
      expect(await response.text()).not.toContain('Nội dung âm')
    }

    const graphql = await request.post(`${BASE_URL}/api/graphql`, {
      data: {
        query: `{
          Lessons { docs { sound steps { step1 step2 step3 step4 step5 step6 step7 step8 step9 } } }
          Lesson(id: ${lessonIds[0]}) { sound steps { step1 step9 } }
        }`,
      },
    })
    const body = await graphql.json()
    expect(body.errors?.length).toBeGreaterThan(0)
    expect(body.data?.Lessons ?? null).toBeNull()
    expect(body.data?.Lesson ?? null).toBeNull()
    expect(JSON.stringify(body)).not.toContain('Nội dung âm')
  })

  test('học sinh active thấy danh sách, mở bài và chuyển giữa 9 bước', async ({ page }) => {
    await loginAsStudent(page)

    await page.goto(`${BASE_URL}/bai-hoc`)
    await expect(page.getByRole('heading', { name: 'Chọn bài để luyện' })).toBeVisible()

    const cards = page.getByTestId('lesson-card')
    await expect(cards).toHaveCount(2)
    await expect(cards.nth(0)).toHaveAccessibleName('Âm Th')
    await expect(cards.nth(1)).toHaveAccessibleName('Âm Ch')
    await expect(page.getByText(/Âm\s+Âm/)).toHaveCount(0)
    await expectNoOutOfScopeFeatures(page)

    // Mở bài đầu tiên (order = 1)
    await cards.first().click()
    await expect(page).toHaveURL(new RegExp(`/bai-hoc/${lessonIds[1]}$`))
    await expect(page.getByRole('heading', { name: 'Âm Th', level: 1 })).toBeVisible()

    // Đúng 9 bước, không có bước 10
    const stepLinks = page.getByRole('navigation', { name: 'Các bước' }).getByRole('link')
    await expect(stepLinks).toHaveCount(9)
    await expect(stepLinks).toHaveText(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
    await expect(page.getByRole('link', { name: 'Bước 10' })).toHaveCount(0)
    await expect(page.getByText('Bước 10')).toHaveCount(0)

    // Rich Text được render thành HTML, không phải JSON thô
    await expect(stepContent(page).locator('p')).toHaveText(stepText('Th', 1))
    await expect(stepContent(page)).not.toContainText('"root"')

    await expectStep(page, 'Th', 1)
    await expect(page.getByRole('link', { name: 'Trước' })).toHaveAttribute('aria-disabled', 'true')

    // Tiếp / Trước
    await page.getByRole('link', { name: 'Tiếp' }).click()
    await expect(page).toHaveURL(/\?step=2$/)
    await expectStep(page, 'Th', 2)

    await page.getByRole('link', { name: 'Tiếp' }).click()
    await expectStep(page, 'Th', 3)

    await page.getByRole('link', { name: 'Trước' }).click()
    await expect(page).toHaveURL(/\?step=2$/)
    await expectStep(page, 'Th', 2)

    // Chọn bước trực tiếp trên thanh bước
    await page.getByRole('link', { name: 'Bước 9', exact: true }).click()
    await expect(page).toHaveURL(/\?step=9$/)
    await expectStep(page, 'Th', 9)
    await expect(page.getByRole('link', { name: 'Tiếp' })).toHaveAttribute('aria-disabled', 'true')

    await expectNoOutOfScopeFeatures(page)
  })

  test('step không hợp lệ được đưa về khoảng 1–9', async ({ page }) => {
    await loginAsStudent(page)

    for (const [query, expected] of [
      ['?step=0', 1],
      ['?step=-5', 1],
      ['?step=abc', 1],
      ['?step=10', 9],
      ['?step=999', 9],
      ['', 1],
    ] as const) {
      await page.goto(`${BASE_URL}/bai-hoc/${lessonIds[0]}${query}`)
      await expectStep(page, 'Ch', expected)
    }
  })

  test('id bài học không tồn tại trả về trang 404', async ({ page }) => {
    await loginAsStudent(page)

    const response = await page.goto(`${BASE_URL}/bai-hoc/99999999`)
    expect(response?.status()).toBe(404)

    const invalid = await page.goto(`${BASE_URL}/bai-hoc/abc`)
    expect(invalid?.status()).toBe(404)
  })
})
