import { expect, test, type Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config.js'
import type { User } from '../../src/payload-types.js'

// playwright.config.ts chỉ nạp .env.test (database local), dev server dùng cùng env đó.

const BASE_URL = 'http://localhost:3000'
const PASSWORD = 'MatKhau123!'

const ACCOUNTS = {
  admin: { email: 'e2e-auth-admin@test.local', name: 'Admin Auth', role: 'admin' },
  teacher: { email: 'e2e-auth-gv@test.local', name: 'Giáo viên Auth', role: 'giaovien' },
  pendingTeacher: { email: 'e2e-auth-gv-pending@test.local', name: 'Giáo viên Chờ', role: 'giaovien' },
  student: { email: 'e2e-auth-hs@test.local', name: 'Học sinh Auth', role: 'hocsinh' },
} as const

type AccountKey = keyof typeof ACCOUNTS

let payload: Payload
const users = {} as Record<AccountKey, User>

const header = (page: Page) => page.getByRole('banner')
const footer = (page: Page) => page.getByRole('contentinfo')
const accountToggle = (page: Page, key: AccountKey) =>
  header(page).getByRole('button', { name: ACCOUNTS[key].name })

const expectGuestHeader = async (page: Page) => {
  await expect(header(page).getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible()
  await expect(header(page).getByRole('link', { name: 'Đăng ký', exact: true })).toBeVisible()
  await expect(header(page).getByTestId('account-menu')).toHaveCount(0)
}

const expectSignedInHeader = async (page: Page, key: AccountKey) => {
  await expect(accountToggle(page, key)).toBeVisible()
  await expect(header(page).getByRole('link', { name: 'Đăng nhập', exact: true })).toHaveCount(0)
  await expect(header(page).getByRole('link', { name: 'Đăng ký', exact: true })).toHaveCount(0)
}

const loginByForm = async (page: Page, key: 'student' | 'teacher' | 'pendingTeacher') => {
  const portal = ACCOUNTS[key].role === 'giaovien' ? 'giaovien' : 'hocsinh'

  await page.goto(`${BASE_URL}/login/${portal}`)
  await page.getByLabel('Email').fill(ACCOUNTS[key].email)
  await page.getByLabel('Mật khẩu').fill(PASSWORD)
  await page.getByRole('main').getByRole('button', { name: 'Đăng nhập' }).click()
}

const loginByApi = async (page: Page, key: AccountKey) => {
  const response = await page.request.post(`${BASE_URL}/api/users/login`, {
    data: { email: ACCOUNTS[key].email, password: PASSWORD },
  })
  expect(response.ok()).toBe(true)
}

const logoutFromHeader = async (page: Page, key: AccountKey) => {
  await accountToggle(page, key).click()
  await header(page).getByRole('button', { name: 'Đăng xuất' }).click()
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  payload = await getPayload({ config })

  const emails = Object.values(ACCOUNTS).map(({ email }) => email)
  await payload.delete({ collection: 'users', where: { email: { in: emails } } })

  for (const [key, account] of Object.entries(ACCOUNTS) as [AccountKey, (typeof ACCOUNTS)[AccountKey]][]) {
    users[key] = await payload.create({
      collection: 'users',
      data: {
        ...account,
        password: PASSWORD,
        accountStatus: key === 'pendingTeacher' ? 'pending' : 'active',
      },
    })
  }
})

test.beforeEach(async () => {
  await payload.update({ collection: 'users', id: users.teacher.id, data: { accountStatus: 'active' } })
})

test.afterAll(async () => {
  const emails = Object.values(ACCOUNTS).map(({ email }) => email)
  await payload.delete({ collection: 'users', where: { email: { in: emails } } })
})

test.describe('Header theo trạng thái đăng nhập', () => {
  test('khách thấy Đăng ký / Đăng nhập ở Header và các link đăng ký ở Footer', async ({ page }) => {
    await page.goto(BASE_URL)
    await expectGuestHeader(page)
    await expect(footer(page).getByRole('link', { name: 'Đăng ký Giáo viên' })).toBeVisible()
    await expect(footer(page).getByRole('button', { name: 'Đăng xuất' })).toHaveCount(0)
  })

  test('học sinh đăng nhập: Header đổi ngay, giữ nguyên khi chuyển trang và refresh', async ({ page }) => {
    await page.goto(BASE_URL)
    await expectGuestHeader(page)

    await loginByForm(page, 'student')
    await expect(page).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)
    await expectSignedInHeader(page, 'student')

    // Footer: không còn lời mời đăng nhập/đăng ký
    await expect(footer(page).getByRole('link', { name: 'Trang cá nhân' })).toBeVisible()
    await expect(footer(page).getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
    await expect(footer(page).getByRole('link', { name: 'Đăng nhập' })).toHaveCount(0)

    // Chuyển trang phía client (layout không render lại) và tải lại trang
    await header(page).getByRole('link', { name: 'Trang chủ', exact: true }).click()
    await expect(page).toHaveURL(`${BASE_URL}/`)
    await expectSignedInHeader(page, 'student')

    await header(page).getByRole('link', { name: 'Bài học', exact: true }).click()
    await expect(page).toHaveURL(`${BASE_URL}/bai-hoc`)
    await expectSignedInHeader(page, 'student')

    await page.reload()
    await expectSignedInHeader(page, 'student')

    // Tab mới dùng chung cookie
    const other = await page.context().newPage()
    await other.goto(BASE_URL)
    await expectSignedInHeader(other, 'student')

    // Dropdown: Trang cá nhân → dashboard của vai trò
    await accountToggle(page, 'student').click()
    await header(page).getByRole('link', { name: 'Trang cá nhân' }).click()
    await expect(page).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)
  })

  test('giáo viên active: đúng dashboard, trang đăng nhập/đăng ký chuyển về dashboard', async ({ page }) => {
    await loginByForm(page, 'teacher')
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/dashboard`)
    await expectSignedInHeader(page, 'teacher')

    await accountToggle(page, 'teacher').click()
    await expect(header(page).getByRole('link', { name: 'Trang cá nhân' })).toHaveAttribute(
      'href',
      '/giaovien/dashboard',
    )

    for (const path of ['/login', '/login/giaovien', '/register/hocsinh', '/register/giaovien']) {
      await page.goto(`${BASE_URL}${path}`)
      await expect(page).toHaveURL(`${BASE_URL}/giaovien/dashboard`)
    }
  })

  test('giáo viên pending không đăng nhập được và không vào được dashboard', async ({ page }) => {
    await loginByForm(page, 'pendingTeacher')
    await expect(page.getByRole('main').getByRole('alert')).toContainText('đang chờ Admin phê duyệt')
    await expect(page).toHaveURL(`${BASE_URL}/login/giaovien`)
    await expectGuestHeader(page)

    await page.goto(`${BASE_URL}/giaovien/dashboard`)
    await expect(page).toHaveURL(`${BASE_URL}/login/giaovien`)
  })

  test('giáo viên bị chuyển về pending khi phiên còn hạn chỉ thấy thông báo chờ duyệt', async ({ page }) => {
    await loginByForm(page, 'teacher')
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/dashboard`)

    await payload.update({ collection: 'users', id: users.teacher.id, data: { accountStatus: 'pending' } })

    await page.reload()
    await expect(page.getByTestId('account-pending')).toContainText('đang chờ Admin phê duyệt')
    await expect(page.getByRole('link', { name: /Bài đã nộp.*Xem lại/ })).toHaveCount(0)

    for (const path of ['/giaovien/phieu', '/giaovien/phieu/moi', '/giaovien/bai-da-nop']) {
      await page.goto(`${BASE_URL}${path}`)
      await expect(page).toHaveURL(`${BASE_URL}/giaovien/dashboard`)
    }

    // Không tự kích hoạt
    expect((await payload.findByID({ collection: 'users', id: users.teacher.id })).accountStatus).toBe('pending')
  })

  test('Admin: menu dẫn tới /admin; người dùng khác không vào được /admin', async ({ page }) => {
    await loginByApi(page, 'admin')
    await page.goto(BASE_URL)
    await expectSignedInHeader(page, 'admin')

    await accountToggle(page, 'admin').click()
    await expect(header(page).getByRole('link', { name: 'Trang quản trị' })).toHaveAttribute('href', '/admin')

    await page.goto(`${BASE_URL}/login`)
    await expect(page).toHaveURL(`${BASE_URL}/admin`)
    await expect(page.locator('span[title="Dashboard"]')).toBeVisible()

    await page.context().clearCookies()
    await loginByApi(page, 'student')
    await page.goto(`${BASE_URL}/admin`)
    await expect(page.locator('span[title="Dashboard"]')).toHaveCount(0)
  })
})

