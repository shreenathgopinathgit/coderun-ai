import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const out = await page.evaluate(() => {
  const main = document.querySelector('main')
  const cs = getComputedStyle(main)
  const divs = [...document.querySelectorAll('div')].map(d => ({ cls: d.className.slice(0,60), pos: getComputedStyle(d).position }))
  return {
    mainClass: main.className,
    mainPosition: cs.position,
    mainDisplay: cs.display,
    mainZIndex: cs.zIndex,
    mainInset: cs.inset,
    divs,
    sheetCount: document.styleSheets.length,
  }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
