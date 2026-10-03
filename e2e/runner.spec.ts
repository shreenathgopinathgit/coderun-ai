import { test, expect, type Page } from '@playwright/test'

async function typeInEditor(page: Page, code: string) {
  // Monaco mounts asynchronously; type only once the editor is ready,
  // otherwise the keystrokes are lost and the stored code is stale.
  await page.locator('[data-testid="editor"] .monaco-editor').first().waitFor()
  await page.locator('[data-testid="editor"]').first().click()
  await page.keyboard.press('Control+a')
  await page.keyboard.type(code)
}

async function clickRun(page: Page) {
  await page.getByRole('button', { name: 'Run' }).click()
}

test('JS console.log output appears in the Console tab', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('javascript')
  await typeInEditor(page, 'function main() { console.log("hello from runner") }')
  await clickRun(page)
  await expect(page.getByText('hello from runner')).toBeVisible()
})

test('infinite loop shows Time Limit Exceeded and the page stays responsive', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('javascript')
  await typeInEditor(page, 'function main() { while(true) {} }')
  await clickRun(page)
  await expect(page.getByText('Time Limit Exceeded')).toBeVisible({ timeout: 8000 })
  await page.locator('[data-testid="editor"] .monaco-editor').first().waitFor()
  await page.locator('[data-testid="editor"]').first().click()
  await page.keyboard.type('x')
})

test('Python print appears in the Console tab', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('python')
  await typeInEditor(page, 'print("py hello")')
  await clickRun(page)
  await expect(page.getByText('py hello')).toBeVisible({ timeout: 60000 })
}, 60000)

test('a language without an executor shows an honest message', async ({ page }) => {
  await page.goto('/practice')
  await page.locator('select').first().selectOption('java')
  await clickRun(page)
  await expect(
    page.getByText('No executor is configured for this language'),
  ).toBeVisible()
})