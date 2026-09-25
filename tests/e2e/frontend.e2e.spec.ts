import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can load homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Vững Bền Center/)
    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Vững Bền Center')
  })

  test('can load role selection page', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await expect(page.getByRole('link', { name: 'Đăng nhập Giáo viên' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Đăng nhập Học sinh' })).toBeVisible()
  })
})
