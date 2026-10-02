import { test, expect } from '@playwright/test'

test('practice page loads with no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))
  await page.goto('/practice')
  await expect(page.getByRole('button', { name: 'Ask' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Question' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pop-out' })).toBeVisible()
  await page.screenshot({ path: 'practice-page.png' })
  expect(errors, `console errors: ${errors.join('; ')}`).toEqual([])
})