import { test, expect } from '@playwright/test'
import { startMock } from '../scripts/mock-openai.mjs'

async function openModal(page: ReturnType<typeof test>['extend']['page']) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'API Keys', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'API Keys' })).toBeVisible()
}

test('API keys modal: add, fetch models, test connection, activate, persist', async ({ page }) => {
  const server = await startMock('stream')
  const base = `http://localhost:${server.address().port}`

  await openModal(page)

  // Fill the form against the mock server.
  await page.getByLabel('Profile name').fill('Mock server')
  await page.getByLabel('Provider').selectOption('Custom (OpenAI-compatible)')
  await page.getByLabel('Base URL').fill(base)
  await page.getByTestId('api-key-input').fill('test-key')
  await page.getByTestId('model-name-input').fill('mock-stream')

  await page.getByRole('button', { name: 'Fetch models' }).click()
  await expect(page.getByText(/2 models fetched/)).toBeVisible()

  await page.getByRole('button', { name: 'Test connection' }).click()
  await expect(page.getByText('Connection OK.')).toBeVisible()

  await page.getByRole('button', { name: 'Add profile' }).click()
  await expect(page.getByText('Mock server')).toBeVisible()

  // The first saved profile becomes active automatically, so it shows the
  // Active badge and the accent border without an extra click.
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(page.getByRole('listitem')).toHaveClass(/border-\[var\(--color-accent\)\]/)
  await expect(page.getByText('Active')).toBeVisible()

  // Reload and confirm the profile and active state persist.
  await page.reload()
  await openModal(page)
  await expect(page.getByText('Mock server').first()).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveClass(/border-\[var\(--color-accent\)\]/)

  server.close()
})

test('API keys modal: validation blocks an empty key', async ({ page }) => {
  await openModal(page)

  await page.getByLabel('Profile name').fill('Empty')
  await page.getByRole('button', { name: 'Add profile' }).click()
  await expect(page.getByRole('alert')).toHaveText('An API key is required.')
})

test('switching the preset updates every field and clears the model list', async ({ page }) => {
  const server = await startMock('models')
  const base = `http://localhost:${server.address().port}`

  await openModal(page)

  await page.getByLabel('Provider').selectOption('Groq')
  await expect(page.getByLabel('Base URL')).toHaveValue('https://api.groq.com/openai/v1')
  await expect(page.getByTestId('model-name-input')).toHaveValue('llama-3.3-70b-versatile')
  await expect(page.getByLabel('Profile name')).toHaveValue('Groq')

  // Switch to Mistral: provider, URL, hint and default model all update, and
  // the name follows the preset only because it was never edited.
  await page.getByLabel('Provider').selectOption('Mistral')
  await expect(page.getByLabel('Provider')).toHaveValue('mistral')
  await expect(page.getByLabel('Base URL')).toHaveValue('https://api.mistral.ai/v1')
  await expect(page.getByTestId('model-name-input')).toHaveValue('mistral-small-latest')
  await expect(page.getByLabel('Profile name')).toHaveValue('Mistral')

  // Editing the base URL away from the preset's URL switches the provider to
  // Custom so the dropdown reflects the draft's provider.
  await page.getByLabel('Base URL').fill('https://example.com/v1')
  await expect(page.getByLabel('Provider')).toHaveValue('custom')

  // Point the base URL at the mock and fetch models. The Mistral-shaped
  // response fills the single model field with the chat-capable model and
  // hides the embedding model.
  await page.getByLabel('Provider').selectOption('Mistral')
  await page.getByLabel('Base URL').fill(base)
  await page.getByTestId('api-key-input').fill('test-key')
  await page.getByRole('button', { name: 'Fetch models' }).click()
  await expect(page.getByText(/1 model fetched/)).toBeVisible()
  await expect(page.getByTestId('model-name-input')).toHaveValue('mistral-small-latest')

  // Test connection succeeds against the mock.
  await page.getByRole('button', { name: 'Test connection' }).click()
  await expect(page.getByText('Connection OK.')).toBeVisible()

  server.close()
})

test('a wrong model shows a friendly message', async ({ page }) => {
  const server = await startMock('invalid-model', { invalidModel: 'llama-3.3-70b-versatile' })
  const base = `http://localhost:${server.address().port}`

  await openModal(page)
  await page.getByLabel('Provider').selectOption('Custom (OpenAI-compatible)')
  await page.getByLabel('Base URL').fill(base)
  await page.getByTestId('api-key-input').fill('test-key')
  await page.getByTestId('model-name-input').fill('llama-3.3-70b-versatile')

  await page.getByRole('button', { name: 'Test connection' }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'The provider rejected the model "llama-3.3-70b-versatile". Pick another model from the list.',
  )

  server.close()
})