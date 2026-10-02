import { chromium } from 'playwright'

const PORT = 5173
const BASE = `http://localhost:${PORT}`

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
})

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

const checks = await page.evaluate(() => {
  const h1 = document.querySelector('h1')
  const badge = document.querySelector('span.rounded-full')
  const startBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Start now'))
  const addBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Add API key'))
  const style = getComputedStyle(h1)
  const badgeStyle = getComputedStyle(badge)
  const startStyle = getComputedStyle(startBtn)
  const addStyle = getComputedStyle(addBtn)
  const bodyStyle = getComputedStyle(document.body)

  return {
    headline: {
      fontFamily: style.fontFamily,
      textTransform: style.textTransform,
      color: style.color,
      fontSize: style.fontSize,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
      text: h1.textContent.trim(),
    },
    badge: {
      text: badge.textContent.trim(),
      color: badgeStyle.color,
    },
    buttons: {
      startNow: {
        text: startBtn.textContent.trim(),
        borderRadius: startStyle.borderRadius,
        background: startStyle.backgroundColor,
        color: startStyle.color,
      },
      addApiKey: {
        text: addBtn.textContent.trim(),
        borderRadius: addStyle.borderRadius,
        background: addStyle.backgroundColor,
        border: addStyle.border,
        color: addStyle.color,
      },
    },
    bodyBg: bodyStyle.backgroundColor,
    hasGlowLayers: document.querySelectorAll('.hero-bg__glow').length,
    hasGrainLayer: document.querySelectorAll('.hero-bg__grain').length,
  }
})

console.log(JSON.stringify(checks, null, 2))
await browser.close()