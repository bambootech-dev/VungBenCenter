import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

// Sau khi hydrate, list view của Payload có thể router.replace thêm ?depth=…&limit=… vào URL,
// nên so URL tuyệt đối là race. Giữ nguyên pathname, chỉ cho phép đúng hai tham số này.
const listViewURL = (slug: string) =>
  new RegExp(`^http://localhost:3000/admin/collections/${slug}(\\?(depth|limit)=\\d+(&(depth|limit)=\\d+)?)?$`)

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL(listViewURL('users'))
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to media list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/media')
    await expect(page).toHaveURL(listViewURL('media'))
    const listViewArtifact = page.locator('h1', { hasText: 'Media' }).first()
    await expect(listViewArtifact).toBeVisible()
  })
})
