import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const out = await page.evaluate(() => {
  const main = document.querySelector('main')
  // query pseudo children via ::before and ::after
  const before = getComputedStyle(main, '::before')
  const after = getComputedStyle(main, '::after')
  return {
    beforeContent: before.content,
    beforeBg: before.backgroundImage.slice(0, 120),
    afterContent: after.content,
    afterBg: after.backgroundImage.slice(0, 120),
  }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
