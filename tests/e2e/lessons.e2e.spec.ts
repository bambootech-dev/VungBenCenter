import { expect, test, type Page } from '@playwright/test'
import { getPayload } from 'payload'
import sharp from 'sharp'

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
let thumbnailId: number | undefined

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

  // Ảnh tự tạo (16:9) cho bài Ch; bài Th không có ảnh để kiểm tra placeholder
  const image = await sharp({
    create: { width: 320, height: 180, channels: 3, background: '#bbf7d0' },
  })
    .png()
    .toBuffer()
  const media = await payload.create({
    collection: 'media',
    data: { alt: '' },
    file: { data: image, mimetype: 'image/png', name: 'e2e-lesson-thumbnail.png', size: image.length },
  })
  thumbnailId = media.id

  // Tạo ngược thứ tự để kiểm tra sắp xếp theo order; "Âm Ch" kiểm tra chuẩn hóa tên âm
  for (const [input, sound, order, thumbnail] of [
    ['Âm Ch', 'Ch', 2, media.id],
    ['Th', 'Th', 1, null],
  ] as const) {
    const lesson = await payload.create({
      collection: 'lessons',
      data: { ...lessonData(input, sound, order), thumbnail },
    })
    lessonIds.push(lesson.id)
  }
}

const cleanup = async () => {
  const payload = await getPayload({ config })

  await payload.delete({ collection: 'lessons', where: { id: { in: lessonIds } } })
  if (thumbnailId) await payload.delete({ collection: 'media', id: thumbnailId })
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
]

const expectNoOutOfScopeFeatures = async (page: Page) => {
  const text = (await page.locator('main').innerText()).toLowerCase()

  for (const phrase of OUT_OF_SCOPE_TEXT) {
    expect(text, `không được có "${phrase}"`).not.toContain(phrase.toLowerCase())
  }

  await expect(page.locator('main audio, main video, main progress, main select')).toHaveCount(0)
  // Chỉ được có ô tìm kiếm bài học (trang danh sách), không có input nào khác
  await expect(page.locator('main input:not([type="search"])')).toHaveCount(0)
  expect(await page.locator('main input[type="search"]').count()).toBeLessThanOrEqual(1)
}

// Các tab/tính năng của mockup không thuộc iteration này: so khớp nguyên từ ("Từ" không khớp "từng")
const OUT_OF_SCOPE_WORDS = ['vần', 'từ', 'câu']
const OUT_OF_SCOPE_PHRASES = ['tiến độ', 'mục tiêu hôm nay']