test.describe('Đăng xuất và phiên', () => {
  test('đăng xuất: Header đổi ngay, Back không mở lại dashboard, token cũ hết hiệu lực', async ({ page }) => {
    await loginByForm(page, 'student')
    await expect(page).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)
    const oldCookies = await page.context().cookies()

    await logoutFromHeader(page, 'student')
    await expect(page).toHaveURL(`${BASE_URL}/`)
    await expectGuestHeader(page)

    await page.goBack()
    await expect(page).not.toHaveURL(`${BASE_URL}/hocsinh/dashboard`)
    await expect(page.getByText('Xin chào')).toHaveCount(0)

    await page.goto(`${BASE_URL}/hocsinh/dashboard`)
    await expect(page).toHaveURL(`${BASE_URL}/login/hocsinh`)

    // Gắn lại cookie cũ: session đã bị Payload xóa nên token không còn dùng được
    await page.context().addCookies(oldCookies)
    const me = await page.request.get(`${BASE_URL}/api/users/me`)
    expect((await me.json()).user).toBeNull()
    await page.goto(BASE_URL)
    await expectGuestHeader(page)
  })

  test('đăng xuất ở tab này thì tab kia cập nhật Header', async ({ page }) => {
    await loginByForm(page, 'student')
    await expect(page).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)

    const other = await page.context().newPage()
    await other.goto(`${BASE_URL}/`)
    await expectSignedInHeader(other, 'student')

    await logoutFromHeader(page, 'student')
    await expectGuestHeader(page)

    // Không reload tab kia
    await expectGuestHeader(other)

    await other.goto(`${BASE_URL}/hocsinh/dashboard`)
    await expect(other).toHaveURL(`${BASE_URL}/login/hocsinh`)
  })

  test('cookie không hợp lệ được coi là chưa đăng nhập', async ({ page }) => {
    await page.context().addCookies([{ name: 'payload-token', value: 'khong-hop-le', url: BASE_URL }])

    await page.goto(BASE_URL)
    await expectGuestHeader(page)

    await page.goto(`${BASE_URL}/hocsinh/dashboard`)
    await expect(page).toHaveURL(`${BASE_URL}/login/hocsinh`)
  })

  test('phiên hết hạn: Header tự trở về trạng thái khách', async ({ page }) => {
    await page.clock.install()
    await loginByForm(page, 'student')
    await expect(page).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)
    await header(page).getByRole('link', { name: 'Trang chủ', exact: true }).click()
    await expectSignedInHeader(page, 'student')

    // Phía server: phiên không còn (như khi token hết hạn); phía trình duyệt: tua qua hạn token (2 giờ)
    await payload.update({ collection: 'users', id: users.student.id, data: { sessions: [] } })
    await page.clock.fastForward('02:00:05')

    await expectGuestHeader(page)
  })

  test('mobile: menu offcanvas có menu tài khoản và đăng xuất được', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })

    await loginByForm(page, 'student')
    await expect(page).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)

    await header(page).getByRole('button', { name: 'Mở menu' }).click()
    await expect(page.locator('#site-menu')).toBeVisible()
    await accountToggle(page, 'student').click()
    await expect(header(page).getByRole('link', { name: 'Trang cá nhân' })).toBeVisible()

    await header(page).getByRole('button', { name: 'Đăng xuất' }).click()
    await expect(page).toHaveURL(`${BASE_URL}/`)

    await header(page).getByRole('button', { name: 'Mở menu' }).click()
    await expectGuestHeader(page)

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })
})

