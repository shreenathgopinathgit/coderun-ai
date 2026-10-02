import { chromium } from 'playwright'

const PORT = 5173
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const out = await page.evaluate(() => {
  const main = document.querySelector('main')
  const cs = getComputedStyle(main)
  const bgImg = cs.backgroundImage
  const radialCount = (bgImg.match(/radial-gradient/g) || []).length
  const animationCount = (document.styleSheets[1]?.cssRules
    ? [...document.styleSheets[1].cssRules].filter((r) => r.type === r.KEYFRAMES_RULE).length
    : 0)
  return {
    bgImg: bgImg.slice(0, 200),
    bgSize: cs.backgroundSize,
    radialCount,
    animationCount,
  }
})

console.log(JSON.stringify(out, null, 2))
await browser.close()