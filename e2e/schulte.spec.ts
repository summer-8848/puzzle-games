import { test, expect } from '@playwright/test'

test.describe('Schulte Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/schulte')
  })

  test('页面标题显示正确', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('舒尔特方格')
  })

  test('初始状态显示开始按钮', async ({ page }) => {
    await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible()
  })

  test('初始状态显示"点击下方按钮开始"', async ({ page }) => {
    await expect(page.locator('.text-gray-400.text-lg')).toContainText('点击下方按钮开始')
  })

  test('模式选择按钮存在', async ({ page }) => {
    await expect(page.getByRole('button', { name: '数字' })).toBeVisible()
    await expect(page.getByRole('button', { name: '大写字母' })).toBeVisible()
    await expect(page.getByRole('button', { name: '小写字母' })).toBeVisible()
  })

  test('规格选择按钮存在', async ({ page }) => {
    await expect(page.getByRole('button', { name: '3×3' })).toBeVisible()
    await expect(page.getByRole('button', { name: '4×4' })).toBeVisible()
    await expect(page.getByRole('button', { name: '5×5' })).toBeVisible()
    await expect(page.getByRole('button', { name: '6×6' })).toBeVisible()
  })

  test('点击开始游戏进入观察期', async ({ page }) => {
    await page.getByRole('button', { name: '开始游戏' }).click()
    await expect(page.locator('.text-amber-500')).toContainText('观察期')
  })

  test('切换模式为大写字母', async ({ page }) => {
    await page.getByRole('button', { name: '大写字母' }).click()
    await expect(page.getByRole('button', { name: '大写字母' })).toHaveClass(/shadow-blue-500/)
  })

  test('切换规格为3×3', async ({ page }) => {
    await page.getByRole('button', { name: '3×3' }).click()
    await expect(page.getByRole('button', { name: '3×3' })).toHaveClass(/shadow-blue-500/)
  })

  test('游戏中规格按钮禁用', async ({ page }) => {
    await page.getByRole('button', { name: '开始游戏' }).click()
    // 等待观察期结束（5秒）后游戏开始
    await page.waitForTimeout(6000)
    // 游戏中的按钮应该有禁用样式
    await expect(page.getByRole('button', { name: '5×5' })).toHaveClass(/cursor-not-allowed/)
  })

  test('返回按钮存在', async ({ page }) => {
    await expect(page.getByRole('button', { name: '返回' })).toBeVisible()
  })
})
