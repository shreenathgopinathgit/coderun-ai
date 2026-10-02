import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 5173
const BASE = `http://localhost:${PORT}`

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE, { method: 'HEAD' })
      if (res.ok || res.status < 500) return true
    } catch {
      // not ready yet
    }
    await sleep(500)
  }
  throw new Error('dev server did not start')
}

const server = spawn('npm', ['run', 'dev'], {
  stdio: 'ignore',
  shell: true,
  env: { ...process.env, FORCE_COLOR: '0' },
})

try {
  await waitForServer()
  await sleep(1000)

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })

  const contexts = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]

  for (const ctx of contexts) {
    const page = await browser.newPage({ viewport: { width: ctx.width, height: ctx.height } })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.screenshot({ path: `hero-${ctx.name}.png`, fullPage: false })
    await page.close()
  }

  await browser.close()
  console.log('screenshots written: hero-desktop.png, hero-mobile.png')
} finally {
  server.kill()
  process.exit(0)
}