const expectNoOutOfScopeWords = async (page: Page) => {
  const text = (await page.locator('body').innerText()).toLowerCase()
  const words = text.split(/[^\p{L}\p{N}]+/u)

  for (const word of OUT_OF_SCOPE_WORDS) {
    expect(words, `không được có "${word}"`).not.toContain(word)
  }

  for (const phrase of OUT_OF_SCOPE_PHRASES) {
    expect(text, `không được có "${phrase}"`).not.toContain(phrase)
  }
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

  test('giao diện: link card, không có tính năng ngoài phạm vi, không tràn ngang ở 320px', async ({
    page,
  }) => {
    await loginAsStudent(page)
    await page.setViewportSize({ width: 320, height: 800 })

    await page.goto(`${BASE_URL}/bai-hoc`)
    const cards = page.getByTestId('lesson-card')
    await expect(cards.nth(0)).toHaveAttribute('href', `/bai-hoc/${lessonIds[1]}`)
    await expect(cards.nth(1)).toHaveAttribute('href', `/bai-hoc/${lessonIds[0]}`)
    await expect(cards.nth(0)).toContainText('Âm Th')
    await expect(cards.locator('button')).toHaveCount(0)

    for (const url of [`/bai-hoc`, `/bai-hoc/${lessonIds[1]}?step=1`, `/bai-hoc/${lessonIds[1]}?step=9`]) {
      await page.goto(`${BASE_URL}${url}`)
      await expectNoOutOfScopeWords(page)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${url} tràn ngang ở 320px`).toBeLessThanOrEqual(0)
    }

    // Ở 320px vẫn đủ 9 nút bước, mỗi nút tối thiểu 44px
    const stepLinks = page.getByRole('navigation', { name: 'Các bước' }).getByRole('link')
    await expect(stepLinks).toHaveCount(9)
    for (const box of await stepLinks.evaluateAll((links) =>
      links.map((link) => link.getBoundingClientRect()),
    )) {
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('tìm kiếm bài học theo tên âm (lọc ở client)', async ({ page }) => {
    await loginAsStudent(page)

    // Tìm kiếm không được gọi API bài học từ trình duyệt
    const lessonApiCalls: string[] = []
    page.on('request', (request) => {
      if (/\/api\/(lessons|graphql)/.test(request.url())) lessonApiCalls.push(request.url())
    })

    await page.goto(`${BASE_URL}/bai-hoc`)

    const search = page.getByRole('searchbox', { name: 'Tìm bài học âm' })
    await expect(search).toHaveAttribute('placeholder', 'Tìm bài học âm...')
    const cards = page.getByTestId('lesson-card')
    const empty = page.getByText('Không tìm thấy bài học phù hợp.')
    await expect(cards).toHaveCount(2)

    for (const keyword of ['th', 'TH', 'Th', '  th  ', 'Âm Th', 'âm th', '  ÂM TH ']) {
      await search.fill(keyword)
      await expect(cards, `"${keyword}"`).toHaveCount(1)
      await expect(cards.first()).toHaveAccessibleName('Âm Th')
      await expect(empty).toHaveCount(0)
    }

    await search.fill('ch')
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toHaveAccessibleName('Âm Ch')

    await search.fill('xyz')
    await expect(cards).toHaveCount(0)
    await expect(empty).toBeVisible()

    // Xóa từ khóa: hiện lại toàn bộ bài, đúng thứ tự
    await search.fill('')
    await expect(empty).toHaveCount(0)
    await expect(cards).toHaveCount(2)
    await expect(cards.nth(0)).toHaveAccessibleName('Âm Th')
    await expect(cards.nth(1)).toHaveAccessibleName('Âm Ch')

    await search.fill('   ')
    await expect(cards).toHaveCount(2)

    expect(lessonApiCalls).toEqual([])
    await expectNoOutOfScopeWords(page)
  })

  test('thumbnail: có ảnh thì hiển thị ảnh, không có hoặc ảnh lỗi thì hiển thị placeholder', async ({
    page,
  }) => {
    await loginAsStudent(page)
    await page.goto(`${BASE_URL}/bai-hoc`)

    const [th, ch] = [page.getByTestId('lesson-card').nth(0), page.getByTestId('lesson-card').nth(1)]
    await expect(th.getByTestId('lesson-thumbnail-placeholder')).toHaveText('Th')
    await expect(th.getByTestId('lesson-thumbnail-image')).toHaveCount(0)

    const image = ch.getByTestId('lesson-thumbnail-image')
    await expect(image).toBeVisible()
    await expect(image).toHaveCSS('object-fit', 'cover')
    expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)

    // Phần ảnh giữ tỷ lệ 16:10 dù ảnh gốc là 16:9
    const box = await image.boundingBox()
    expect(box!.width / box!.height).toBeCloseTo(1.6, 1)

    // Ảnh không tải được: phần ảnh không biến mất mà chuyển sang placeholder
    await page.route('**/_next/image**', (route) => route.abort())
    await page.route('**/api/media/file/**', (route) => route.abort())
    await page.reload()
    await expect(ch.getByTestId('lesson-thumbnail-placeholder')).toHaveText('Ch')
    await expect(ch.getByTestId('lesson-thumbnail-image')).toHaveCount(0)
  })

  test('điều hướng bằng bàn phím', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto(`${BASE_URL}/bai-hoc`)

    // Tab tới card bài đầu tiên rồi Enter để mở
    const firstCard = page.getByTestId('lesson-card').first()
    for (let i = 0; i < 15 && !(await firstCard.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab')
    }
    await expect(firstCard).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/bai-hoc/${lessonIds[1]}$`))
    await expectStep(page, 'Th', 1)

    // "Tiếp" và nút bước dùng được bằng bàn phím
    await page.getByRole('link', { name: 'Tiếp' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\?step=2$/)
    await expectStep(page, 'Th', 2)

    await page.getByRole('link', { name: 'Bước 5', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\?step=5$/)
    await expectStep(page, 'Th', 5)
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
