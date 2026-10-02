import { chromium } from 'playwright'
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const out = await page.evaluate(() => {
  const glows = [...document.querySelectorAll('.hero-bg__glow')]
  const grain = document.querySelector('.hero-bg__grain')
  const vignette = document.querySelector('.hero-bg__vignette')
  const g0 = glows[0] ? getComputedStyle(glows[0]) : null
  const g1 = glows[1] ? getComputedStyle(glows[1]) : null
  const g2 = glows[2] ? getComputedStyle(glows[2]) : null
  const gr = grain ? getComputedStyle(grain) : null
  return {
    glowCount: glows.length,
    hasGrain: !!grain,
    hasVignette: !!vignette,
    g0: g0 ? { bg: g0.backgroundImage.slice(0,80), anim: g0.animationName } : null,
    g1: g1 ? { bg: g1.backgroundImage.slice(0,80), anim: g1.animationName } : null,
    g2: g2 ? { bg: g2.backgroundImage.slice(0,80), anim: g2.animationName } : null,
    grain: gr ? { opacity: gr.opacity, anim: gr.animationName } : null,
  }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
