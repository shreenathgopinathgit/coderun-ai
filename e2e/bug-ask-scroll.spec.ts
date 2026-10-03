import { test, expect } from '@playwright/test'
import { startMock } from '../scripts/mock-openai.mjs'

/**
 * Add a mock profile against the in-process mock server, then activate it.
 * Returns once the Ask tab shows the chat input.
 */
async function addAndActivateMockProfile(page: ReturnType<typeof test>['extend']['page'], base: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'API Keys', exact: true }).click()

  await page.getByLabel('Profile name').fill('Mock server')
  await page.getByLabel('Provider').selectOption('Custom (OpenAI-compatible)')
  await page.getByLabel('Base URL').fill(base)
  await page.getByTestId('api-key-input').fill('test-key')
  await page.getByTestId('model-name-input').fill('mock-stream')

  await page.getByRole('button', { name: 'Add profile' }).click()
  // The first saved profile becomes active automatically.
  await expect(page.getByRole('listitem')).toHaveClass(/border-\[var\(--color-accent\)\]/)
  await page.getByRole('button', { name: 'Close modal' }).click()

  await page.goto('/practice')
  await expect(page.getByRole('button', { name: 'Ask' })).toBeVisible()
  await page.getByRole('button', { name: 'Ask' }).click()
}

async function sendMany(page: ReturnType<typeof test>['extend']['page'], count: number) {
  const input = page.getByPlaceholder(/Ask a question/)
  for (let i = 0; i < count; i++) {
    await input.fill('question ' + i)
    await input.press('Enter')
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(500)
}

/**
 * The Ask tab message list must be scrollable: long answers push content off
 * screen and the input row stays pinned to the bottom of the viewport.
 */
test('Ask tab: long conversation is scrollable and the input stays in view', async ({ page }) => {
  const server = await startMock('stream')
  const base = `http://localhost:${server.address().port}`
  try {
    await addAndActivateMockProfile(page, base)
    await sendMany(page, 12)

    const list = page.locator('.flex-1.min-h-0.overflow-y-auto').first()
    await expect(list).toHaveCSS('overflow-y', 'auto')

    const before = await list.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTop: el.scrollTop,
    }))
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight)
    // Auto-scroll keeps the newest reply near the bottom.
    expect(before.scrollTop).toBeGreaterThan(0)

    // The user can scroll back up and the list follows.
    await list.evaluate((el) => (el.scrollTop = 0))
    await page.waitForTimeout(100)
    const afterScroll = await list.evaluate((el) => el.scrollTop)
    expect(afterScroll).toBe(0)

    // Scrolling back to the bottom resumes following.
    await list.evaluate((el) => (el.scrollTop = el.scrollHeight))
    await page.waitForTimeout(100)
    const afterBottom = await list.evaluate((el) => el.scrollTop)
    expect(afterBottom).toBeGreaterThan(0)

    // The input row stays pinned at the bottom of the viewport.
    const inputRow = page.locator('.border-t').last()
    const inputBox = await inputRow.boundingBox()
    const viewport = page.viewportSize()!
    expect(inputBox).not.toBeNull()
    expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(viewport.height + 1)
  } finally {
    server.close()
  }
})

test('Ask tab: scrollable at tablet width (820px)', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 })
  const server = await startMock('stream')
  const base = `http://localhost:${server.address().port}`
  try {
    await addAndActivateMockProfile(page, base)
    await sendMany(page, 12)

    const list = page.locator('.flex-1.min-h-0.overflow-y-auto').first()
    const before = await list.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight)

    // The input stays inside the viewport at tablet width.
    const inputRow = page.locator('.border-t').last()
    const inputBox = await inputRow.boundingBox()
    const viewport = page.viewportSize()!
    expect(inputBox!.y + inputBox!.height).toBeLessThanOrEqual(viewport.height + 1)
  } finally {
    server.close()
  }
})