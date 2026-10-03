import { test, expect } from '@playwright/test'

/**
 * Seeds an active profile in persisted state before the app loads, so the
 * test exercises the "profile already active" path without needing the mock
 * server or a real API key round-trip.
 */
function seedActiveProfile(page: ReturnType<typeof test>['extend']['page']) {
  return page.addInitScript(() => {
    const profile = {
      id: 'seeded-active',
      name: 'Seeded',
      provider: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: 'test-key-123',
      model: 'llama-3.3-70b-versatile',
      active: true,
    }
    localStorage.setItem(
      'codeforge-ai:state',
      JSON.stringify({
        state: {
          profiles: [profile],
          activeProfileId: 'seeded-active',
          practice: {
            lastLanguage: 'python',
            paneSizes: { left: 42, right: 58 },
            editorHeight: { editor: 55, output: 45 },
            codeByQuestion: {},
          },
          chat: {
            messages: [],
            includeContext: true,
            lastRequestTokens: null,
            sessionTokens: 0,
          },
          lastRun: { result: null },
        },
        version: 0,
      }),
    )
  })
}

test('burger menu API Keys opens the modal when a profile is already active', async ({ page }) => {
  await seedActiveProfile(page)
  await page.goto('/practice')
  await page.getByRole('button', { name: 'Ask' }).click()
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('button', { name: 'API Keys', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'API Keys' })).toBeVisible()
})