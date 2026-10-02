import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const out = await page.evaluate(() => {
  const h1 = document.querySelector('h1')
  const cs = getComputedStyle(h1)
  const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.includes('Start now') || b.textContent.includes('Add API key'))
  const b0 = btns[0] ? getComputedStyle(btns[0]) : null
  return {
    headlineFont: cs.fontFamily.split(',')[0].trim(),
    headlineSize: cs.fontSize,
    headlineColor: cs.color,
    btn0Text: btns[0]?.textContent.trim(),
    btn0BorderRadius: b0?.borderRadius,
    btn0Bg: b0?.backgroundColor,
    bodyScrollHeight: document.body.scrollHeight,
    viewportHeight: window.innerHeight,
  }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
