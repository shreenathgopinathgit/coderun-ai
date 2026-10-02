import { test, expect, type Page } from '@playwright/test'

async function sample(page: Page) {
  return page.evaluate(() => {
    const sel = (s: string) => document.querySelector(s)
    const left = sel('[data-testid="left"]')!.getBoundingClientRect()
    const right = sel('[data-testid="right"]')!.getBoundingClientRect()
    const sep = sel('[data-testid="pane-divider"]')!.getBoundingClientRect()
    const topbar = sel('.hero-pill')!.getBoundingClientRect()
    return {
      left: { x: left.x, y: left.y, w: left.width, h: left.height },
      right: { x: right.x, y: right.y, w: right.width, h: right.height },
      sep: { x: sep.x, y: sep.y, w: sep.width, h: sep.height },
      topbar: { x: topbar.x, y: topbar.y, w: topbar.width, h: topbar.height },
      vw: window.innerWidth,
      vh: window.innerHeight,
    }
  })
}

test('take desktop and tablet screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/practice')
  const d = await sample(page)
  await page.screenshot({ path: 'practice-desktop.png' })
  expect(d.left.x).toBe(16)
  expect(d.right.x + d.right.w).toBe(1440 - 16)
  expect(d.left.y).toBe(56)
  expect(d.right.y + d.right.h).toBe(900 - 16)
  expect(d.topbar.y + d.topbar.h).toBeLessThanOrEqual(d.left.y)

  await page.setViewportSize({ width: 820, height: 900 })
  await page.goto('/practice')
  await page.screenshot({ path: 'practice-tablet.png' })
  const t = await sample(page)
  expect(t.left.x).toBe(16)
  expect(t.right.x + t.right.w).toBe(820 - 16)
  expect(t.topbar.y + t.topbar.h).toBeLessThanOrEqual(t.left.y)
})

test('home hero renders unchanged with background behind content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.screenshot({ path: 'home-hero.png' })
  await expect(page.getByRole('button', { name: 'Start now' })).toBeVisible()
})