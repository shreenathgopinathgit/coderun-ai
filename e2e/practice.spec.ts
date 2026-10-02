import { test, expect } from '@playwright/test'

test('practice page loads with no console errors', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
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
  await page.screenshot({ path: 'practice-desktop.png' })
  expect(errors, `console errors: ${errors.join('; ')}`).toEqual([])
})

test('practice page at tablet width has no overlap', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 })
  await page.goto('/practice')
  await page.screenshot({ path: 'practice-tablet.png' })
})

test('pane sizes persist after a reload', async ({ page }) => {
  await page.goto('/practice')
  const handle = page.locator('[data-testid="pane-divider"]').first()
  const box = await handle.boundingBox()
  expect(box).not.toBeNull()
  const initialX = box!.x + box!.width / 2
  await page.mouse.down(initialX, box!.y + box!.height / 2)
  await page.mouse.move(initialX + 120, box!.y + box!.height / 2)
  await page.mouse.up()
  await page.reload()
  const after = await page.locator('[data-testid="left"]').boundingBox()
  expect(after!.width).toBeGreaterThan(200)
})