test.describe('Hết phiên khi đang nhập phiếu và thu hồi phiên từ thiết bị khác', () => {
  test('phiên hết hạn lúc đang nhập phiếu: không chuyển trang, giữ dữ liệu, đăng nhập lại ở thẻ mới', async ({
    page,
  }) => {
    await page.clock.install()
    await loginByForm(page, 'teacher')
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/dashboard`)

    await page.goto(`${BASE_URL}/giaovien/phieu/moi/phieu-theo-doi-ca`)
    await page.getByLabel(/^Trẻ/).fill('Dữ liệu đang nhập E2E')

    // Server: phiên không còn; trình duyệt: tua qua hạn token
    await payload.update({ collection: 'users', id: users.teacher.id, data: { sessions: [] } })
    await page.clock.fastForward('02:00:05')

    await expect(page.getByTestId('session-ended')).toBeVisible()
    await expectGuestHeader(page)
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/phieu/moi/phieu-theo-doi-ca`)
    await expect(page.getByLabel(/^Trẻ/)).toHaveValue('Dữ liệu đang nhập E2E')

    // Đăng nhập lại ở thẻ mới: thẻ đang nhập tự cập nhật Header, dữ liệu vẫn còn
    const other = await page.context().newPage()
    await loginByForm(other, 'teacher')
    await expect(other).toHaveURL(`${BASE_URL}/giaovien/dashboard`)

    await expect(page.getByTestId('session-ended')).toHaveCount(0)
    await expectSignedInHeader(page, 'teacher')
    await expect(page).toHaveURL(`${BASE_URL}/giaovien/phieu/moi/phieu-theo-doi-ca`)
    await expect(page.getByLabel(/^Trẻ/)).toHaveValue('Dữ liệu đang nhập E2E')
  })

  test('đăng xuất chỉ thu hồi phiên của thiết bị đó; "mọi phiên" thu hồi cả thiết bị khác', async ({ browser }) => {
    const deviceA = await browser.newContext()
    const deviceB = await browser.newContext()
    const pageA = await deviceA.newPage()
    const pageB = await deviceB.newPage()
    const me = async (page: Page) => (await (await page.request.get(`${BASE_URL}/api/users/me`)).json()).user

    await loginByForm(pageA, 'student')
    await loginByForm(pageB, 'student')
    await expect(pageB).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)

    // Thiết bị A đăng xuất: session của A bị xóa trên server, session của B vẫn hợp lệ
    await logoutFromHeader(pageA, 'student')
    await expectGuestHeader(pageA)
    expect(await me(pageB)).not.toBeNull()

    // Thu hồi mọi phiên (Payload: POST /api/users/logout?allSessions=true) từ thiết bị A
    await loginByForm(pageA, 'student')
    await expect(pageA).toHaveURL(`${BASE_URL}/hocsinh/dashboard`)
    expect((await pageA.request.post(`${BASE_URL}/api/users/logout?allSessions=true`)).ok()).toBe(true)

    // B vẫn còn cookie nhưng server đã thu hồi phiên
    expect(await me(pageB)).toBeNull()

    // B chuyển trang phía client vào trang được bảo vệ: bị đưa về /login, Header tự sửa (không reload, không polling)
    await header(pageB).getByRole('link', { name: 'Bài học', exact: true }).click()
    await expect(pageB).toHaveURL(`${BASE_URL}/login`)
    await expectGuestHeader(pageB)

    await deviceA.close()
    await deviceB.close()
  })
})

test.describe('Trang 404', () => {
  test('URL không tồn tại hiển thị trang 404 tiếng Việt, có nút về Trang chủ', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/trang-khong-ton-tai`)
    expect(response?.status()).toBe(404)

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await expect(page.getByText('Không tìm thấy trang bạn yêu cầu.')).toBeVisible()

    await page.getByRole('link', { name: 'Về Trang chủ' }).click()
    await expect(page).toHaveURL(`${BASE_URL}/`)
  })
})
