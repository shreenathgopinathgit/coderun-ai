import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const client = await page.context().newCDPSession(page)
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const timing = await page.evaluate(() => {
  const start = performance.now()
  return new Promise((r) => {
    requestAnimationFrame(() => {
      const t0 = performance.now()
      requestAnimationFrame(() => {
        const t1 = performance.now()
        r({ frameDelta: t1 - t0, elapsed: t1 - start })
      })
    })
  })
})
const nav = await page.evaluate(() => JSON.stringify(performance.getEntriesByType('navigation')[0]))
console.log('frame delta ms:', timing.frameDelta, '| nav:', nav.slice(0, 200))
await browser.close()
