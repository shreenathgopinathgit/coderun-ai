import { test, expect, type Page } from '@playwright/test'
import { startMock } from '../scripts/mock-openai.mjs'

/**
 * Add a mock profile against the in-process mock server, then activate it.
 * Returns once the Ask tab shows the chat input.
 */
async function addAndActivateMockProfile(page: Page, base: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'API Keys', exact: true }).click()

  await page.getByLabel('Profile name').fill('Mock server')
  await page.getByLabel('Provider').selectOption('Custom (OpenAI-compatible)')
  await page.getByLabel('Base URL').fill(base)
  await page.getByTestId('api-key-input').fill('test-key')
  await page.getByTestId('model-name-input').fill('mock-stream')

  await page.getByRole('button', { name: 'Add profile' }).click()
  await page.getByRole('button', { name: 'Set Mock server as active profile' }).click()
  await page.getByRole('button', { name: 'Close modal' }).click()

  await page.goto('/practice')
  await expect(page.getByRole('button', { name: 'Ask' })).toBeVisible()
  await page.getByRole('button', { name: 'Ask' }).click()
}

test('Ask tab: no key shows the Add an API key prompt', async ({ page }) => {
  await page.goto('/practice')
  await page.getByRole('button', { name: 'Ask' }).click()
  await expect(page.getByText('Add an API key to chat')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add an API key' })).toBeVisible()
})

test('Ask tab: sending a message shows a streamed reply with a code block and copy button', async ({ page }) => {
  const server = await startMock('markdown')
  const base = `http://localhost:${server.address().port}`
  try {
    await addAndActivateMockProfile(page, base)

    const input = page.getByPlaceholder(/Ask a question/)
    await input.fill('Write a hello world function')
    await input.press('Enter')

    // The streamed reply contains the mock's words.
    await expect(page.getByText('Here is a function.')).toBeVisible()

    // The reply is rendered as markdown; a code block should be present.
    const codeBlock = page.locator('pre').first()
    await expect(codeBlock).toBeVisible()

    // The copy button sits on the code block and writes the code to the clipboard.
    // It is opacity-0 until the group is hovered, so hover first.
    await codeBlock.hover()
    const copyButton = codeBlock.locator('button', { hasText: 'Copy' })
    await expect(copyButton).toBeVisible()
    // Verify the code block contains the expected code.
    await expect(codeBlock.locator('code')).toContainText('function hello')

    // The user message is also in the list.
    await expect(page.getByText('Write a hello world function')).toBeVisible()
  } finally {
    server.close()
  }
})

test('Ask tab: Stop during a slow stream works', async ({ page }) => {
  const server = await startMock('slow', { delay: 80 })
  const base = `http://localhost:${server.address().port}`
  try {
    await addAndActivateMockProfile(page, base)

    const input = page.getByPlaceholder(/Ask a question/)
    await input.fill('Slow question')
    await input.press('Enter')

    // The Stop button appears while the reply streams (it's inside the chat input area).
    const stopButton = page.locator('[class*="border-t"]').getByRole('button', { name: 'Stop' })
    await expect(stopButton).toBeVisible()
    await stopButton.click()

    // After stopping, the input is usable again and Send returns.
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
    await expect(page.getByPlaceholder(/Ask a question/)).not.toBeDisabled()
  } finally {
    server.close()
  }
})

test('Ask tab: history persists across a reload', async ({ page }) => {
  const server = await startMock('markdown')
  const base = `http://localhost:${server.address().port}`
  try {
    await addAndActivateMockProfile(page, base)

    const input = page.getByPlaceholder(/Ask a question/)
    await input.fill('Remember this')
    await input.press('Enter')
    await expect(page.getByText('Here is a function.')).toBeVisible()

    // Reload: the conversation and the input are both still there.
    await page.reload()
    await page.getByRole('button', { name: 'Ask' }).click()
    await expect(page.getByText('Remember this')).toBeVisible()
    await expect(page.getByText('Here is a function.')).toBeVisible()
  } finally {
    server.close()
  }
})

test('Ask tab: Clear chat works', async ({ page }) => {
  const server = await startMock('markdown')
  const base = `http://localhost:${server.address().port}`
  try {
    await addAndActivateMockProfile(page, base)

    const input = page.getByPlaceholder(/Ask a question/)
    await input.fill('To be cleared')
    await input.press('Enter')
    await expect(page.getByText('Here is a function.')).toBeVisible()

    // Clear chat wipes the conversation and shows the empty state.
    await page.getByRole('button', { name: 'Clear chat' }).click()
    await expect(page.getByText('No messages yet')).toBeVisible()
    await expect(page.getByText('To be cleared')).toHaveCount(0)
  } finally {
    server.close()
  }
})

test('Ask tab: a client error shows a message with a Retry button', async ({ page }) => {
  const server = await startMock('401')
  const base = `http://localhost:${server.address().port}`
  try {
    await addAndActivateMockProfile(page, base)

    const input = page.getByPlaceholder(/Ask a question/)
    await input.fill('This should fail')
    await input.press('Enter')

    await expect(page.getByText('The API key was rejected.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
  } finally {
    server.close()
  }
})