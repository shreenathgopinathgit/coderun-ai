import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const out = await page.evaluate(() => {
  const main = document.querySelector('main')
  return { className: main?.className, tag: main?.tagName, html: document.documentElement.innerHTML.slice(0, 600) }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
