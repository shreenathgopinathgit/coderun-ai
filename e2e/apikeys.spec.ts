import { test, expect } from '@playwright/test'
import { startMock } from '../scripts/mock-openai.mjs'

test('API keys modal: add, fetch models, test connection, activate, persist', async ({ page }) => {
  const server = await startMock('stream')
  const base = `http://localhost:${server.address().port}`

  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'API Keys', exact: true }).click()

  await expect(page.getByRole('dialog', { name: 'API Keys' })).toBeVisible()

  // Fill the form against the mock server.
  await page.getByLabel('Profile name').fill('Mock server')
  await page.getByLabel('Provider').selectOption('Custom (OpenAI-compatible)')
  await page.getByLabel('Base URL').fill(base)
  await page.getByTestId('api-key-input').fill('test-key')
  await page.getByTestId('model-name-input').fill('mock-stream')

  await page.getByRole('button', { name: 'Fetch models' }).click()
  // The model dropdown is the second combobox (the first is the provider).
  // A `<select>` does not render its options open, so assert on the value.
  const modelSelect = page.getByRole('combobox').nth(1)
  await expect(modelSelect).toHaveValue('mock-stream')

  await page.getByRole('button', { name: 'Test connection' }).click()
  await expect(page.getByText('Connection OK.')).toBeVisible()

  await page.getByRole('button', { name: 'Add profile' }).click()
  await expect(page.getByText('Mock server')).toBeVisible()

  // Mark it active and confirm exactly one active profile.
  await page.getByRole('button', { name: 'Set Mock server as active profile' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(page.getByRole('listitem')).toHaveClass(/border-\[var\(--color-accent\)\]/)

  // Reload and confirm the profile and active state persist.
  await page.reload()
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'API Keys', exact: true }).click()
  await expect(page.getByText('Mock server').first()).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveClass(/border-\[var\(--color-accent\)\]/)

  server.close()
})

test('API keys modal: validation blocks an empty key', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'API Keys', exact: true }).click()

  await page.getByLabel('Profile name').fill('Empty')
  await page.getByRole('button', { name: 'Add profile' }).click()
  await expect(page.getByRole('alert')).toHaveText('An API key is required.')
})